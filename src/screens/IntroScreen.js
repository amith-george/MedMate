// src/screens/IntroScreen.js
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { Button, Subheading, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import AnimatedBackground from '../components/AnimatedBackground'; // <-- Import component

// A modern green color palette
const COLORS = {
  primaryGreen: '#2E7D32', // A deep, trustworthy green for buttons
  lightGreen: '#E8F5E9',   // A very light green for the gradient start
  white: '#FFFFFF',
  grey: '#666',
};

// Reusable Pill Logo Component
const PillLogo = () => (
  <View style={styles.logoContainer}>
    <Svg width="80" height="80" viewBox="0 0 100 100">
      <Path
        d="M50 10 a40 40 0 0 1 0 80 a40 40 0 0 1 0 -80"
        fill={COLORS.primaryGreen}
      />
      <Path
        d="M50 10 a40 40 0 0 0 0 80"
        fill={COLORS.lightGreen}
      />
       <Path
        d="M20 50 L80 50"
        stroke={COLORS.white}
        strokeWidth="4"
      />
    </Svg>
  </View>
);


export default function IntroScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <LinearGradient
        colors={[COLORS.lightGreen, COLORS.white]}
        style={styles.gradient}
      >
        <AnimatedBackground />

        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <PillLogo />
            <Title style={styles.title}>Welcome to MedMate</Title>
            <Subheading style={styles.subheading}>
              Your personal assistant for managing medications effectively and staying on track.
            </Subheading>
          </View>

          <View style={styles.footerContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              color={COLORS.primaryGreen}
            >
              Log In
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Register')}
              style={[styles.button, styles.registerButton]}
              labelStyle={[styles.buttonLabel, styles.registerButtonLabel]}
              color={COLORS.primaryGreen}
            >
              Register
            </Button>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.lightGreen },
  gradient: { flex: 1, overflow: 'hidden' },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
    zIndex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 20,
  },
  logoContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: COLORS.grey,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footerContainer: {
    paddingBottom: 20,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
  },
  registerButton: {
    borderColor: COLORS.primaryGreen,
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButtonLabel: {
      color: COLORS.primaryGreen,
  },
});