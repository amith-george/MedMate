import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { fetchRecentLogs } from '../state/logsSlice';

const formatLogTime = (isoString) => {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart}`;
};

const LogItem = ({ item }) => {
  const isTaken = item.status === 'taken';
  const iconName = isTaken ? 'check-circle' : 'close-circle';
  const iconColor = isTaken ? COLORS.primaryGreen : COLORS.error;
  const statusText = isTaken ? 'Taken' : 'Missed';

  return (
    <View style={styles.itemContainer}>
      <MaterialCommunityIcons name={iconName} size={30} color={iconColor} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.medicine ? item.medicine.name : 'Medicine not found'}</Text>
        <Text style={styles.itemStatus}>{statusText}</Text>
      </View>
      <Text style={styles.itemTime}>{formatLogTime(item.scheduledTime)}</Text>
    </View>
  );
};

export default function HistoryScreen() {
  const dispatch = useDispatch();
  const { recentLogs: logs, status, error } = useSelector((state) => state.logs);
  
  // 1. Add state for the refresh control
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchRecentLogs());
    }, [dispatch])
  );
  
  // 2. Create the onRefresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchRecentLogs()).unwrap();
    } catch (e) {
      console.error('Failed to refresh logs:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch]);
  
  const renderContent = () => {
    if (status === 'loading' && !isRefreshing) {
      return <ActivityIndicator size="large" color={COLORS.primaryGreen} style={styles.centered} />;
    }
    if (status === 'failed') {
      return <Text style={[styles.centered, styles.errorText]}>Error: {error}</Text>;
    }
    if (!logs || logs.length === 0) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="history" size={60} color={COLORS.grey} />
          <Text style={styles.emptyText}>No recent activity found.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={logs}
        renderItem={({ item }) => <LogItem item={item} />}
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
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recent Activity</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 15,
    fontSize: 18,
    color: COLORS.grey,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
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
    fontWeight: '600',
    color: '#333',
  },
  itemStatus: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  itemTime: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
});