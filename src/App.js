import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { enableScreens } from 'react-native-screens';
import { Provider as StoreProvider, useDispatch, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import DoseActionModal from './components/DoseActionModal';
import { Colors } from './constants/theme';
import AppNavigator from './navigation/AppNavigator';
import { navigationRef } from './navigation/RootNavigation';
import { fetchRecentLogs, recordDose } from './state/logsSlice'; // Import fetchRecentLogs
import { fetchAllSchedules } from './state/scheduleSlice';
import { persistor, store } from './state/store';
import { getPendingDoses } from './utils/doseLogic'; // Import Helper
import {
  cancelAllNotifications,
  scheduleAllLocalNotifications,
  setupNotifications
} from './utils/notificationHelper';

enableScreens();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    text: Colors.light.text,
  },
};

function AppContent() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { schedules } = useSelector((state) => state.schedule);
  
  // 1. Get recent logs to compare against schedule
  const { recentLogs } = useSelector((state) => state.logs); 

  // --- QUEUE SYSTEM STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [activeDose, setActiveDose] = useState(null); 
  const [doseQueue, setDoseQueue] = useState([]); // The line of waiting popups
  const hasCheckedPending = useRef(false); // Flag to ensure we check only once per session

  // Initial Setup
  useEffect(() => {
    setupNotifications();
  }, []);

  // Sync Logic: Fetch Schedules AND Logs when app opens
  useEffect(() => {
    if (token) {
      dispatch(fetchAllSchedules());
      dispatch(fetchRecentLogs()); // <--- Fetch History
    }
  }, [token, dispatch]);

  // Sync Notifications
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      // console.log(`[App] Syncing ${schedules.length} schedules...`);
      scheduleAllLocalNotifications(schedules);
    }
  }, [schedules]);

  // --- NEW: THE WATCHDOG LOGIC (Runs on App Open) ---
  useEffect(() => {
    // Wait until both schedules and logs are loaded
    if (schedules.length > 0 && recentLogs.length > 0 && !hasCheckedPending.current) {
      
      console.log("[App] Watchdog: Checking for missed doses today...");
      const missed = getPendingDoses(schedules, recentLogs);
      
      if (missed.length > 0) {
        console.log(`[App] Found ${missed.length} pending doses. Adding to queue.`);
        setDoseQueue(missed);
      }
      
      hasCheckedPending.current = true; // Mark done so it doesn't loop
    }
  }, [schedules, recentLogs]);


  // --- NEW: QUEUE PROCESSOR ---
  // Watches the queue. If modal is closed and queue has items, pop the next one.
  useEffect(() => {
    if (!modalVisible && doseQueue.length > 0) {
      const nextDose = doseQueue[0]; // Peek at first item
      setActiveDose(nextDose);
      setModalVisible(true);
    }
  }, [doseQueue, modalVisible]);


  // Notification Tap Listener (Push to front of queue)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data && data.medicineId) {
        // Construct dose object from notification data
        const now = new Date();
        const scheduledTime = new Date();
        if (data.scheduledTime) {
          scheduledTime.setHours(data.scheduledTime.hour, data.scheduledTime.minute, 0, 0);
        }

        const notifDose = {
          medicineId: data.medicineId,
          medicineName: data.medicineName || 'Medicine',
          scheduledTime: scheduledTime.toISOString(),
          displayTime: scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Add to FRONT of queue and ensure it shows
        setDoseQueue(prev => [notifDose, ...prev]);
      }
    });
    return () => subscription.remove();
  }, []);

  // Logout Cleanup
  useEffect(() => {
    if (!token) {
      cancelAllNotifications();
    }
  }, [token]);

  // --- HANDLERS ---
  const handleNextInQueue = () => {
    setModalVisible(false);
    setActiveDose(null);
    // Remove the finished item from the queue
    setDoseQueue(prev => prev.slice(1));
  };

  const handleTaken = () => {
    if (activeDose) {
      dispatch(recordDose({
        medicineId: activeDose.medicineId,
        scheduledTime: activeDose.scheduledTime,
        status: 'taken',
        notes: 'Confirmed via App Popup'
      }));
      handleNextInQueue();
    }
  };

  const handleMissed = () => {
    if (activeDose) {
      dispatch(recordDose({
        medicineId: activeDose.medicineId,
        scheduledTime: activeDose.scheduledTime,
        status: 'missed',
        notes: 'Confirmed via App Popup'
      }));
      handleNextInQueue();
    }
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
        
        <DoseActionModal 
          visible={modalVisible}
          medicineName={activeDose?.medicineName}
          timeString={activeDose?.displayTime}
          onTaken={handleTaken}
          onMissed={handleMissed}
        />

      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <StoreProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent /> 
      </PersistGate>
    </StoreProvider>
  );
}