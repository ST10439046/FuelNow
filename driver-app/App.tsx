
import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createStackNavigator,
} from '@react-navigation/stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import {
  Feather,
} from '@expo/vector-icons';

import {
  DesignModeProvider,
  useDesignMode,
} from './src/context/DesignModeContext';

import {
  Fonts,
} from './src/theme/tokens';

import DriverLoginScreen from './src/screens/driver/DriverLoginScreen';
import AvailableOrdersScreen from './src/screens/driver/AvailableOrdersScreen';
import AcceptedOrdersScreen from './src/screens/driver/AcceptedOrdersScreen';
import AcceptedOrderDetailsScreen from './src/screens/driver/AcceptedOrderDetailsScreen';
import DeliveryPinScreen from './src/screens/driver/DeliveryPinScreen';

import OrderDetailsScreen from './src/screens/driver/OrderDetailsScreen';
import ActiveNavigationScreen from './src/screens/driver/ActiveNavigationScreen';
import StatusUpdateScreen from './src/screens/driver/StatusUpdateScreen';
import ProofOfDeliveryScreen from './src/screens/driver/ProofOfDeliveryScreen';
import DeliveryCompleteScreen from './src/screens/driver/DeliveryCompleteScreen';
import EarningsScreen from './src/screens/driver/EarningsScreen';
import SOSScreen from './src/screens/driver/SOSScreen';
import DriverProfileScreen from './src/screens/driver/DriverProfileScreen';

import {
  userRepository,
  DriverAuthProfile,
} from './src/repositories/UserRepository';

import {
  supabase,
} from './src/services/supabase';

import {
  driverLocationService,
} from './src/services/DriverLocationService';

const RootStack =
  createStackNavigator();

const DriverTab =
  createBottomTabNavigator();

