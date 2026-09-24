
import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";

import {
  DesignModeProvider,
  useDesignMode,
} from "./src/context/DesignModeContext";
import { Fonts } from "./src/theme/tokens";
import { pushNotificationService } from "./src/services/PushNotificationService";

// Screens
import OnboardingScreen from "./src/screens/onboarding/OnboardingScreen";

// Fix root height on web so ScrollViews can work
if (Platform.OS === "web") {
  const style = document.createElement("style");
  style.textContent = `
    html, body, #root {
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex: 1;
    }
  `;
  document.head.appendChild(style);
}

import LoginScreen from "./src/screens/auth/LoginScreen";
import SignUpScreen from "./src/screens/auth/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import FuelSelectionScreen from "./src/screens/order/FuelSelectionScreen";
import DeliveryLocationScreen from "./src/screens/order/DeliveryLocationScreen";
import AddAddressScreen from "./src/screens/order/AddAddressScreen";
import DeliveryTimeScreen from "./src/screens/order/DeliveryTimeScreen";
import PaymentMethodScreen from "./src/screens/order/PaymentMethodScreen";
import AddCardScreen from "./src/screens/order/AddCardScreen";
import OrderReviewScreen from "./src/screens/order/OrderReviewScreen";
import OrderPlacedScreen from "./src/screens/order/OrderPlacedScreen";
import LiveTrackingScreen from "./src/screens/order/LiveTrackingScreen";
import DeliveryPinScreen from "./src/screens/order/DeliveryPinScreen";
import RateReviewScreen from "./src/screens/order/RateReviewScreen";
import DigitalReceiptScreen from "./src/screens/order/DigitalReceiptScreen";
import OrderHistoryScreen from "./src/screens/history/OrderHistoryScreen";
import RewardsScreen from "./src/screens/rewards/RewardsScreen";
import NotificationsScreen from "./src/screens/notifications/NotificationsScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import TermsOfUseScreen from "./src/screens/profile/TermsOfUseScreen";
import PrivacyPolicyScreen from "./src/screens/profile/PrivacyPolicyScreen";
import PersonalInformationScreen from "./src/screens/profile/PersonalInformationScreen";
import ChangePasswordScreen from "./src/screens/profile/ChangePasswordScreen";
import OrderDetailsScreen from "./src/screens/history/OrderDetailsScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import PayFastCheckoutScreen from "@/screens/order/PayFastCheckoutScreen";
import PaymentResultScreen from "@/screens/order/PaymentResultScreen";

const RootStack = createStackNavigator();
const CustomerTab = createBottomTabNavigator();

function CustomerTabNavigator() {
  const { colors, isWireframe } = useDesignMode();
  const insets = useSafeAreaInsets();

  return (
    <CustomerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isWireframe ? "#FFFFFF" : colors.white,
          borderTopColor: isWireframe ? "#CCCCCC" : colors.divider,
          borderTopWidth: 1,

          paddingTop: 8,
          paddingBottom: insets.bottom + 4,

          height: 60 + insets.bottom,
        },
        tabBarActiveTintColor: isWireframe
          ? "#333333"
          : colors.petrolDeep,
        tabBarInactiveTintColor: isWireframe
          ? "#AAAAAA"
          : colors.inkFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: isWireframe
            ? undefined
            : Fonts.bodyMedium,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            HomeTab: "home",
            OrdersTab: "package",
            RewardsTab: "award",
            ProfileTab: "user",
          };

          return (
            <Feather
              name={icons[route.name] as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <CustomerTab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: "Home" }}
      />

      <CustomerTab.Screen
        name="OrdersTab"
        component={OrderHistoryScreen}
        options={{ title: "Orders" }}
      />

      <CustomerTab.Screen
        name="RewardsTab"
        component={RewardsScreen}
        options={{ title: "Rewards" }}
      />

      <CustomerTab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </CustomerTab.Navigator>
  );
}

function CustomerNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Onboarding"
    >
      {/* Auth */}
      <RootStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
      />

      <RootStack.Screen
        name="Login"
        component={LoginScreen}
      />

      <RootStack.Screen
        name="SignUp"
        component={SignUpScreen}
      />

      <RootStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />

      <RootStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
      />

      {/* Main Tabs */}
      <RootStack.Screen
        name="MainTabs"
        component={CustomerTabNavigator}
      />

      {/* Order Flow */}
      <RootStack.Screen
        name="FuelSelection"
        component={FuelSelectionScreen}
      />

      <RootStack.Screen
        name="DeliveryLocation"
        component={DeliveryLocationScreen}
      />

      <RootStack.Screen
        name="AddAddress"
        component={AddAddressScreen}
      />

      <RootStack.Screen
        name="DeliveryTime"
        component={DeliveryTimeScreen}
      />

      <RootStack.Screen
        name="PaymentMethod"
        component={PaymentMethodScreen}
      />

      <RootStack.Screen
        name="AddCard"
        component={AddCardScreen}
      />

      <RootStack.Screen
        name="OrderReview"
        component={OrderReviewScreen}
      />

      <RootStack.Screen
        name="OrderPlaced"
        component={OrderPlacedScreen}
      />

      <RootStack.Screen
        name="LiveTracking"
        component={LiveTrackingScreen}
      />

      <RootStack.Screen
        name="DeliveryPin"
        component={DeliveryPinScreen}
      />

      <RootStack.Screen
        name="RateReview"
        component={RateReviewScreen}
      />

      <RootStack.Screen
        name="DigitalReceipt"
        component={DigitalReceiptScreen}
      />

      <RootStack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
      />

      <RootStack.Screen
        name="PayFastCheckout"
        component={PayFastCheckoutScreen}
        options={{
          headerShown: false,
        }}
      />

      <RootStack.Screen
        name="PaymentResult"
        component={PaymentResultScreen}
      />

      {/* Utilities */}
      <RootStack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      <RootStack.Screen
        name="TermsOfUse"
        component={TermsOfUseScreen}
      />

      <RootStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
      />

      {/* Security */}
      <RootStack.Screen
        name="PersonalInformation"
        component={PersonalInformationScreen}
        options={{
          headerShown: false,
        }}
      />

      <RootStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
        }}
      />
    </RootStack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") {
      return;
    }

    const unsubscribeMessage =
      pushNotificationService.addMessageListener(
        async (remoteMessage) => {
          console.log(
            "FuelNow FCM message received:",
            remoteMessage
          );

          console.log(
            "FuelNow notification:",
            remoteMessage.notification
          );

          console.log(
            "FuelNow notification data:",
            remoteMessage.data
          );
        }
      );

    const unsubscribeTokenRefresh =
      pushNotificationService.addTokenRefreshListener(
        async (token) => {
          console.log(
            "FuelNow FCM token refreshed:",
            token
          );

          try {
            await pushNotificationService.refreshToken();
          } catch (error) {
            console.error(
              "FuelNow: failed to save refreshed FCM token:",
              error
            );
          }
        }
      );

    const unsubscribeOpened =
      pushNotificationService.onNotificationOpenedApp(
        (remoteMessage) => {
          console.log(
            "FuelNow notification opened:",
            remoteMessage
          );
        }
      );

    pushNotificationService
      .getInitialNotification()
      .then((remoteMessage) => {
        if (!remoteMessage) {
          return;
        }

        console.log(
          "FuelNow notification opened from terminated state:",
          remoteMessage
        );
      })
      .catch((error) => {
        console.error(
          "FuelNow: failed to check initial notification:",
          error
        );
      });

    return () => {
      unsubscribeMessage();
      unsubscribeTokenRefresh();
      unsubscribeOpened();
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <DesignModeProvider>
        <View style={styles.appContainer}>
          <NavigationContainer>
            <CustomerNavigator />
          </NavigationContainer>

          <StatusBar style="auto" />
        </View>
      </DesignModeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    minHeight: 0,

    ...(Platform.OS === "web"
      ? {
          overflow: "hidden" as const,
        }
      : {}),
  },
});

