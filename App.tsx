import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { DesignModeProvider, useDesignMode } from './src/context/DesignModeContext';

// ── Customer Screens ────────────────────────────────────────────────────────────
import AppPickerScreen from './src/screens/AppPickerScreen';
import OnboardingScreen from './src/screens/onboarding/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import FuelSelectionScreen from './src/screens/order/FuelSelectionScreen';
import DeliveryLocationScreen from './src/screens/order/DeliveryLocationScreen';
import AddAddressScreen from './src/screens/order/AddAddressScreen';
import DeliveryTimeScreen from './src/screens/order/DeliveryTimeScreen';
import PaymentMethodScreen from './src/screens/order/PaymentMethodScreen';
import AddCardScreen from './src/screens/order/AddCardScreen';
import OrderReviewScreen from './src/screens/order/OrderReviewScreen';
import OrderPlacedScreen from './src/screens/order/OrderPlacedScreen';
import LiveTrackingScreen from './src/screens/order/LiveTrackingScreen';
import DeliveryPinScreen from './src/screens/order/DeliveryPinScreen';
import RateReviewScreen from './src/screens/order/RateReviewScreen';
import DigitalReceiptScreen from './src/screens/order/DigitalReceiptScreen';
import OrderHistoryScreen from './src/screens/history/OrderHistoryScreen';
import RewardsScreen from './src/screens/rewards/RewardsScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';

// ── Driver Screens ──────────────────────────────────────────────────────────────
import DriverLoginScreen from './src/screens/driver/DriverLoginScreen';
import AvailableOrdersScreen from './src/screens/driver/AvailableOrdersScreen';
import OrderDetailsScreen from './src/screens/driver/OrderDetailsScreen';
import ActiveNavigationScreen from './src/screens/driver/ActiveNavigationScreen';
import StatusUpdateScreen from './src/screens/driver/StatusUpdateScreen';
import ProofOfDeliveryScreen from './src/screens/driver/ProofOfDeliveryScreen';
import DeliveryCompleteScreen from './src/screens/driver/DeliveryCompleteScreen';
import EarningsScreen from './src/screens/driver/EarningsScreen';
import SOSScreen from './src/screens/driver/SOSScreen';
import DriverProfileScreen from './src/screens/driver/DriverProfileScreen';

import { Fonts } from './src/theme/tokens';
import { Feather } from '@expo/vector-icons';

// ── Navigators ─────────────────────────────────────────────────────────────────
const RootStack = createStackNavigator();
const CustomerTab = createBottomTabNavigator();
const DriverTab = createBottomTabNavigator();

// ── Customer Bottom Tabs ───────────────────────────────────────────────────────
function CustomerTabNavigator() {
  const { colors, isWireframe } = useDesignMode();

  return (
    <CustomerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isWireframe ? '#FFFFFF' : colors.white,
          borderTopColor: isWireframe ? '#CCCCCC' : colors.divider,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarActiveTintColor: isWireframe ? '#333333' : colors.petrolDeep,
        tabBarInactiveTintColor: isWireframe ? '#AAAAAA' : colors.inkFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: isWireframe ? undefined : Fonts.bodyMedium,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            HomeTab: 'home',
            OrdersTab: 'package',
            RewardsTab: 'award',
            ProfileTab: 'user',
          };
          if (isWireframe) {
            return (
              <View
                style={{
                  width: size,
                  height: size,
                  borderWidth: 1.5,
                  borderColor: color,
                  borderRadius: 4,
                }}
              />
            );
          }
          return <Feather name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <CustomerTab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
      <CustomerTab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ title: 'Orders' }} />
      <CustomerTab.Screen name="RewardsTab" component={RewardsScreen} options={{ title: 'Rewards' }} />
      <CustomerTab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
    </CustomerTab.Navigator>
  );
}