function DriverTabNavigator() {
  const {
    colors,
    isWireframe,
  } = useDesignMode();

  const insets =
    useSafeAreaInsets();

  const bottomInset =
    Math.max(
      insets.bottom,
      Platform.OS === 'android'
        ? 0
        : insets.bottom
    );

  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarShowLabel: true,

        tabBarStyle: {
          backgroundColor:
            isWireframe
              ? '#FFFFFF'
              : colors.white,

          borderTopColor:
            isWireframe
              ? '#CCCCCC'
              : colors.divider,

          borderTopWidth: 1,

          paddingTop: 8,

          paddingBottom:
            8 + bottomInset,

          height:
            64 + bottomInset,
        },

        tabBarActiveTintColor:
          isWireframe
            ? '#333333'
            : colors.petrolDeep,

        tabBarInactiveTintColor:
          isWireframe
            ? '#AAAAAA'
            : colors.inkFaint,

        tabBarLabelStyle: {
          fontSize: 11,

          fontFamily:
            isWireframe
              ? undefined
              : Fonts.bodyMedium,
        },

        tabBarIcon: ({
          color,
          size,
        }) => {
          const icons: Record<
            string,
            string
          > = {
            DriverOrdersTab:
              'truck',

            DriverAcceptedOrdersTab:
              'check-circle',

            DriverEarningsTab:
              'trending-up',

            DriverProfileTab:
              'user',
          };

          return (
            <Feather
              name={
                icons[
                  route.name
                ] as any
              }
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <DriverTab.Screen
        name="DriverOrdersTab"
        component={
          AvailableOrdersScreen
        }
        options={{
          title: 'Jobs',
        }}
      />

      <DriverTab.Screen
        name="DriverAcceptedOrdersTab"
        component={
          AcceptedOrdersScreen
        }
        options={{
          title: 'Accepted',
        }}
      />

      <DriverTab.Screen
        name="DriverEarningsTab"
        component={
          EarningsScreen
        }
        options={{
          title: 'Earnings',
        }}
      />

      <DriverTab.Screen
        name="DriverProfileTab"
        component={
          DriverProfileScreen
        }
        options={{
          title: 'Profile',
        }}
      />
    </DriverTab.Navigator>
  );
}

function DriverNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="DriverLogin"
    >
      <RootStack.Screen
        name="DriverLogin"
        component={
          DriverLoginScreen
        }
      />

      <RootStack.Screen
        name="DriverTabs"
        component={
          DriverTabNavigator
        }
      />

      <RootStack.Screen
        name="DriverOrderDetails"
        component={
          OrderDetailsScreen
        }
      />

      <RootStack.Screen
        name="AcceptedOrderDetails"
        component={
          AcceptedOrderDetailsScreen
        }
      />

      <RootStack.Screen
        name="DeliveryPin"
        component={
          DeliveryPinScreen
        }
      />

      <RootStack.Screen
        name="ActiveNavigation"
        component={
          ActiveNavigationScreen
        }
      />

      <RootStack.Screen
        name="DriverStatusUpdate"
        component={
          StatusUpdateScreen
        }
      />

      <RootStack.Screen
        name="ProofOfDelivery"
        component={
          ProofOfDeliveryScreen
        }
      />

      <RootStack.Screen
        name="DeliveryComplete"
        component={
          DeliveryCompleteScreen
        }
      />

      <RootStack.Screen
        name="DriverEarnings"
        component={
          EarningsScreen
        }
      />

      <RootStack.Screen
        name="SOS"
        component={
          SOSScreen
        }
      />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const [
    sessionReady,
    setSessionReady,
  ] = useState(false);

  const [
    authenticatedDriver,
    setAuthenticatedDriver,
  ] =
    useState<DriverAuthProfile | null>(
      null
    );

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        try {
          const driver =
            await userRepository.restoreDriverSession();

          if (mounted) {
            setAuthenticatedDriver(
              driver
            );
          }
        } catch (error) {
          console.error(
            'Driver session restore failed:',
            error
          );

          if (mounted) {
            setAuthenticatedDriver(
              null
            );
          }
        } finally {
          if (mounted) {
            setSessionReady(
              true
            );
          }
        }
      };

    restoreSession();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session
        ) => {
          if (!mounted) {
            return;
          }

          if (
            event ===
            'SIGNED_OUT'
          ) {
            setAuthenticatedDriver(
              null
            );

            return;
          }

          if (
            !session?.user
          ) {
            setAuthenticatedDriver(
              null
            );

            return;
          }

          try {
            const driver =
              await userRepository.getDriverAuthProfile();

            if (mounted) {
              setAuthenticatedDriver(
                driver
              );
            }
          } catch (error) {
            console.error(
              'Authenticated account is not a driver:',
              error
            );

            if (mounted) {
              setAuthenticatedDriver(
                null
              );
            }
          }
        }
      );

    return () => {
      mounted = false;

      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    let mounted = true;

    const syncLocationTracking = async () => {
      if (!authenticatedDriver) {
        await driverLocationService.stopTracking();
        return;
      }
    
      try {
        console.log(
          'App: authenticated driver detected. Updating GPS immediately.'
        );
    
        const currentLocationUpdated =
          await driverLocationService.updateCurrentLocation();
    
        console.log(
          'App: initial GPS update result:',
          currentLocationUpdated
        );
    
        const started =
          await driverLocationService.startTracking();
    
        if (!started && mounted) {
          console.error(
            'DriverLocationService: GPS tracking could not be started.'
          );
        }
      } catch (error) {
        if (mounted) {
          console.error(
            'DriverLocationService: failed to start GPS tracking:',
            error
          );
        }
      }
    };

    syncLocationTracking();

    return () => {
      mounted = false;
    };
  }, [
    sessionReady,
    authenticatedDriver,
  ]);

  if (!sessionReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <DriverNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [
    fontsLoaded,
  ] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <DesignModeProvider>
        <View
          style={
            styles.appContainer
          }
        >
          <AppContent />

          <StatusBar
            style="auto"
          />
        </View>
      </DesignModeProvider>
    </SafeAreaProvider>
  );
}

const styles =
  StyleSheet.create({
    appContainer: {
      flex: 1,
    },
  });

