// src/screens/ForgotPasswordScreen.js
import { getAuth, getIdToken, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Subheading,
  TextInput,
  Title
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import apiClient from '../api/axiosConfig';
import AnimatedBackground from '../components/AnimatedBackground';
import COLORS from '../constants/colors';
import { validateConfirmPassword, validatePassword } from '../utils/validation';

// --- Reusable UI Sub-components ---

const PillLogo = () => (
  <View style={styles.logoContainer}>
    <Svg width="60" height="60" viewBox="0 0 100 100">
      <Path d="M50 10 a40 40 0 0 1 0 80 a40 40 0 0 1 0 -80" fill={COLORS.primaryGreen} />
      <Path d="M50 10 a40 40 0 0 0 0 80" fill={COLORS.lightGreen} />
      <Path d="M20 50 L80 50" stroke={COLORS.white} strokeWidth="4" />
    </Svg>
  </View>
);

const AuthHeader = ({ title, subtitle }) => (
  <View style={styles.headerContainer}>
    <PillLogo />
    <Title style={styles.title}>{title}</Title>
    <Subheading style={styles.subheading}>{subtitle}</Subheading>
  </View>
);

// --- Main Component ---

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [error, setError] = useState('');

  // --- Handlers ---
  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setLoading(true);
    const formattedPhone = `+91${phone}`;

    try {
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
      setConfirmResult(confirmation);
      setStep(1); 
      Alert.alert('OTP Sent', `We sent a code to ${formattedPhone}`);
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmResult.confirm(otp);
      setStep(2); 
    } catch (err) {
      console.error(err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const passError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(newPassword, confirmPassword);

    if (passError || confirmError) {
      setError(passError || confirmError);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const idToken = await getIdToken(user);
        await apiClient.post('/users/reset-password', { idToken, newPassword });
        Alert.alert('Success', 'Your password has been reset successfully!', [
          { text: 'Login Now', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
         setError('Session expired. Please verify OTP again.');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to update password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Content ---
  const renderContent = () => {
    if (step === 0) {
      return (
        <>
          <AuthHeader title="Forgot Password?" subtitle="Enter your phone number to receive an OTP." />
          <View style={styles.formContainer}>
            <TextInput label="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} mode="outlined" keyboardType="phone-pad" maxLength={10} left={<TextInput.Icon icon="phone-outline" />} right={<TextInput.Affix text="+91" />} theme={{ roundness: 12 }} />
          </View>
          <View style={styles.footerContainer}>
             <Button mode="contained" onPress={handleSendOtp} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading} color={COLORS.primaryGreen}>
                {loading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Send OTP'}
              </Button>
          </View>
        </>
      );
    } 
    if (step === 1) {
      return (
        <>
          <AuthHeader title="Verify OTP" subtitle={`Enter the 6-digit code sent to +91 ${phone}`} />
          <View style={styles.formContainer}>
            <TextInput label="OTP" value={otp} onChangeText={setOtp} style={styles.input} mode="outlined" keyboardType="number-pad" maxLength={6} left={<TextInput.Icon icon="message-processing-outline" />} theme={{ roundness: 12 }} />
          </View>
          <View style={styles.footerContainer}>
            <Button mode="contained" onPress={handleVerifyOtp} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading} color={COLORS.primaryGreen}>
              {loading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Verify Code'}
            </Button>
          </View>
        </>
      );
    }
    if (step === 2) {
      return (
        <>
          <AuthHeader title="Reset Password" subtitle="Create a new strong password." />
          <View style={styles.formContainer}>
            <TextInput label="New Password" value={newPassword} onChangeText={setNewPassword} style={styles.input} mode="outlined" secureTextEntry={!isPasswordVisible} left={<TextInput.Icon icon="lock-outline" />} right={<TextInput.Icon icon={isPasswordVisible ? 'eye-off' : 'eye'} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />} theme={{ roundness: 12 }} />
            <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} mode="outlined" secureTextEntry={!isConfirmVisible} left={<TextInput.Icon icon="lock-check-outline" />} right={<TextInput.Icon icon={isConfirmVisible ? 'eye-off' : 'eye'} onPress={() => setIsConfirmVisible(!isConfirmVisible)} />} theme={{ roundness: 12 }} />
          </View>
          <View style={styles.footerContainer}>
            <Button mode="contained" onPress={handleResetPassword} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading} color={COLORS.primaryGreen}>
              {loading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Update Password'}
            </Button>
          </View>
        </>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient colors={[COLORS.lightGreen, COLORS.white]} style={styles.gradient}>
        <AnimatedBackground />
        
        <View style={styles.backButtonContainer}>
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={28} 
            color={COLORS.primaryGreen} 
            onPress={() => navigation.goBack()} 
          />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentWrapper}>
              {renderContent()}
              {error ? <HelperText type="error" visible={true} style={styles.errorText}>{error}</HelperText> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: { flex: 1, overflow: 'hidden' },
  container: { flex: 1 },
  
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50, // Adjusted for status bar
    left: 24,
    zIndex: 20, // Ensure it sits above everything
  },

  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 60, 
    paddingBottom: 40, 
    zIndex: 1 
  },
  contentWrapper: { 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    borderRadius: 20, 
    padding: 20, 
    paddingBottom: 30, 
    marginBottom: 40 
  },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 40, 
    width: 80, 
    height: 80, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20, 
    elevation: 5 
  },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subheading: { fontSize: 16, color: COLORS.grey, textAlign: 'center' },
  formContainer: { width: '100%' },
  input: { backgroundColor: COLORS.white, marginTop: 16 },
  footerContainer: { marginTop: 20, backgroundColor: 'transparent' },
  button: { paddingVertical: 10, borderRadius: 12, elevation: 2 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
  errorText: { marginTop: 10, textAlign: 'center', fontSize: 14 },
});