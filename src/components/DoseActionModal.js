// src/components/DoseActionModal.js
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

export default function DoseActionModal({ visible, medicineName, timeString, onTaken, onMissed }) {
  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}} // Empty function prevents Android back button from closing it
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="pill" size={50} color={COLORS.primaryGreen} />
          </View>

          <Text style={styles.title}>It's Medicine Time!</Text>
          
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Medicine:</Text>
            <Text style={styles.medicineName}>{medicineName || 'Unknown Medicine'}</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.label}>Scheduled For:</Text>
            <Text style={styles.timeText}>{timeString || 'Now'}</Text>
          </View>

          <Text style={styles.question}>Have you taken your medicine?</Text>

          <View style={styles.buttonContainer}>
            {/* NO / MISSED Button */}
            <TouchableOpacity style={styles.missedButton} onPress={onMissed}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>No, I Missed it</Text>
            </TouchableOpacity>

            {/* YES / TAKEN Button */}
            <TouchableOpacity style={styles.takenButton} onPress={onTaken}>
              <MaterialCommunityIcons name="check" size={24} color={COLORS.white} />
              <Text style={styles.buttonText}>Yes, I Took it</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Darker background to focus attention
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },
  iconContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: 'grey',
    marginRight: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 25,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  takenButton: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  missedButton: {
    flex: 1,
    backgroundColor: '#FF5252',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 14, // Slightly smaller to fit text
    fontWeight: 'bold',
    marginLeft: 5,
  },
});