import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../api/axiosConfig';
import AddMedicineModal from '../components/AddMedicineModal';
import MedicineListModal from '../components/MedicineListModal';
import COLORS from '../constants/colors';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { fetchTodaysReminders } from '../state/scheduleSlice';
import { getAvatar } from '../utils/avatarUtils';

// --- Header Component ---
const HomeScreenHeader = ({ user, formattedDate }) => (
  <View style={styles.header}>
    <View>
      <Text style={styles.greetingText}>Hello, {user.name}!</Text>
      <Text style={styles.dateText}>{formattedDate}</Text>
    </View>
    <Image source={getAvatar(user.avatar)} style={styles.avatar} />
  </View>
);

// --- Reminder Item Component ---
const ReminderItem = ({ item }) => {
  // Changed PRN fallback since PRN is removed. Shows --:-- if times are somehow empty.
  const nextTime = item.times && item.times.length > 0 ? item.times[0] : '--:--'; 
  return (
    <View style={styles.itemContainer}>
      <MaterialCommunityIcons name="pill" color={COLORS.primaryGreen} size={30} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.medicine.name}</Text>
        <Text style={styles.itemDosage}>{item.medicine.dosage}</Text>
      </View>
      <Text style={styles.itemTime}>{nextTime}</Text>
    </View>
  );
};

