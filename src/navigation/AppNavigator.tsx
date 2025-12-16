import React from 'react';
import { SafeAreaView, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import BrowseScreen from '../screens/BrowseScreen';
import SellScreen from '../screens/SellScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import { ToastProvider } from '../context/ToastContext';

import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import ReportScreen from '../screens/ReportScreen';
import DisputeScreen from '../screens/DisputeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Browse':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Sell':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Browse" 
        component={BrowseScreen}
        options={{
          title: 'Browse',
        }}
      />
      <Tab.Screen 
        name="Sell" 
        component={SellScreen}
        options={{
          title: 'Sell',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { isDark, colors } = useThemeMode();

  console.log('[AppNavigator] Render - isAuthenticated:', isAuthenticated, 'loading:', loading);

  if (loading) {
    console.log('[AppNavigator] Showing loading state');
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.muted, fontSize: 14, fontWeight: '500' }}>Loading...</Text>
      </SafeAreaView>
    )
  }

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <ToastProvider>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            headerTitleStyle: {
              fontSize: 18,
            },
          }}
        >
          {!isAuthenticated ? (
            <>
              {console.log('[AppNavigator] Rendering AuthScreen')}
              <Stack.Screen 
                name="Auth" 
                component={AuthScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              {console.log('[AppNavigator] Rendering MainTabs')}
              <Stack.Screen 
                name="Main" 
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="ListingDetails" 
                component={ListingDetailsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Chat" 
                component={ChatScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Settings" 
                component={SettingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Messages" 
                component={MessagesScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="SellerProfile" 
                component={SellerProfileScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="PrivacySecurity" 
                component={PrivacySecurityScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="HelpSupport" 
                component={HelpSupportScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Favorites" 
                component={FavoritesScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Cart" 
                component={CartScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Checkout" 
                component={CheckoutScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="TransactionHistory" 
                component={TransactionHistoryScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Report" 
                component={ReportScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Dispute" 
                component={DisputeScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
};

export default AppNavigator;
