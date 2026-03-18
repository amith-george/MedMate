import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useDispatch } from 'react-redux';
import { addMedicine } from '../state/medicineSlice';
import { createSchedule, fetchTodaysReminders } from '../state/scheduleSlice';

import MedicineForm from './MedicineForm';
import ScheduleForm from './ScheduleForm';

export default function AddMedicineModal({ visible, onClose, initialData, onSuccess }) {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [medicineData, setMedicineData] = useState({
    name: '',
    dosage: '',
    stock: '',
    expiryDate: new Date(),
    notes: '',
  });
  
  const [scheduleData, setScheduleData] = useState({
    frequency: 'daily',
    times: [],
    daysOfWeek: [],
    intervalHours: '',
    customIntervalDays: '', 
    instructions: '',
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- CLEAN DATA RECEIVER ---
  useEffect(() => {
    if (initialData && visible) {
      setMedicineData(prev => ({
        ...prev,
        name: initialData.name || '',
        dosage: initialData.dosage || '',
      }));

      // Pre-fill Schedule Details dynamically based on AI
      // initialData.instructions now contains the "Remarks" from the bill!
      setScheduleData(prev => ({
        ...prev,
        frequency: initialData.scheduleType || 'daily', 
        times: initialData.parsedTimes || [], 
        daysOfWeek: initialData.daysOfWeek || [], 
        customIntervalDays: initialData.customIntervalDays || '', 
        instructions: initialData.instructions || '', 
      }));
    }
  }, [initialData, visible]);

  const handleConfirmDate = (date) => {
    setShowDatePicker(false);
    setMedicineData((prev) => ({ ...prev, expiryDate: date }));
  };

  const handleCancelDate = () => {
    setShowDatePicker(false);
  };

  const handleMedicineChange = (field, value) => {
    setMedicineData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (field, value) => {
    if (field === 'frequency') {
      setScheduleData((prev) => ({
        ...prev,
        frequency: value,
        times: [],
        daysOfWeek: [],
        intervalHours: '',
        customIntervalDays: '',
      }));
    } else {
      setScheduleData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const toggleDay = (day) => {
    setScheduleData((prev) => {
      const newDays = prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day];
      return { ...prev, daysOfWeek: newDays };
    });
  };

  const handleNext = () => {
    if (!medicineData.name || !medicineData.dosage || !medicineData.stock) {
      Alert.alert('Missing Fields', 'Please fill in all required medicine details.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formattedExpiryDate = medicineData.expiryDate.toISOString().split('T')[0];

    try {
      const medicineResult = await dispatch(
        addMedicine({
          ...medicineData,
          expiryDate: formattedExpiryDate,
          stock: Number(medicineData.stock),
        })
      ).unwrap();

      const schedulePayload = {
        medicineId: medicineResult._id,
        ...scheduleData,
        intervalHours: scheduleData.intervalHours ? Number(scheduleData.intervalHours) : undefined,
        customIntervalDays: scheduleData.customIntervalDays ? Number(scheduleData.customIntervalDays) : undefined,
      };

      await dispatch(createSchedule(schedulePayload)).unwrap();
      
      dispatch(fetchTodaysReminders());

      // Reset State
      setStep(1);
      setMedicineData({ name: '', dosage: '', stock: '', expiryDate: new Date(), notes: '' });
      setScheduleData({ frequency: 'daily', times: [], daysOfWeek: [], intervalHours: '', customIntervalDays: '', instructions: '' });
      
      // Trigger the Queue Loop
      if (typeof onSuccess === 'function') {
        onSuccess(); 
      } else if (typeof onClose === 'function') {
        onClose();
      }

    } catch (err) {
      Alert.alert('Error', err.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetFormAndClose = () => {
    setStep(1);
    setMedicineData({ name: '', dosage: '', stock: '', expiryDate: new Date(), notes: '' });
    setScheduleData({ frequency: 'daily', times: [], daysOfWeek: [], intervalHours: '', customIntervalDays: '', instructions: '' });
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={resetFormAndClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.closeButton} onPress={resetFormAndClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {step === 1 ? (
              <MedicineForm
                medicineData={medicineData}
                onDataChange={handleMedicineChange}
                onNext={handleNext}
                onShowDatePicker={() => setShowDatePicker(true)}
              />
            ) : (
              <ScheduleForm
                scheduleData={scheduleData}
                onDataChange={handleScheduleChange}
                onDayToggle={toggleDay}
                onSubmit={handleSubmit}
                onBack={() => setStep(1)}
                isLoading={loading}
              />
            )}
          </ScrollView>

          <DatePicker
            modal
            open={showDatePicker}
            date={medicineData.expiryDate}
            mode="date"
            onConfirm={handleConfirmDate}
            onCancel={handleCancelDate}
            title="Select Expiry Date"
            confirmText="Confirm"
            cancelText="Cancel"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 10,
    zIndex: 1,
  },
  closeButtonText: { fontSize: 24, color: '#6c757d' },
});