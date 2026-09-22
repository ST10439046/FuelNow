import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Feather,
} from '@expo/vector-icons';

import {
  useDesignMode,
} from '../../context/DesignModeContext';

import {
  FontSizes,
  Radius,
  Spacing,
} from '../../theme/tokens';

interface Props {
  navigation: any;
  route: any;
}

export default function DeliveryPinScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const order =
    route?.params?.order;

  const deliveryPin =
    String(
      route?.params?.deliveryPin ??
      ''
    );

  const orderNumber =
    order?.orderId
      ? order.orderId
          .slice(0, 8)
          .toUpperCase()
      : 'UNKNOWN';

  const goToAcceptedOrders =
    () => {
      navigation.popToTop();

      navigation.navigate(
        'DriverTabs',
        {
          screen:
            'DriverAcceptedOrdersTab',
        }
      );
    };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            isWireframe
              ? '#F0F0F0'
              : colors.warmAsh,
        },
      ]}
      edges={[
        'top',
        'bottom',
      ]}
    >
      <View
        style={styles.content}
      >
        <View
          style={[
            styles.successCircle,
            {
              backgroundColor:
                isWireframe
                  ? '#666666'
                  : colors.dieselGreen,
            },
          ]}
        >
          <Feather
            name="check"
            size={42}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={[
            styles.title,
            {
              color:
                isWireframe
                  ? '#111'
                  : colors.charcoalInk,
              fontFamily:
                font('displayBold'),
            },
          ]}
        >
          Delivery Complete
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color:
                isWireframe
                  ? '#666'
                  : colors.inkLight,
              fontFamily:
                font('body'),
            },
          ]}
        >
          Order #{orderNumber} has been
          marked as completed.
        </Text>

        <View
          style={[
            styles.pinCard,
            {
              backgroundColor:
                isWireframe
                  ? '#FFFFFF'
                  : colors.white,
              borderColor:
                isWireframe
                  ? '#CCCCCC'
                  : colors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.pinIcon,
              {
                backgroundColor:
                  isWireframe
                    ? '#E0E0E0'
                    : colors.petrolLight,
              },
            ]}
          >
            <Feather
              name="key"
              size={24}
              color={
                isWireframe
                  ? '#555'
                  : colors.petrolDeep
              }
            />
          </View>

          <Text
            style={[
              styles.pinLabel,
              {
                color:
                  isWireframe
                    ? '#777'
                    : colors.inkLight,
                fontFamily:
                  font('bodyMedium'),
              },
            ]}
          >
            DELIVERY PIN
          </Text>

          <Text
            style={[
              styles.pin,
              {
                color:
                  isWireframe
                    ? '#111'
                    : colors.charcoalInk,
                fontFamily:
                  font('displayBold'),
              },
            ]}
          >
            {deliveryPin || '----'}
          </Text>

          <Text
            style={[
              styles.pinInstruction,
              {
                color:
                  isWireframe
                    ? '#666'
                    : colors.inkLight,
                fontFamily:
                  font('body'),
              },
            ]}
          >
            Show this PIN to the customer
            if they need to confirm the
            completed delivery.
          </Text>
        </View>

        <View
          style={[
            styles.notice,
            {
              backgroundColor:
                isWireframe
                  ? '#E8E8E8'
                  : colors.petrolFaint,
            },
          ]}
        >
          <Feather
            name="shield"
            size={18}
            color={
              isWireframe
                ? '#555'
                : colors.petrolDeep
            }
          />

          <Text
            style={[
              styles.noticeText,
              {
                color:
                  isWireframe
                    ? '#555'
                    : colors.inkLight,
                fontFamily:
                  font('body'),
              },
            ]}
          >
            Keep the delivery PIN private
            and only show it to the customer
            when required.
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              isWireframe
                ? '#FFFFFF'
                : colors.white,
            borderTopColor:
              isWireframe
                ? '#CCCCCC'
                : colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor:
                isWireframe
                  ? '#444'
                  : colors.petrolDeep,
            },
          ]}
          onPress={
            goToAcceptedOrders
          }
          activeOpacity={0.85}
        >
          <Feather
            name="truck"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={[
              styles.buttonText,
              {
                fontFamily:
                  font('bodyBold'),
              },
            ]}
          >
            Back to My Orders
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  successCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  pinCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },

  pinIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  pinLabel: {
    fontSize: FontSizes.xs,
    letterSpacing: 1.5,
  },

  pin: {
    fontSize: FontSizes['3xl'],
    letterSpacing: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  pinInstruction: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },

  notice: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },

  noticeText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
  },

  button: {
    minHeight: 54,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },
});