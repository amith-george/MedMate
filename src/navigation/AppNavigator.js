// src/navigation/AppNavigator.js
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

// Import all your authentication screens
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import IntroScreen from '../screens/IntroScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPScreen from '../screens/OTPScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Import the new Caregiver Screen & Profile Screens
import CaregiverScreen from '../screens/CaregiverScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen'; // <-- Added Import
import UpdateProfileScreen from '../screens/UpdateProfileScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';

// Import the new TabNavigator
import TabNavigator from './TabNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator>
      {token ? (
        // If the user is logged in, show the Main App flow
        <>
          <Stack.Screen 
            name="MainApp"
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Caregivers" 
            component={CaregiverScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="UpdateProfile" 
            component={UpdateProfileScreen} 
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen 
            name="ChangePassword" 
            component={ChangePasswordScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="VerifyEmail" 
            component={VerifyEmailScreen} 
            options={{ headerShown: false }} 
          />
          {/* Register the new Notification Settings Screen */}
          <Stack.Screen 
            name="NotificationSettings" 
            component={NotificationSettingsScreen} 
            options={{ headerShown: false }} 
          />
        </>
      ) : (
        // If the user is not logged in, show the authentication flow
        <>
          <Stack.Screen name="Intro" component={IntroScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTP" component={OTPScreen} options={{ headerShown: false }} /> 
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}