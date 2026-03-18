import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import apiClient from '../api/axiosConfig';
import COLORS from '../constants/colors';
import { updateUser } from '../state/authSlice';

// --- Reusable Logic: OTP Input ---
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

export default function VerifyEmailScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(0); // 0: Input Email, 1: Verify OTP
  const [email, setEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Timer logic
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 1 && !canResend) {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, canResend]);

  const handleSendOtp = async () => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      await apiClient.post('/users/send-email-otp', { email });
      setStep(1);
      setCanResend(false);
      setCountdown(60);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const finalOtp = otp.join('');
    if (finalOtp.length !== 6) {
      setError('Please enter the full 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    Keyboard.dismiss();

    try {
      // Call verify endpoint
      const response = await apiClient.post('/users/verify-email-otp', { email, otp: finalOtp });
      
      // Update Redux state
      dispatch(updateUser.fulfilled(response.data, 'manual_verification'));

      // Successfully verified; navigate back immediately without alert
      navigation.goBack();
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Steps ---

  const renderEmailStep = () => (
    <View style={styles.formContainer}>
        <Text style={styles.descriptionText}>
          Enter your email address. We will send you a verification code.
        </Text>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={22} color={COLORS.grey} />
                <TextInput 
                    style={styles.input} 
                    value={email} 
                    onChangeText={setEmail} 
                    placeholder="example@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                />
            </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSendOtp}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.saveButtonText}>Send Code</Text>
            )}
        </TouchableOpacity>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.formContainer}>
        <Text style={styles.descriptionText}>
          Enter the 6-digit code sent to {email}
        </Text>

        <View style={styles.inputGroup}>
             <OtpInput value={otp} onChange={setOtp} />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.resendContainer}>
            {canResend ? (
                <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                    <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.countdownText}>
                    Resend code in {countdown}s
                </Text>
            )}
        </View>

        <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleVerifyOtp}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.white} />
            ) : (
                <Text style={styles.saveButtonText}>Verify Email</Text>
            )}
        </TouchableOpacity>

        <TouchableOpacity 
            onPress={() => setStep(0)} 
            style={styles.linkButton} 
            disabled={loading}
        >
            <Text style={styles.linkButtonText}>Change Email Address</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.primaryGreen} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify Email</Text>
            <View style={{ width: 28 }} /> 
          </View>

          {step === 0 ? renderEmailStep() : renderOtpStep()}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 20,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  
  // OTP Styles
  otpContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  otpBox: { 
    width: 48, 
    height: 52, 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 12, 
    textAlign: 'center', 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#333', 
    backgroundColor: COLORS.white 
  },
  otpBoxFocused: { 
    borderColor: COLORS.primaryGreen, 
    borderWidth: 2 
  },

  // Button Styles
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
  
  // Link/Secondary Button
  linkButton: { 
    marginTop: 20, 
    alignItems: 'center' 
  },
  linkButtonText: {
    color: COLORS.grey,
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Helper Texts
  errorText: { 
    color: COLORS.error, 
    textAlign: 'center', 
    marginBottom: 15,
    fontSize: 14,
  },
  resendContainer: { 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  countdownText: { 
    fontSize: 14, 
    color: COLORS.grey 
  },
  resendText: { 
    fontSize: 14, 
    color: COLORS.primaryGreen, 
    fontWeight: 'bold', 
    textDecorationLine: 'underline' 
  },
});