import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { fetchMedicines } from '../state/medicineSlice';

const SORT_OPTIONS = {
  name_asc: { label: 'Name', icon: 'arrow-up' },
  name_desc: { label: 'Name', icon: 'arrow-down' },
  stock_asc: { label: 'Stock', icon: 'arrow-up' },
  stock_desc: { label: 'Stock', icon: 'arrow-down' },
};

const SortByDropdown = ({ onSelectSort, currentSort }) => {
  const [isVisible, setIsVisible] = useState(false);
  const currentOption = SORT_OPTIONS[currentSort] || SORT_OPTIONS.name_asc;

  const selectOption = (option) => {
    onSelectSort(option);
    setIsVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.sortButton} onPress={() => setIsVisible(true)}>
        <Text style={styles.sortButtonText}>Sort: {currentOption.label}</Text>
        <MaterialCommunityIcons name={currentOption.icon} size={18} color="#333" />
      </TouchableOpacity>
      <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsVisible(false)}>
          <View style={styles.dropdown}>
            {Object.keys(SORT_OPTIONS).map((key) => (
              <TouchableOpacity key={key} style={styles.dropdownItem} onPress={() => selectOption(key)}>
                <Text style={styles.dropdownItemText}>{SORT_OPTIONS[key].label}</Text>
                <MaterialCommunityIcons name={SORT_OPTIONS[key].icon} size={18} color="#333" />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const MedicineItem = ({ item, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <MaterialCommunityIcons name="pill" size={24} color={COLORS.primaryGreen} />
    <View style={styles.itemDetails}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemDosage}>{item.dosage}</Text>
    </View>
    <View style={styles.itemStock}>
      <Text style={styles.itemStockText}>{item.stock} units</Text>
    </View>
  </TouchableOpacity>
);

export default function PillsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { medicines, status, error } = useSelector((state) => state.medicines);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('name_asc');

  // 1. Add state for the refresh control
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchMedicines());
  }, [dispatch]);
  
  // 2. Create the onRefresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchMedicines()).unwrap();
    } catch (e) {
      console.error('Failed to refresh medicines:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);

  const processedMedicines = useMemo(() => {
    let result = [...medicines];
    if (searchQuery) {
      result = result.filter((med) => med.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    switch (sortOrder) {
      case 'name_asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'stock_asc': result.sort((a, b) => a.stock - b.stock); break;
      case 'stock_desc': result.sort((a, b) => b.stock - a.stock); break;
      default: break;
    }
    return result;
  }, [medicines, searchQuery, sortOrder]);

  const handleSelectMedicine = (item) => {
    navigation.navigate('MedicineDetail', {
      medicineId: item._id,
      medicineName: item.name,
    });
  };

  const renderContent = () => {
    if (status === 'loading' && !isRefreshing) {
      return <ActivityIndicator size="large" color={COLORS.primaryGreen} style={styles.centered} />;
    }
    if (status === 'failed') {
      return <Text style={[styles.centered, styles.errorText]}>Error: {error}</Text>;
    }
    if (processedMedicines.length === 0) {
      return <Text style={styles.centered}>No medicines found. Add one to get started!</Text>;
    }
    return (
      <FlatList
        data={processedMedicines}
        renderItem={({ item }) => <MedicineItem item={item} onPress={() => handleSelectMedicine(item)} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        // 3. Attach the RefreshControl to the FlatList
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primaryGreen]}
            tintColor={COLORS.primaryGreen}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search for medicines..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <SortByDropdown onSelectSort={setSortOrder} currentSort={sortOrder} />
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flex: 1,
    height: 40,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    fontSize: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'flex-end',
  },
  dropdown: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 105 : 60,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    width: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.error,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  itemDosage: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  itemStock: {
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  itemStockText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryGreen,
  },
});