// ── Driver Bottom Tabs ─────────────────────────────────────────────────────────
function DriverTabNavigator() {
  const { colors, isWireframe } = useDesignMode();

  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isWireframe ? '#FFFFFF' : colors.white,
          borderTopColor: isWireframe ? '#CCCCCC' : colors.divider,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarActiveTintColor: isWireframe ? '#333333' : colors.petrolDeep,
        tabBarInactiveTintColor: isWireframe ? '#AAAAAA' : colors.inkFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: isWireframe ? undefined : Fonts.bodyMedium,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            DriverOrdersTab: 'truck',
            DriverEarningsTab: 'trending-up',
            DriverProfileTab: 'user',
          };
          if (isWireframe) {
            return (
              <View
                style={{
                  width: size,
                  height: size,
                  borderWidth: 1.5,
                  borderColor: color,
                  borderRadius: 4,
                }}
              />
            );
          }
          return <Feather name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <DriverTab.Screen name="DriverOrdersTab" component={AvailableOrdersScreen} options={{ title: 'Orders' }} />
      <DriverTab.Screen name="DriverEarningsTab" component={EarningsScreen} options={{ title: 'Earnings' }} />
      <DriverTab.Screen name="DriverProfileTab" component={DriverProfileScreen} options={{ title: 'Profile' }} />
    </DriverTab.Navigator>
  );
}

// ── Root Stack (contains everything) ──────────────────────────────────────────
function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AppPicker">
      {/* ── App Picker ───────────────────────────── */}
      <RootStack.Screen name="AppPicker" component={AppPickerScreen} />

      {/* ── Customer Auth ────────────────────────── */}
      <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="SignUp" component={SignUpScreen} />
      <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* ── Customer Main Tabs ───────────────────── */}
      <RootStack.Screen name="MainTabs" component={CustomerTabNavigator} />

      {/* ── Customer Order Flow ──────────────────── */}
      <RootStack.Screen name="FuelSelection" component={FuelSelectionScreen} />
      <RootStack.Screen name="DeliveryLocation" component={DeliveryLocationScreen} />
      <RootStack.Screen name="AddAddress" component={AddAddressScreen} />
      <RootStack.Screen name="DeliveryTime" component={DeliveryTimeScreen} />
      <RootStack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <RootStack.Screen name="AddCard" component={AddCardScreen} />
      <RootStack.Screen name="OrderReview" component={OrderReviewScreen} />
      <RootStack.Screen name="OrderPlaced" component={OrderPlacedScreen} />
      <RootStack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <RootStack.Screen name="DeliveryPin" component={DeliveryPinScreen} />
      <RootStack.Screen name="RateReview" component={RateReviewScreen} />
      <RootStack.Screen name="DigitalReceipt" component={DigitalReceiptScreen} />

      {/* ── Customer Utility ─────────────────────── */}
      <RootStack.Screen name="Notifications" component={NotificationsScreen} />

      {/* ── Driver Auth ──────────────────────────── */}
      <RootStack.Screen name="DriverLogin" component={DriverLoginScreen} />

      {/* ── Driver Main Tabs ─────────────────────── */}
      <RootStack.Screen name="DriverTabs" component={DriverTabNavigator} />

      {/* ── Driver Order Flow ────────────────────── */}
      <RootStack.Screen name="DriverOrderDetails" component={OrderDetailsScreen} />
      <RootStack.Screen name="ActiveNavigation" component={ActiveNavigationScreen} />
      <RootStack.Screen name="DriverStatusUpdate" component={StatusUpdateScreen} />
      <RootStack.Screen name="ProofOfDelivery" component={ProofOfDeliveryScreen} />
      <RootStack.Screen name="DeliveryComplete" component={DeliveryCompleteScreen} />

      {/* ── Driver Utility ───────────────────────── */}
      <RootStack.Screen name="DriverEarnings" component={EarningsScreen} />
      <RootStack.Screen name="SOS" component={SOSScreen} />
    </RootStack.Navigator>
  );
}

function AppContent() {
  return (
    <View style={styles.appContainer}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <DesignModeProvider>
        <AppContent />
      </DesignModeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1 },
});
