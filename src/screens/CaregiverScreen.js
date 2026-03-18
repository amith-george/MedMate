import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import AddCaregiverModal from '../components/AddCaregiverModal';
import COLORS from '../constants/colors';
import { clearError, fetchCaregivers, removeCaregiver } from '../state/caregiverSlice';

export default function CaregiverScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list, loading, error } = useSelector((state) => state.caregivers);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchCaregivers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleDelete = (id) => {
    Alert.alert('Remove Caregiver', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeCaregiver(id)) },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.name}</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={COLORS.error || '#FF5252'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDetailLabel}>Relationship: <Text style={styles.cardDetailValue}>{item.relationship || 'Caregiver'}</Text></Text>
      <Text style={styles.cardDetailLabel}>Email: <Text style={styles.cardDetailValue}>{item.email}</Text></Text>
      <Text style={styles.cardDetailLabel}>Phone: <Text style={styles.cardDetailValue}>{item.phone}</Text></Text>
    </View>
  );

  return (
    // FIX 1: Added 'top' edge for automatic notch/status bar handling
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* Header with adjusted spacing */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caregivers</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* List */}
      {loading && list.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primaryGreen} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No caregivers added yet.</Text>}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <AddCaregiverModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5',
    // FIX 2: Removed manual paddingTop, edges=['top'] handles this now
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, // Changed from general padding
    marginTop: 15,          // Added space from top
    marginBottom: 10,       // Added space below header
    backgroundColor: '#F5F5F5'
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardName: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryGreen },
  
  cardDetailLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
  cardDetailValue: { color: '#333', fontWeight: '500' },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
  
  fab: { 
    position: 'absolute', 
    right: 20, 
    bottom: 30, 
    backgroundColor: COLORS.primaryGreen, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});