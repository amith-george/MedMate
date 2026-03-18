import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bumped version to v2 to ensure fresh channel settings apply
const CHANNEL_ID = 'medmate-alarm-v1';

const DAY_MAP = {
  'Sun': 1, 'Mon': 2, 'Tue': 3, 'Wed': 4, 'Thu': 5, 'Fri': 6, 'Sat': 7
};

function parseTime(timeStr) {
  try {
    const cleanStr = timeStr.toLowerCase().trim();
    const isPM = cleanStr.includes('pm');
    const isAM = cleanStr.includes('am');
    
    let timeOnly = cleanStr.replace('pm', '').replace('am', '').trim();
    let [hourStr, minuteStr] = timeOnly.split(':');
    let hour = parseInt(hourStr, 10);
    let minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute)) return null;

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    return { hour, minute };
  } catch (e) {
    return null;
  }
}

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'MedMate Medicine Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'medalarm.wav',
      lightColor: '#FF231F7C',
    });
  }
  return true;
}

export async function scheduleAllLocalNotifications(schedules) {
  // 1. Cancel old ones first
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // 2. Ensure channel exists
  await setupNotifications();

  let count = 0;
  const now = new Date();
  const FUTURE_BUFFER_MS = 60 * 1000; 

  for (const schedule of schedules) {
    if (!schedule.isActive) {
      continue;
    }

    const medicineName = schedule.medicine?.name || 'Medicine';
    const medicineId = schedule.medicine?._id || schedule.medicine;

    // ====================================================
    // 1. DAILY & WEEKLY
    // ====================================================
    if (schedule.frequency === 'daily' || schedule.frequency === 'weekly') {
      
      for (const timeStr of schedule.times) {
        const parsed = parseTime(timeStr);
        if (!parsed) continue;

        const { hour, minute } = parsed;
        try {
          if (schedule.frequency === 'daily') {
            await scheduleNotification(medicineName, medicineId, hour, minute, null, 'daily');
            count++;
          } 
          else if (schedule.frequency === 'weekly' && schedule.daysOfWeek?.length > 0) {
            for (const dayStr of schedule.daysOfWeek) {
              const weekday = DAY_MAP[dayStr];
              if (weekday) {
                await scheduleNotification(medicineName, medicineId, hour, minute, weekday, 'weekly');
                count++;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to schedule ${medicineName}:`, err);
        }
      }
    }
    
    // ====================================================
    // 2. INTERVAL MEDICINES
    // ====================================================
    else if (schedule.frequency === 'interval' && schedule.intervalHours && schedule.startDate) {
      
      const intervalMs = schedule.intervalHours * 60 * 60 * 1000;
      let nextDoseTime = new Date(schedule.startDate);
      
      if (isNaN(nextDoseTime.getTime())) {
        continue;
      }

      // --- ALIGNMENT FIX START ---
      // If the user picked a specific time (e.g., "19:00"), force the start date 
      // to align with that minute/second.
      if (schedule.times && schedule.times.length > 0) {
        const preferredTime = parseTime(schedule.times[0]);
        if (preferredTime) {
          nextDoseTime.setHours(preferredTime.hour);
          nextDoseTime.setMinutes(preferredTime.minute);
          nextDoseTime.setSeconds(0);
          nextDoseTime.setMilliseconds(0);
        }
      }
      // --- ALIGNMENT FIX END ---

      // Fast forward start date to the immediate future
      while (nextDoseTime.getTime() <= (now.getTime() + FUTURE_BUFFER_MS)) {
        nextDoseTime = new Date(nextDoseTime.getTime() + intervalMs);
      }

      // Schedule the next 15 occurrences
      for (let i = 0; i < 15; i++) {
        if (schedule.endDate && nextDoseTime > new Date(schedule.endDate)) break;

        const success = await scheduleAbsoluteNotification(
          medicineName, 
          medicineId, 
          nextDoseTime,
          i + 1 
        );
        
        if (success) count++;
        
        nextDoseTime = new Date(nextDoseTime.getTime() + intervalMs);
      }
    } 
  }
}

/**
 * Helper for Repeating Alarms (Daily/Weekly)
 */
async function scheduleNotification(medicineName, medicineId, hour, minute, weekday = null, frequency = 'daily') {
  let trigger;

  if (Platform.OS === 'android') {
    if (frequency === 'weekly') {
      trigger = { 
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY, 
        weekday, 
        hour, 
        minute, 
        channelId: CHANNEL_ID 
      };
    } else {
      trigger = { 
        type: Notifications.SchedulableTriggerInputTypes.DAILY, 
        hour, 
        minute, 
        channelId: CHANNEL_ID 
      };
    }
  } else {
    // iOS
    trigger = { hour, minute, repeats: true };
    if (weekday) trigger.weekday = weekday;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for your meds! 💊",
      body: `It is time to take ${medicineName}. Tap to confirm.`,
      sound: 'medalarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      channelId: CHANNEL_ID, 
      data: { medicineId, medicineName, scheduledTime: { hour, minute } }, 
    },
    trigger,
  });
}

/**
 * Absolute Date Alarms (Intervals)
 */
async function scheduleAbsoluteNotification(medicineName, medicineId, triggerDate, index) {
  try {
    let trigger;

    if (Platform.OS === 'android') {
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate, 
        channelId: CHANNEL_ID,
      };
    } else {
      trigger = { date: triggerDate };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for your meds! 💊",
        body: `It is time to take ${medicineName}. Tap to confirm.`,
        sound: 'medalarm.wav',
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: CHANNEL_ID,
        data: { 
          medicineId, 
          medicineName, 
          scheduledTime: { 
            hour: triggerDate.getHours(), 
            minute: triggerDate.getMinutes(),
            iso: triggerDate.toISOString() 
          }
        }, 
      },
      trigger,
    });
    
    return true;

  } catch (e) {
    // Keep essential errors for production monitoring if needed, 
    // or remove this line too if you want total silence.
    console.error(`Error scheduling interval dose for ${medicineName}:`, e);
    return false;
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function debugScheduledNotifications() {
  // Use this function manually if you ever need to inspect alarms again.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`[Debug] Total Pending Alarms: ${scheduled.length}`);
}