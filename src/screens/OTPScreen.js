// src/screens/OTPScreen.js
import { getAuth, getIdToken, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActivityIndicator, Button, HelperText, Subheading, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import AnimatedBackground from '../components/AnimatedBackground';
import COLORS from '../constants/colors';
import { registerUser } from '../state/authSlice';


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

const OtpInput = ({ value, onChange }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef([]);

  const handleOtpChange = (text, index) => {
    if (isNaN(text)) return;
    const newOtp = [...value];
    newOtp[index] = text;
    onChange(newOtp);

    if (!text && index > 0) {
      inputs.current[index - 1].focus();
    } else if (text && index < 5) {
      inputs.current[index + 1].focus();
    }
  };

  const handleBackspace = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <View style={styles.otpContainer}>
      {value.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputs.current[index] = ref)}
          style={[styles.otpBox, focusedIndex === index && styles.otpBoxFocused]}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => handleOtpChange(text, index)}
          onKeyPress={(event) => handleBackspace(event, index)}
          onFocus={() => setFocusedIndex(index)}
          value={digit}
          caretHidden
        />
      ))}
    </View>
  );
};

// --- Main Screen Component ---

export default function OTPScreen({ route, navigation }) {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- State for countdown timer and new confirmation object ---
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [newConfirmation, setNewConfirmation] = useState(route.params.confirmation);

  const dispatch = useDispatch();
  const { name, password, phone } = route.params;

  // --- useEffect to handle the countdown timer ---
  useEffect(() => {
    if (canResend) return; // Stop the timer if resend is available

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setCanResend(true); // Enable resend button
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [canResend]); // Rerun effect when canResend changes

  const handleVerifyOtp = async () => {
    const finalOtp = otp.join('');
    if (!finalOtp || finalOtp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP.');
    }
    setError(null);
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Use the latest confirmation object (could be the original or a new one)
      const userCredential = await newConfirmation.confirm(finalOtp);
      const idToken = await getIdToken(userCredential.user);
      
      const resultAction = await dispatch(registerUser({ name, password, idToken }));
      if (registerUser.rejected.match(resultAction)) {
        throw new Error(resultAction.payload?.message || 'Registration failed.');
      }
    } catch (err) {
      const errorMessage = 'Invalid OTP or an error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Function to handle resending OTP ---
  const handleResendOtp = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const auth = getAuth();
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`; // Ensure format
      
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, true);
      
      setNewConfirmation(confirmationResult); // Store the new confirmation object
      setCanResend(false); // Disable the resend button
      setCountdown(60); // Reset the timer
      Alert.alert('OTP Sent', 'A new OTP has been sent to your number.');

    } catch (err) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again later.');
      console.error("Resend OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient colors={[COLORS.lightGreen, COLORS.white]} style={styles.gradient}>
        <AnimatedBackground />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentWrapper}>
                <AuthHeader title="Verify Your Number" subtitle={`Enter the 6-digit code sent to ${phone}`} />
                <View style={styles.formContainer}>
                  <OtpInput value={otp} onChange={setOtp} />
                  {error && <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText>}
                  
                  {/* --- Resend OTP UI --- */}
                  <View style={styles.resendContainer}>
                    {canResend ? (
                      <TouchableOpacity onPress={handleResendOtp} disabled={loading}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.countdownText}>
                        Resend OTP in {countdown}s
                      </Text>
                    )}
                  </View>
                </View>
            </View>
            <View style={styles.footerContainer}>
                <Button mode="contained" onPress={handleVerifyOtp} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading} color={COLORS.primaryGreen}>
                  {loading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Verify & Create Account'}
                </Button>
                <Button mode="text" onPress={() => navigation.goBack()} style={styles.linkButton} disabled={loading} color={COLORS.grey}>
                  Go Back
                </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  gradient: { flex: 1, overflow: 'hidden' },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, zIndex: 1 },
  contentWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20, padding: 20, paddingBottom: 40, marginBottom: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { backgroundColor: COLORS.white, borderRadius: 40, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 30, elevation: 5 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 12 },
  subheading: { fontSize: 16, color: COLORS.grey, textAlign: 'center', lineHeight: 24 },
  formContainer: { width: '100%' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  otpBox: { width: 48, height: 52, borderWidth: 1, borderColor: COLORS.grey, borderRadius: 8, textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#333', backgroundColor: COLORS.white },
  otpBoxFocused: { borderColor: COLORS.primaryGreen, borderWidth: 2, shadowColor: COLORS.primaryGreen, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  errorText: { fontSize: 14, textAlign: 'center', marginTop: 20 },
  footerContainer: { backgroundColor: 'transparent' },
  button: { paddingVertical: 10, borderRadius: 12, elevation: 2 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 16 },
  
  resendContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 16,
    color: COLORS.grey,
  },
  resendText: {
    fontSize: 16,
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});