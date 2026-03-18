import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import COLORS from '../constants/colors';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import MedicineDetailScreen from '../screens/MedicineDetailScreen';
import PillsScreen from '../screens/PillsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomHeaderTitle = () => (
  <View style={styles.headerTitleContainer}>
    <MaterialCommunityIcons name="pill" color={COLORS.primaryGreen} size={28} />
    <Text style={styles.headerTitleText}>MedMate</Text>
  </View>
);

function PillsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white, elevation: 2, shadowOpacity: 0.1 },
        headerTitleAlign: 'left',
      }}>
      <Stack.Screen name="PillsList" component={PillsScreen} options={{ headerTitle: () => <CustomHeaderTitle /> }} />
      <Stack.Screen
        name="MedicineDetail"
        component={MedicineDetailScreen}
        options={({ route }) => ({ title: route.params.medicineName })}
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: COLORS.primaryGreen,
        tabBarInactiveTintColor: COLORS.grey,
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: true,
          headerTitle: () => <CustomHeaderTitle />,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Pills"
        component={PillsStack}
        options={({ route }) => ({
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'PillsList';
            if (routeName === 'MedicineDetail') return { display: 'none' };
            return;
          })(route),
          tabBarLabel: 'Meds',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="pill" color={color} size={size} />,
        })}
      />
      
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true, 
          headerTitle: () => <CustomHeaderTitle />,
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="robot-happy-outline" color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          headerShown: true,
          headerTitle: () => <CustomHeaderTitle />,
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="history" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerTitle: () => <CustomHeaderTitle />,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitleText: { marginLeft: 10, fontSize: 22, fontWeight: 'bold', color: '#333' },
});