import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from
  'react-native-safe-area-context';

import { supabase } from
  '../../services/supabase';

interface Props {
  navigation: any;
  route: any;
}

export default function PaymentResultScreen({
  navigation,
  route,
}: Props) {
  const orderId =
    route?.params?.orderId;

  const [status, setStatus] =
    useState(
      route?.params?.status ??
      'checking'
    );

  useEffect(() => {
    if (!orderId) {
      setStatus('failed');
      return;
    }

    let cancelled = false;

    const checkPayment = async () => {
      for (
        let attempt = 0;
        attempt < 10;
        attempt++
      ) {
        const {
          data,
          error,
        } = await supabase
          .from('orders')
          .select(
            'order_id,status'
          )
          .eq(
            'order_id',
            orderId
          )
          .single();

        if (
          !error &&
          data?.status === 'PAID'
        ) {
          if (!cancelled) {
            setStatus('paid');
          }

          return;
        }

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1500
            )
        );
      }

      if (!cancelled) {
        setStatus('pending');
      }
    };

    checkPayment();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (
      status === 'paid'
    ) {
      const timer =
        setTimeout(() => {
          navigation.replace(
            'OrderPlaced',
            {
              orderId,
            }
          );
        }, 1500);

      return () =>
        clearTimeout(timer);
    }
  }, [
    status,
    orderId,
    navigation,
  ]);

  if (
    status === 'checking'
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.title}>
          Confirming payment...
        </Text>

        <Text style={styles.subtitle}>
          We're waiting for PayFast to
          confirm your payment.
        </Text>
      </SafeAreaView>
    );
  }

  if (
    status === 'paid'
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View style={styles.icon}>
          <Text style={styles.iconText}>
            ✓
          </Text>
        </View>

        <Text style={styles.title}>
          Payment successful
        </Text>

        <Text style={styles.subtitle}>
          Your FuelNow order has been
          confirmed.
        </Text>
      </SafeAreaView>
    );
  }

  if (
    status === 'pending'
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <Text style={styles.title}>
          Payment is processing
        </Text>

        <Text style={styles.subtitle}>
          PayFast has not confirmed the
          payment yet. Your order will
          update automatically once the
          payment notification arrives.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <Text style={styles.title}>
        Payment cancelled
      </Text>

      <Text style={styles.subtitle}>
        No payment was completed.
      </Text>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },

    icon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DDF5E5',
      marginBottom: 20,
    },

    iconText: {
      fontSize: 36,
      color: '#198754',
      fontWeight: '700',
    },

    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 10,
      textAlign: 'center',
    },

    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      lineHeight: 24,
    },
  });