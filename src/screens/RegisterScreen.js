import auth from '@react-native-firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button, Checkbox, HelperText, Subheading, TextInput, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import apiClient from '../api/axiosConfig';
import AnimatedBackground from '../components/AnimatedBackground';
import COLORS from '../constants/colors';
import {
  validateConfirmPassword,
  validateName,
  validatePassword,
  validatePhone
} from '../utils/validation';

const PillLogo = () => (
    <View style={styles.logoContainer}>
      <Svg width="60" height="60" viewBox="0 0 100 100">
        <Path d="M50 10 a40 40 0 0 1 0 80 a40 40 0 0 1 0 -80" fill={COLORS.primaryGreen} />
        <Path d="M50 10 a40 40 0 0 0 0 80" fill={COLORS.lightGreen} />
        <Path d="M20 50 L80 50" stroke={COLORS.white} strokeWidth="4" />
      </Svg>
    </View>
);

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSendOtp = async () => {
    const nameError = validateName(name);
    const phoneError = validatePhone(phone);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    if (nameError || phoneError || passwordError || confirmPasswordError) {
      setErrors({
        name: nameError,
        phone: phoneError,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      return;
    }

    setErrors({});
    const formattedPhone = `+91${phone}`;
    setLoading(true);
    try {
      await apiClient.post('/users/check-user', { phone: formattedPhone });
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone, true);
      navigation.navigate('OTP', {
        name,
        password,
        phone: formattedPhone,
        confirmation,
      });
    } catch (err) {
      const errorMessage = err.isAxiosError 
        ? err.response?.data?.message 
        : err.message || 'An error occurred. Please try again.';
      Alert.alert('Error', errorMessage);
      setErrors({ form: errorMessage });
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
                  <View style={styles.headerContainer}>
                    <PillLogo />
                    <Title style={styles.title}>Create Your Account</Title>
                    <Subheading style={styles.subheading}>Join MedMate to manage your health journey.</Subheading>
                  </View>

                  <View style={styles.formContainer}>
                    <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} mode="outlined" left={<TextInput.Icon icon="account-outline" />} theme={{ roundness: 12 }} error={!!errors.name} />
                    {errors.name && <HelperText type="error" visible={true}>{errors.name}</HelperText>}
                    
                    <TextInput label="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} mode="outlined" keyboardType="phone-pad" maxLength={10} left={<TextInput.Icon icon="phone-outline" />} right={<TextInput.Affix text="+91" />} theme={{ roundness: 12 }} error={!!errors.phone} />
                    {errors.phone && <HelperText type="error" visible={true}>{errors.phone}</HelperText>}

                    <TextInput label="Password" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry={!isPasswordVisible} left={<TextInput.Icon icon="lock-outline" />} right={<TextInput.Icon icon={isPasswordVisible ? 'eye-off' : 'eye'} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />} theme={{ roundness: 12 }} error={!!errors.password} />
                    {errors.password && <HelperText type="error" visible={true}>{errors.password}</HelperText>}

                    <TextInput label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} mode="outlined" secureTextEntry={!isConfirmPasswordVisible} left={<TextInput.Icon icon="lock-check-outline" />} right={<TextInput.Icon icon={isConfirmPasswordVisible ? 'eye-off' : 'eye'} onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)} />} theme={{ roundness: 12 }} error={!!errors.confirmPassword} />
                    {errors.confirmPassword && <HelperText type="error" visible={true}>{errors.confirmPassword}</HelperText>}
                  </View>
              </View>
          
              <View style={styles.footerContainer}>
                <View style={styles.termsContainer}>
                  <Checkbox.Android status={agreeToTerms ? 'checked' : 'unchecked'} onPress={() => setAgreeToTerms(!agreeToTerms)} color={COLORS.primaryGreen} />
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                  </Text>
                </View>

                <Button mode="contained" onPress={handleSendOtp} style={styles.button} labelStyle={styles.buttonLabel} disabled={loading || !agreeToTerms} color={COLORS.primaryGreen}>
                    {loading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Send OTP'}
                </Button>
                <Button mode="text" onPress={() => navigation.navigate('Login')} style={styles.linkButton} disabled={loading} color={COLORS.grey}>
                    Already have an account? Log In
                </Button>
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
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
      zIndex: 1,
    },
    contentWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 20,
        paddingBottom: 30,
        marginBottom: 40,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logoContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 40,
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#333',
      marginBottom: 8,
    },
    subheading: {
      fontSize: 16,
      color: COLORS.grey,
      textAlign: 'center',
    },
    formContainer: {
      width: '100%',
    },
    input: {
      backgroundColor: COLORS.white,
      marginTop: 12,
    },
    footerContainer: {
      backgroundColor: 'transparent',
    },
    termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginLeft: -8,
    },
    termsText: {
      flex: 1,
      fontSize: 14,
      color: COLORS.grey,
    },
    linkText: {
      color: COLORS.primaryGreen,
      fontWeight: 'bold',
      textDecorationLine: 'underline',
    },
    button: {
      paddingVertical: 10,
      borderRadius: 12,
      elevation: 2,
    },
    buttonLabel: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    linkButton: {
      marginTop: 16,
    },
});