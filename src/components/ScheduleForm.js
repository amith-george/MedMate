import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ScheduleForm({
  scheduleData,
  onDataChange,
  onDayToggle,
  onSubmit,
  onBack,
  isLoading,
}) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerValue, setTimePickerValue] = useState(new Date());

  const handleAddTimePress = () => {
    setTimePickerValue(new Date());
    setShowTimePicker(true);
  };

  const handleConfirmTime = (selectedTime) => {
    setShowTimePicker(false);
    const formatted = formatTime(selectedTime);
    
    if (scheduleData.frequency === 'interval') {
       onDataChange('times', [formatted]);
    } else {
      if (!scheduleData.times.includes(formatted)) {
        onDataChange('times', [...scheduleData.times, formatted].sort());
      }
    }
  };

  const handleCancelTime = () => {
    setShowTimePicker(false);
  };

  const removeTime = (timeToRemove) => {
    onDataChange(
      'times',
      scheduleData.times.filter((time) => time !== timeToRemove)
    );
  };

  return (
    <>
      <Text style={styles.title}>Set Schedule</Text>
      <Text style={styles.subtitle}>Step 2: Reminder Details</Text>

      <Text style={styles.label}>Frequency</Text>
      <View style={styles.pickerContainer}>
        {[
          { id: 'daily', label: 'Daily' },
          { id: 'weekly', label: 'Weekly' },
          { id: 'custom', label: 'Days' },    
          { id: 'interval', label: 'Hours' }, 
        ].map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[styles.pickerButton, scheduleData.frequency === freq.id && styles.pickerButtonSelected]}
            onPress={() => {
              onDataChange('frequency', freq.id);
              if (freq.id === 'interval' && scheduleData.times.length > 1) {
                 onDataChange('times', []); 
              }
            }}>
            <Text style={[styles.pickerText, scheduleData.frequency === freq.id && styles.pickerTextSelected]}>
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- WEEKLY VIEW --- */}
      {scheduleData.frequency === 'weekly' && (
        <View>
          <Text style={styles.label}>Select Days</Text>
          <View style={styles.daysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, scheduleData.daysOfWeek.includes(day) && styles.dayButtonSelected]}
                onPress={() => onDayToggle(day)}>
                <Text style={[styles.dayText, scheduleData.daysOfWeek.includes(day) && styles.dayTextSelected]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* --- CUSTOM DAYS VIEW (For Monthly/Bi-weekly) --- */}
      {scheduleData.frequency === 'custom' && (
        <View>
          <Text style={styles.label}>Take Every 'X' Days</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30 for Monthly"
            placeholderTextColor="#888"
            value={scheduleData.customIntervalDays ? String(scheduleData.customIntervalDays) : ''}
            onChangeText={(val) => onDataChange('customIntervalDays', val)}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* --- INTERVAL (HOURS) VIEW --- */}
      {scheduleData.frequency === 'interval' && (
        <View>
          <Text style={styles.label}>Interval (in hours)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8"
            placeholderTextColor="#888"
            value={scheduleData.intervalHours ? String(scheduleData.intervalHours) : ''}
            onChangeText={(val) => onDataChange('intervalHours', val)}
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Start Time (First Dose)</Text>
          {scheduleData.times.length > 0 ? (
            <View style={styles.timeChip}>
              <Text style={styles.timeChipText}>{scheduleData.times[0]}</Text>
              <TouchableOpacity onPress={() => onDataChange('times', [])}>
                <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={handleAddTimePress}>
              <MaterialCommunityIcons name="clock-start" size={22} color={COLORS.primaryGreen} />
              <Text style={styles.addButtonText}>Set Start Time</Text>
            </TouchableOpacity>
          )}
          <View style={{ marginBottom: 20 }} />
        </View>
      )}
      
      {/* --- TIME SELECTION --- */}
      {['daily', 'weekly', 'custom'].includes(scheduleData.frequency) && (
        <View>
          <Text style={styles.label}>Reminder Times</Text>
          <View style={styles.timesList}>
            {scheduleData.times.map((time, index) => (
              <View key={index} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{time}</Text>
                <TouchableOpacity onPress={() => removeTime(time)}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddTimePress}>
            <MaterialCommunityIcons name="clock-plus-outline" size={22} color={COLORS.primaryGreen} />
            <Text style={styles.addButtonText}>Add Time</Text>
          </TouchableOpacity>
        </View>
      )}

      <DatePicker
        modal
        open={showTimePicker}
        date={timePickerValue}
        mode="time"
        is24Hour={true}
        onConfirm={handleConfirmTime}
        onCancel={handleCancelTime}
        title={scheduleData.frequency === 'interval' ? "Select Start Time" : "Select Reminder Time"}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      <Text style={styles.label}>Instructions / Remarks</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g., 'Take with food' or 'LV Dysfunction'"
        placeholderTextColor="#888"
        value={scheduleData.instructions}
        onChangeText={(val) => onDataChange('instructions', val)}
        multiline
      />

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primaryGreen} style={{ marginTop: 20 }}/>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, color: '#212529' },
    subtitle: { fontSize: 14, textAlign: 'center', color: COLORS.grey, marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#495057', marginBottom: 8 },
    input: {
      backgroundColor: COLORS.lightGreen,
      paddingHorizontal: 15,
      paddingVertical: Platform.OS === 'ios' ? 15 : 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#dee2e6',
      marginBottom: 20,
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
      flex: 1,
    },
    buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 10,
    },
    backButton: {
      backgroundColor: COLORS.grey,
    },
    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap', 
      gap: 8,           
      marginBottom: 20,
    },
    pickerButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20, 
      borderWidth: 1,
      borderColor: '#ced4da',
      backgroundColor: COLORS.white,
    },
    pickerButtonSelected: {
      backgroundColor: COLORS.primaryGreen,
      borderColor: COLORS.primaryGreen,
    },
    pickerText: {
      fontSize: 14,
      fontWeight: '500',
      color: COLORS.primaryGreen,
    },
    pickerTextSelected: {
      color: COLORS.white,
    },
    daysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.lightGreen,
    },
    dayButtonSelected: {
      backgroundColor: COLORS.primaryGreen,
    },
    dayText: {
      color: '#495057',
      fontWeight: 'bold',
    },
    dayTextSelected: {
      color: COLORS.white,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: COLORS.lightGreen,
      borderWidth: 1,
      borderColor: COLORS.primaryGreen,
      marginBottom: 20,
    },
    addButtonText: {
      color: COLORS.primaryGreen,
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    timesList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
      gap: 8,
    },
    timeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primaryGreen,
      borderRadius: 16,
      paddingVertical: 6,
      paddingHorizontal: 12,
      gap: 6,
      alignSelf: 'flex-start', 
      marginBottom: 20, 
    },
    timeChipText: {
      color: COLORS.white,
      fontWeight: 'bold',
    },
});