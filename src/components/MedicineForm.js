// src/components/MedicineForm.js
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import COLORS from '../constants/colors';

export default function MedicineForm({
  medicineData,
  onDataChange,
  onNext,
  onShowDatePicker, // Trigger passed from parent
}) {
  return (
    <>
      <Text style={styles.title}>Add New Medicine</Text>
      <Text style={styles.subtitle}>Step 1: Medicine Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Medicine Name (e.g., Paracetamol)"
        placeholderTextColor="#888"
        value={medicineData.name}
        onChangeText={(val) => onDataChange('name', val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Dosage (e.g., 1 tablet)"
        placeholderTextColor="#888"
        value={medicineData.dosage}
        onChangeText={(val) => onDataChange('dosage', val)}
      />
      <TextInput
        style={styles.input}
        placeholder="Stock (e.g., 30)"
        placeholderTextColor="#888"
        value={medicineData.stock}
        onChangeText={(val) => onDataChange('stock', val)}
        keyboardType="numeric"
      />
      
      <TouchableOpacity style={styles.datePickerButton} onPress={onShowDatePicker}>
        <Text style={styles.datePickerText}>
          Expiry Date: {medicineData.expiryDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Optional Notes"
        placeholderTextColor="#888"
        value={medicineData.notes}
        onChangeText={(val) => onDataChange('notes', val)}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#212529' },
  subtitle: { fontSize: 14, textAlign: 'center', color: COLORS.grey, marginBottom: 20 },
  input: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  datePickerButton: {
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  datePickerText: {
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: COLORS.primaryGreen,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});