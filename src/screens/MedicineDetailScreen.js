import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { fetchLogsForMedicine } from '../state/logsSlice';
import { deleteMedicine } from '../state/medicineSlice';
import { fetchScheduleForMedicine } from '../state/scheduleSlice';

// --- Reusable Sub-components ---
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primaryGreen} style={styles.infoIcon} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const ScheduleDetail = ({ schedule }) => {
  if (!schedule) {
    return <InfoRow icon="calendar-remove" label="Schedule" value="Not set up" />;
  }
  let scheduleText = schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1);
  if (schedule.times && schedule.times.length > 0) {
    scheduleText += ` at ${schedule.times.join(', ')}`;
  }
  return <InfoRow icon="calendar-clock" label="Schedule" value={scheduleText} />;
};

// --- UPDATED LOG ITEM ---
const LogItem = ({ item }) => {
  const isTaken = item.status === 'taken';
  const iconName = isTaken ? 'check-circle' : 'close-circle';
  const iconColor = isTaken ? COLORS.primaryGreen : COLORS.error;
  
  // Create Date Object
  const dateObj = new Date(item.scheduledTime);
  
  // Format Date: "Jan 05"
  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' });
  
  // Format Time: "08:30 PM"
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.logItem}>
      <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      
      <View style={styles.logContent}>
        <Text style={styles.logStatus}>{isTaken ? 'Taken' : 'Missed'}</Text>
      </View>

      {/* Display Date and Time vertically stacked or inline */}
      <View style={styles.logDateTimeContainer}>
        <Text style={styles.logDate}>{dateStr}</Text>
        <Text style={styles.logTime}>{timeStr}</Text>
      </View>
    </View>
  );
};

const EMPTY_ARRAY = [];

// --- Main Screen Component ---
export default function MedicineDetailScreen({ route }) {
  const { medicineId } = route.params;
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const medicine = useSelector((state) =>
    state.medicines.medicines.find((med) => med._id === medicineId)
  );
  const schedule = useSelector((state) => state.schedule.schedulesByMedicine[medicineId]);
  const logs = useSelector((state) => state.logs.logsByMedicine[medicineId] || EMPTY_ARRAY);
  const { status: logsStatus } = useSelector((state) => state.logs);

  const handleDelete = () => {
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to delete ${medicine?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteMedicine(medicineId)).unwrap();
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', `Failed to delete medicine: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleDelete} style={{ marginRight: 15 }}>
          <MaterialCommunityIcons name="trash-can-outline" size={26} color={COLORS.error} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleDelete]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchScheduleForMedicine(medicineId));
      dispatch(fetchLogsForMedicine(medicineId));
    }, [dispatch, medicineId])
  );

  if (!medicine) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ActivityIndicator color={COLORS.primaryGreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="pill" size={50} color={COLORS.primaryGreen} />
          <Text style={styles.medicineName}>{medicine.name}</Text>
          <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Details</Text>
          <InfoRow icon="beaker-outline" label="Current Stock" value={`${medicine.stock} units`} />
          <InfoRow icon="calendar-end" label="Expiry Date" value={new Date(medicine.expiryDate).toLocaleDateString()} />
          <ScheduleDetail schedule={schedule} />
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {logsStatus === 'loading' ? (
            <ActivityIndicator color={COLORS.primaryGreen} style={{ marginVertical: 20 }} />
          ) : logs.length > 0 ? (
            <FlatList
              data={logs}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <LogItem item={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noLogsText}>No activity recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 16, paddingBottom: 50 },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  medicineName: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 15, textAlign: 'center' },
  medicineDosage: { fontSize: 18, color: COLORS.grey, marginTop: 5 },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10, paddingHorizontal: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  infoIcon: { marginRight: 15 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 14, color: COLORS.grey, marginBottom: 3 },
  infoValue: { fontSize: 16, color: '#333', fontWeight: '500' },
  
  // --- UPDATED LOG STYLES ---
  logItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0' 
  },
  logContent: {
    flex: 1,
    marginLeft: 15,
  },
  logStatus: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#333' 
  },
  logDateTimeContainer: {
    alignItems: 'flex-end',
  },
  logDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  logTime: { 
    fontSize: 14, 
    fontWeight: 'bold',
    color: COLORS.grey 
  },
  noLogsText: { padding: 20, textAlign: 'center', color: COLORS.grey, fontSize: 16 },
});