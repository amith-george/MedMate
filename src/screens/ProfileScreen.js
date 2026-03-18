import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { logout } from '../state/authSlice';
import { getAvatar } from '../utils/avatarUtils';

// A reusable component for each option in the list
const ProfileOptionItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.optionItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primaryGreen} style={styles.optionIcon} />
    <Text style={styles.optionLabel}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.grey} />
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  
  // Get user from state
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  // --- Navigation Handlers ---
  const handleManageCaregivers = () => {
    if (!user) return; // Safety check
    navigation.navigate('Caregivers');
  };

  const handleEditProfile = () => {
    if (!user) return; // Safety check
    navigation.navigate('UpdateProfile');
  };

  // --- Notification Settings Handler ---
  const handleNotificationSettings = () => {
    // FIX: Guard against null user during state transitions
    if (!user) return;

    // Check if email exists AND is verified
    if (!user.email || !user.isEmailVerified) {
      Alert.alert(
        'Email Verification Required',
        'You must register and verify your email address to access notification settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Profile', 
            onPress: () => navigation.navigate('UpdateProfile') 
          }
        ]
      );
      return;
    }

    // If verified, navigate to the screen
    navigation.navigate('NotificationSettings');
  };

  // --- FIXED: Help & Support Handler ---
  const handleHelpAndSupport = async () => {
    const url = 'https://github.com/amith-george/MedMate';
    
    try {
      // Bypassing canOpenURL because https:// is universally supported
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Could not open the link.');
      console.error('An error occurred opening the URL:', error);
    }
  };

  // If user is null (immediately after logout), show a simple loading state 
  // to prevent the UI below from trying to access null properties.
  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['left', 'right']}>
        <Text style={{ color: COLORS.grey }}>Logging out...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Profile Header --- */}
        <View style={styles.profileHeader}>
          {/* FIX: Use Optional Chaining (?.) for all user properties */}
          <Image source={getAvatar(user?.avatar)} style={styles.avatar} />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* --- Options List --- */}
        <View style={styles.optionsContainer}>
          <ProfileOptionItem 
            icon="account-edit-outline" 
            label="Edit Profile" 
            onPress={handleEditProfile} 
          />
          
          <ProfileOptionItem 
            icon="shield-account-outline" 
            label="Manage Caregivers" 
            onPress={handleManageCaregivers} 
          />
          
          <ProfileOptionItem 
            icon="bell-ring-outline" 
            label="Notification Settings" 
            onPress={handleNotificationSettings} 
          />

          <ProfileOptionItem 
            icon="help-circle-outline" 
            label="Help & Support" 
            onPress={handleHelpAndSupport} 
          />
        </View>

        {/* --- Logout Button --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color={COLORS.white} />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1, 
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 5,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.primaryGreen,
    marginBottom: 15,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.grey,
    marginTop: 4,
  },
  optionsContainer: {
    marginTop: 20,
    flex: 1, 
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    marginRight: 20,
  },
  optionLabel: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error || '#FF5252',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 30, 
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});