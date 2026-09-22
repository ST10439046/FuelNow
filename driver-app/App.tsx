import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Feather } from '@expo/vector-icons';

import {
  DesignModeProvider,
  useDesignMode,
} from './src/context/DesignModeContext';
import { Fonts } from './src/theme/tokens';
import { userRepository } from './src/repositories/UserRepository';
import { supabase } from './src/services/supabase';

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

const RootStack = createStackNavigator();
const DriverTab = createBottomTabNavigator();

function DriverTabNavigator() {
  const {
    colors,
    isWireframe,
  } = useDesignMode();

  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,

        tabBarStyle: {
          backgroundColor: isWireframe
            ? '#FFFFFF'
            : colors.white,
          borderTopColor: isWireframe
            ? '#CCCCCC'
            : colors.divider,
          borderTopWidth: 1,
          paddingBottom:
            Platform.OS === 'ios'
              ? 20
              : 8,
          paddingTop: 8,
          height:
            Platform.OS === 'ios'
              ? 84
              : 64,
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
          fontFamily: isWireframe
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
            DriverOrdersTab: 'truck',
            DriverEarningsTab:
              'trending-up',
            DriverProfileTab: 'user',
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
        component={AvailableOrdersScreen}
        options={{
          title: 'Jobs',
        }}
      />

      <DriverTab.Screen
        name="DriverEarningsTab"
        component={EarningsScreen}
        options={{
          title: 'Earnings',
        }}
      />

      <DriverTab.Screen
        name="DriverProfileTab"
        component={DriverProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </DriverTab.Navigator>
  );
}

function DriverNavigator({
  authenticated,
}: {
  authenticated: boolean;
}) {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={
        authenticated
          ? 'DriverTabs'
          : 'DriverLogin'
      }
    >
      <RootStack.Screen
        name="DriverLogin"
        component={DriverLoginScreen}
      />

      <RootStack.Screen
        name="DriverTabs"
        component={DriverTabNavigator}
      />

      <RootStack.Screen
        name="DriverOrderDetails"
        component={OrderDetailsScreen}
      />

      <RootStack.Screen
        name="ActiveNavigation"
        component={ActiveNavigationScreen}
      />

      <RootStack.Screen
        name="DriverStatusUpdate"
        component={StatusUpdateScreen}
      />

      <RootStack.Screen
        name="ProofOfDelivery"
        component={ProofOfDeliveryScreen}
      />

      <RootStack.Screen
        name="DeliveryComplete"
        component={DeliveryCompleteScreen}
      />

      <RootStack.Screen
        name="DriverEarnings"
        component={EarningsScreen}
      />

      <RootStack.Screen
        name="SOS"
        component={SOSScreen}
      />
    </RootStack.Navigator>
  );
}

function AppContent() {
  const [sessionChecked, setSessionChecked] =
    useState(false);

  const [
    authenticated,
    setAuthenticated,
  ] = useState(false);

  const {
    colors,
  } = useDesignMode();

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        try {
          const driver =
            await userRepository
              .restoreDriverSession();

          if (!mounted) {
            return;
          }

          setAuthenticated(
            driver !== null
          );
        } catch (error) {
          if (!mounted) {
            return;
          }

          setAuthenticated(false);

          console.error(
            'Driver session restore failed:',
            error
          );
        } finally {
          if (mounted) {
            setSessionChecked(true);
          }
        }
      };

    restoreSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (!mounted) {
            return;
          }

          if (!session) {
            setAuthenticated(false);
            return;
          }

          try {
            const driver =
              await userRepository
                .getDriverAuthProfile();

            if (mounted) {
              setAuthenticated(
                driver !== null
              );
            }
          } catch (error) {
            console.error(
              'Authenticated account is not a driver:',
              error
            );

            await supabase.auth.signOut();

            if (mounted) {
              setAuthenticated(false);
            }
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!sessionChecked) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            backgroundColor:
              colors.warmAsh,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.petrolDeep}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <DriverNavigator
        authenticated={authenticated}
      />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] =
    useFonts({
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
          style={styles.appContainer}
        >
          <AppContent />

          <StatusBar style="auto" />
        </View>
      </DesignModeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});