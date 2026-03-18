// src/screens/NotificationSettingsScreen.js
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { updatePreferences } from '../state/authSlice';

const ToggleItem = ({ icon, label, value, onValueChange, disabled }) => (
  <View style={[styles.itemContainer, disabled && styles.itemDisabled]}>
    <View style={styles.iconBox}>
      <MaterialCommunityIcons 
        name={icon} 
        size={24} 
        color={disabled ? COLORS.grey : COLORS.primaryGreen} 
      />
    </View>
    <Text style={[styles.itemLabel, disabled && { color: COLORS.grey }]}>
      {label}
    </Text>
    <Switch
      trackColor={{ false: '#767577', true: COLORS.lightGreen }}
      thumbColor={value ? COLORS.primaryGreen : '#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      onValueChange={onValueChange}
      value={value}
      disabled={disabled}
    />
  </View>
);

export default function NotificationSettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [preferences, setPreferences] = useState({
    weeklyReport: false,
    lowStockExpiryAlerts: false,
    monthlyReport: false,
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleToggle = (key) => {
    if (!user?.isEmailVerified) {
      Alert.alert(
        'Email Verification Required',
        'Please verify your email address in the "Edit Profile" section to enable these alerts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => navigation.navigate('UpdateProfile') }
        ]
      );
      return;
    }

    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    dispatch(updatePreferences(newPreferences))
      .unwrap()
      .catch((err) => {
        setPreferences(preferences); 
        Alert.alert('Error', 'Failed to update settings. Please try again.');
      });
  };

  return (
    // FIX 1: Added 'top' to edges to ensure SafeAreaView handles the status bar padding correctly
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primaryGreen} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 28 }} /> 
        </View>

        {!user?.isEmailVerified && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#D93025" />
            <Text style={styles.warningText}>
              Verify your email to enable notifications.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Email Alerts</Text>
          
          <ToggleItem
            icon="calendar-clock"
            label="Receive weekly reports about your medication schedule"
            value={preferences.weeklyReport}
            onValueChange={() => handleToggle('weeklyReport')}
            disabled={!user?.isEmailVerified}
          />

          <ToggleItem
            icon="pill"
            label="Receive alerts about medicines running out of stock and expiring medicines"
            value={preferences.lowStockExpiryAlerts}
            onValueChange={() => handleToggle('lowStockExpiryAlerts')}
            disabled={!user?.isEmailVerified}
          />

          <ToggleItem
            icon="chart-line"
            label="Receive monthly reports about your medication progress"
            value={preferences.monthlyReport}
            onValueChange={() => handleToggle('monthlyReport')}
            disabled={!user?.isEmailVerified}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // FIX 2: Increased marginTop to move the header away from the top edge
    marginTop: 15, 
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grey,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  itemDisabled: {
    opacity: 0.6,
    backgroundColor: '#FAFAFA',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    paddingRight: 10,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDED',
    padding: 12,
    borderRadius: 8,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  warningText: {
    color: '#D93025',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});