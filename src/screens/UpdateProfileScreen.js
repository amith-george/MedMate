// src/screens/UpdateProfileScreen.js

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import COLORS from '../constants/colors';
import { updateUser } from '../state/authSlice';
import { getAvatar } from '../utils/avatarUtils';

// Avatar list ordered as requested
const AVATAR_OPTIONS = [
  'boy1.png', 'girl1.png', 'boy3.png', 
  'girl3.png', 'boy2.png', 'girl2.png'
]; 

export default function UpdateProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const nameInputRef = useRef(null);

  // Redux state
  const { user, status } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  // --- Form State ---
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('boy1.png');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [shouldNavigateAway, setShouldNavigateAway] = useState(false);

  // --- 1. SYNC STATE ON LOAD ---
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || ''); 
      setSelectedAvatar(user.avatar || 'boy1.png');
    }
  }, [user]);

  // --- 2. CALCULATE UNSAVED CHANGES ---
  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false;

    const normalize = (val) => (val || '').trim();
    const currentName = normalize(name);
    const originalName = normalize(user.name);
    const currentAvatar = selectedAvatar || 'boy1.png';
    const originalAvatar = user.avatar || 'boy1.png';

    return currentName !== originalName || currentAvatar !== originalAvatar;
  }, [name, selectedAvatar, user]);

  // --- 3. HANDLE BACK NAVIGATION INTERCEPTION ---
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If we are already navigating away due to a save, or no changes, or loading
      if (shouldNavigateAway || !hasUnsavedChanges || isLoading) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Would you like to save them before leaving?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => {} },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
          {
            text: 'Save',
            onPress: () => handleUpdate(true), 
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation, hasUnsavedChanges, isLoading, shouldNavigateAway]); 

  // --- 4. SUCCESS NAVIGATION HANDLER ---
  useEffect(() => {
    if (shouldNavigateAway) {
      navigation.goBack();
    }
  }, [shouldNavigateAway, navigation]);


  const handleEditNamePress = () => {
    setIsEditingName(true);
    setTimeout(() => {
        nameInputRef.current?.focus();
    }, 100);
  };

  const handleUpdate = async (isExit = false) => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }

    const updateData = {
      name,
      avatar: selectedAvatar,
    };

    try {
      await dispatch(updateUser(updateData)).unwrap();
      
      // Setting this to true triggers the useEffect above to pop the screen.
      // No Alert is shown; the navigation itself acts as confirmation.
      setShouldNavigateAway(true);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
      setShouldNavigateAway(false); 
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleVerifyEmail = () => {
    navigation.navigate('VerifyEmail');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* --- Avatar Selection --- */}
          <Text style={styles.sectionLabel}>Choose Avatar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
            {AVATAR_OPTIONS.map((avatarName, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setSelectedAvatar(avatarName)}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatarName && styles.avatarSelected
                ]}
              >
                <Image source={getAvatar(avatarName)} style={styles.avatarImage} />
                {selectedAvatar === avatarName && (
                  <View style={styles.checkmarkContainer}>
                    <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.primaryGreen} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* --- Form Fields --- */}
          <View style={styles.formContainer}>
            
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                  styles.inputWrapper, 
                  !isEditingName && styles.disabledInputWrapper
              ]}>
                <MaterialCommunityIcons name="account-outline" size={22} color={COLORS.grey} />
                <TextInput
                  ref={nameInputRef}
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#999"
                  editable={isEditingName} 
                />
                <TouchableOpacity onPress={handleEditNamePress} style={styles.pencilIcon}>
                    <MaterialCommunityIcons 
                        name="pencil" 
                        size={20} 
                        color={isEditingName ? COLORS.primaryGreen : COLORS.grey} 
                    />
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone (Read Only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                <MaterialCommunityIcons name="phone-outline" size={22} color={COLORS.grey} />
                <TextInput
                  style={[styles.input, { color: COLORS.grey }]}
                  value={phone}
                  editable={false}
                />
                <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.grey} />
              </View>
              <Text style={styles.helperText}>Phone number cannot be changed.</Text>
            </View>

            {/* --- NEW: Verified Email Field (Visible Only if Verified) --- */}
            {user?.isEmailVerified && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                  {/* Using email-check icon to show it's verified */}
                  <MaterialCommunityIcons name="email-check-outline" size={22} color={COLORS.primaryGreen} />
                  <TextInput
                    style={[styles.input, { color: COLORS.grey }]}
                    value={user.email}
                    editable={false}
                  />
                  <MaterialCommunityIcons name="lock-outline" size={18} color={COLORS.grey} />
                </View>
                <Text style={styles.helperText}>Verified email cannot be changed manually.</Text>
              </View>
            )}

          </View>

          {/* --- Action Buttons (Change Password & Verify Email) --- */}
          <View style={styles.actionButtonsContainer}>
            
            {/* Change Password - Always Visible */}
            <TouchableOpacity 
                style={[
                    styles.actionButton, 
                    styles.changePassButton,
                    // If verified, this button takes full width. If not, it shares space.
                    user?.isEmailVerified && { flex: 1 } 
                ]} 
                onPress={handleChangePassword}
            >
                <MaterialCommunityIcons name="lock-reset" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            {/* Verify Email Button - Only if NOT verified */}
            {!user?.isEmailVerified && (
                <TouchableOpacity 
                    style={[styles.actionButton, styles.verifyEmailButton]} 
                    onPress={handleVerifyEmail}
                >
                    <MaterialCommunityIcons name="email-check-outline" size={20} color={COLORS.primaryGreen} />
                    <Text style={[styles.actionButtonText, styles.verifyEmailText]}>Verify Email</Text>
                </TouchableOpacity>
            )}
          </View>

          {/* --- Save Button --- */}
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={() => handleUpdate(false)}
            disabled={isLoading}
          >
            {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  avatarList: {
    flexGrow: 0,
    marginBottom: 25,
  },
  avatarOption: {
    marginRight: 15,
    padding: 4,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  avatarSelected: {
    borderColor: COLORS.primaryGreen,
    backgroundColor: '#fff',
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  formContainer: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledInputWrapper: {
    backgroundColor: '#FAFAFA',
  },
  readOnlyInput: {
    backgroundColor: '#EBEBEB',
    borderColor: '#EBEBEB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  pencilIcon: {
    padding: 5,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 5,
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  changePassButton: {
    backgroundColor: '#444', 
  },
  verifyEmailButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
  },
  verifyEmailText: {
    color: COLORS.primaryGreen,
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});