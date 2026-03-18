// src/screens/LoginScreen.js
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Subheading, TextInput, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import AnimatedBackground from '../components/AnimatedBackground';
import COLORS from '../constants/colors';
import { loginUser } from '../state/authSlice';

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

const LoginForm = ({ phone, setPhone, password, setPassword, errorStatus, onForgotPassword }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  return (
    <View style={styles.formContainer}>
      <TextInput label="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} mode="outlined" keyboardType="phone-pad" left={<TextInput.Icon icon="phone-outline" />} right={<TextInput.Affix text="+91" />} theme={{ roundness: 12 }} />
      <TextInput label="Password" value={password} onChangeText={setPassword} style={styles.input} mode="outlined" secureTextEntry={!isPasswordVisible} left={<TextInput.Icon icon="lock-outline" />} right={<TextInput.Icon icon={isPasswordVisible ? 'eye-off' : 'eye'} onPress={() => setIsPasswordVisible(!isPasswordVisible)} />} theme={{ roundness: 12 }} />
      <Button mode="text" onPress={onForgotPassword} style={styles.forgotPasswordButton} labelStyle={styles.forgotPasswordLabel} color={COLORS.primaryGreen}>
        Forgot Password?
      </Button>
      {errorStatus && <HelperText type="error" visible={true}>{errorStatus}</HelperText>}
    </View>
  );
};

// --- Main Screen Component ---

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  const handleLogin = async () => {
    if (!phone || !password) {
      return Alert.alert('Missing Information', 'Please enter both your phone number and password.');
    }
    const resultAction = await dispatch(loginUser({ phone: `+91${phone}`, password }));
    if (loginUser.rejected.match(resultAction)) {
      Alert.alert('Login Failed', resultAction.payload?.message || 'Invalid credentials.');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };


  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient colors={[COLORS.lightGreen, COLORS.white]} style={styles.gradient}>
        <AnimatedBackground />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.contentWrapper}>
              <AuthHeader title="Welcome Back" subtitle="Log in to manage your health" />
              <LoginForm phone={phone} setPhone={setPhone} password={password} setPassword={setPassword} errorStatus={error} onForgotPassword={handleForgotPassword} />
            </View>
            <View style={styles.footerContainer}>
              <Button mode="contained" onPress={handleLogin} style={styles.button} labelStyle={styles.buttonLabel} disabled={isLoading} color={COLORS.primaryGreen}>
                {isLoading ? <ActivityIndicator animating={true} color={COLORS.white} /> : 'Log In'}
              </Button>
              <Button mode="text" onPress={() => navigation.navigate('Register')} style={styles.linkButton} disabled={isLoading} color={COLORS.grey}>
                Don't have an account? Sign Up
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
  contentWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 20, padding: 20, paddingBottom: 30, marginBottom: 40 },
  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoContainer: { backgroundColor: COLORS.white, borderRadius: 40, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  subheading: { fontSize: 16, color: COLORS.grey, textAlign: 'center' },
  formContainer: { width: '100%' },
  input: { backgroundColor: COLORS.white, marginTop: 16 },
  forgotPasswordButton: { alignSelf: 'flex-end', marginTop: 8 },
  forgotPasswordLabel: { fontSize: 14, fontWeight: '600' },
  footerContainer: { backgroundColor: 'transparent' },
  button: { paddingVertical: 10, borderRadius: 12, elevation: 2 },
  buttonLabel: { fontSize: 16, fontWeight: 'bold' },
  linkButton: { marginTop: 16 },
});