// --- Main HomeScreen Component ---
export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { reminders, status, error } = useSelector((state) => state.schedule);
  const { formattedDate } = useCurrentTime();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // OCR & Queue State
  const [isScanPopupVisible, setIsScanPopupVisible] = useState(false);
  const [isListPopupVisible, setIsListPopupVisible] = useState(false); 
  const [scannedMedicines, setScannedMedicines] = useState([]); 
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  useEffect(() => {
    if (user?.token) {
      dispatch(fetchTodaysReminders());
    }
  }, [dispatch, user?.token]);
  
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchTodaysReminders()).unwrap();
    } catch (e) {
      console.error('Failed to refresh reminders:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  // --- Camera / OCR Logic ---
  const handleLaunchCamera = async () => {
    setIsScanPopupVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to scan prescriptions.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7, 
      base64: true,
    });

    handleImageResult(result);
  };

  const handleLaunchGallery = async () => {
    setIsScanPopupVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery access to select prescriptions.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7, 
      base64: true,
    });

    handleImageResult(result);
  };

  const handleImageResult = async (result) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await processPrescriptionImage(asset.base64, asset.mimeType || 'image/jpeg');
    }
  };

  const processPrescriptionImage = async (base64, mimeType) => {
    setIsScanning(true);
    try {
      const response = await apiClient.post(
        '/prescription/transcribe',
        { imageBase64: base64, mimeType },
        { headers: { Authorization: `Bearer ${token}` } } 
      );

      const medicines = response.data.medicines;
      
      if (!medicines || medicines.length === 0) {
        Alert.alert('No Data Found', 'Could not read any medicine details.');
      } else {
        setScannedMedicines(medicines);
        setIsListPopupVisible(true);
      }
    } catch (err) {
      console.error('Scan Error:', err);
      const errorData = err.response?.data;
      if (errorData) {
        Alert.alert(errorData.message || 'Invalid Image', errorData.reason || 'Could not process image.');
      } else {
        Alert.alert('Network Error', 'Could not reach the server. Please try again.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // --- Handle selection from the new extracted modal ---
  const handleSelectScannedMedicine = (item) => {
    setScannedData({
      name: item.medicineName || '',
      dosage: item.dosage !== 'Unknown' ? item.dosage : '',
      frequency: item.frequency || '',
      scheduleType: item.scheduleType || 'daily', 
      daysOfWeek: item.daysOfWeek || [], 
      customIntervalDays: item.customIntervalDays || '', 
      parsedTimes: item.parsedTimes || [], 
      instructions: item.instructions || '',
    });
    setIsListPopupVisible(false); 
    setIsModalVisible(true);      
  };

  // --- Queue Manager ---
  const handleMedicineSuccessfullyAdded = () => {
    if (scannedData && scannedData.name) {
      const remainingMedicines = scannedMedicines.filter(
        (med) => med.medicineName !== scannedData.name
      );
      
      setScannedMedicines(remainingMedicines);
      setScannedData(null);
      setIsModalVisible(false);

      if (remainingMedicines.length > 0) {
        setTimeout(() => {
          setIsListPopupVisible(true);
        }, 500); 
      }
    } else {
      setIsModalVisible(false);
    }
  };

  const handleManualAdd = () => {
    setScannedData(null);
    setIsModalVisible(true);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right']}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const renderEmptyList = () => {
    if (status === 'loading' && !isRefreshing) {
      return <ActivityIndicator size="large" color={COLORS.primaryGreen} />;
    }
    if (status === 'failed') {
      return <Text style={styles.emptyListText}>Error: {error}</Text>;
    }
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="check-circle-outline" color={COLORS.primaryGreen} size={50} />
        <Text style={styles.emptyListText}>All done for today!</Text>
        <Text style={styles.emptyListSubText}>No upcoming reminders.</Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <HomeScreenHeader user={user} formattedDate={formattedDate} />
        
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Today's Reminders</Text>
          <FlatList
            data={reminders}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ReminderItem item={item} />}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={renderEmptyList}
            contentContainerStyle={reminders.length === 0 ? styles.emptyListContainerStyle : styles.flatListContent} 
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primaryGreen]} />
            }
          />
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.addMedButton} 
            onPress={handleManualAdd}
            disabled={isScanning}
          >
              <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
              <Text style={styles.addMedButtonText}>Add Medicine</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addMedButton, styles.scanButton]} 
            onPress={() => setIsScanPopupVisible(true)} 
            disabled={isScanning}
          >
              {isScanning ? (
                <ActivityIndicator size="small" color={COLORS.primaryGreen} />
              ) : (
                <MaterialCommunityIcons name="camera-outline" size={24} color={COLORS.primaryGreen} />
              )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isScanPopupVisible} transparent={true} animationType="fade" onRequestClose={() => setIsScanPopupVisible(false)}>
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <View style={styles.popupHeader}>
              <MaterialCommunityIcons name="line-scan" size={40} color={COLORS.primaryGreen} />
              <TouchableOpacity onPress={() => setIsScanPopupVisible(false)} style={styles.closePopupButton}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.grey} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.popupTitle}>Scan Prescription</Text>
            <Text style={styles.popupSubtitle}>
              Please ensure the image is clear, well-lit, and the medicine names are visible.
            </Text>

            <View style={styles.popupButtonsContainer}>
              <TouchableOpacity style={styles.popupActionBtn} onPress={handleLaunchCamera}>
                <MaterialCommunityIcons name="camera" size={24} color={COLORS.white} />
                <Text style={styles.popupActionText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.popupActionBtn, styles.popupGalleryBtn]} onPress={handleLaunchGallery}>
                <MaterialCommunityIcons name="image" size={24} color={COLORS.primaryGreen} />
                <Text style={[styles.popupActionText, { color: COLORS.primaryGreen }]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <MedicineListModal 
        visible={isListPopupVisible}
        medicines={scannedMedicines}
        onSelect={handleSelectScannedMedicine}
        onClose={() => setIsListPopupVisible(false)}
      />
      
      <AddMedicineModal 
        visible={isModalVisible} 
        onClose={() => {
            setIsModalVisible(false);
            setScannedData(null);
        }} 
        initialData={scannedData} 
        onSuccess={handleMedicineSuccessfullyAdded} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginBottom: 20 },
  greetingText: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 16, color: 'grey', marginTop: 4 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.primaryGreen },
  
  listContainer: {
    flex: 1, 
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 15,
    marginBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    overflow: 'hidden',
  },
  flatListContent: { paddingBottom: 20 },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  itemDetails: { flex: 1, marginLeft: 15 },
  itemName: { fontSize: 18, fontWeight: '600', color: '#333' },
  itemDosage: { fontSize: 14, color: 'grey', marginTop: 2 },
  itemTime: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen },
  emptyListContainerStyle: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyListText: { fontSize: 18, fontWeight: '600', color: 'grey', marginTop: 10, textAlign: 'center' },
  emptyListSubText: { fontSize: 14, color: 'grey', marginTop: 5, textAlign: 'center' },
  
  bottomActions: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
  addMedButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryGreen, paddingVertical: 15, borderRadius: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
  addMedButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  scanButton: { flex: 0, width: 55, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primaryGreen },
  
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  popupContent: { width: '85%', backgroundColor: COLORS.white, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  closePopupButton: { padding: 5 },
  popupTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  popupSubtitle: { fontSize: 15, color: COLORS.grey, lineHeight: 22, marginBottom: 25 },
  popupButtonsContainer: { gap: 12 },
  popupActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryGreen, paddingVertical: 14, borderRadius: 12, gap: 8 },
  popupGalleryBtn: { backgroundColor: COLORS.lightGreen, borderWidth: 1, borderColor: COLORS.primaryGreen },
  popupActionText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});