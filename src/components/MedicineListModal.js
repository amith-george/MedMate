// src/components/MedicineListModal.js
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';

export default function MedicineListModal({
  visible,
  medicines,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Medicines Found</Text>
              <Text style={styles.subtitle}>
                Tap a medicine to add it to your schedule.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.grey} />
            </TouchableOpacity>
          </View>

          {/* List of Medicines */}
          <FlatList
            data={medicines}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => onSelect(item)}
              >
                <View style={styles.cardIconContainer}>
                  <MaterialCommunityIcons
                    name="pill"
                    size={28}
                    color={COLORS.primaryGreen}
                  />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.medicineName} numberOfLines={1}>
                    {item.medicineName}
                  </Text>
                  <View style={styles.detailsRow}>
                    <MaterialCommunityIcons name="weight-gram" size={14} color={COLORS.grey} />
                    <Text style={styles.detailText}>
                      {item.dosage !== 'Unknown' ? item.dosage : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.grey} />
                    <Text style={styles.detailText}>{item.frequency}</Text>
                  </View>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={COLORS.grey}
                />
              </TouchableOpacity>
            )}
          />

          {/* Footer Action */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel Processing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Aligns the modal to the bottom of the screen
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    maxHeight: '85%', // Prevents it from covering the whole screen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grey,
  },
  closeIcon: {
    padding: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  listContainer: {
    paddingBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.grey,
    marginLeft: 4,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935', 
  },
});