// ─────────────────────────────────────────────────────────────────────────────
// OrderDetailsScreen.tsx — Driver taps an order to view + accept/decline
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import {
  FontSizes,
  Spacing,
  Radius,
  Shadow,
} from '../../theme/tokens';
import { AvailableOrder } from './AvailableOrdersScreen';
import { driverRepository } from '../../repositories/DriverRepository';

interface Props {
  readonly navigation: any;
  readonly route: any;
}

interface DestinationMapProps {
  readonly suburb: string;
  readonly isDiesel: boolean;
  readonly isWireframe: boolean;
}

interface DividerProps {
  readonly colors: any;
  readonly isWireframe: boolean;
}

interface InfoRowProps {
  readonly icon: string;
  readonly label: string;
  readonly value: string;
  readonly bold?: boolean;
  readonly accent?: boolean;
  readonly colors: any;
  readonly font: any;
  readonly isWireframe: boolean;
}

function DestinationMap({
  suburb,
  isDiesel,
  isWireframe,
}: DestinationMapProps) {
  let pinColor = '#F97316';

  if (isWireframe) {
    pinColor = '#888';
  } else if (isDiesel) {
    pinColor = '#2563EB';
  }

  if (isWireframe) {
    return (
      <View
        style={[
          styles.map,
          {
            backgroundColor: '#D8D8D8',
            borderWidth: 1.5,
            borderColor: '#BBBBBB',
          },
        ]}
      >
        <Text
          style={{
            color: '#888',
            textAlign: 'center',
            marginTop: 80,
            fontSize: 13,
          }}
        >
          [ Destination Map - {suburb} ]
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.map,
        {
          backgroundColor: '#F5F5F0',
          overflow: 'hidden',
        },
      ]}
    >
      <View
        style={[
          styles.road,
          {
            top: 60,
            left: 0,
            right: 0,
            height: 10,
          },
        ]}
      />

      <View
        style={[
          styles.road,
          {
            top: 120,
            left: 0,
            right: 0,
            height: 10,
          },
        ]}
      />

      <View
        style={[
          styles.roadV,
          {
            top: 0,
            left: 120,
            bottom: 0,
            width: 10,
          },
        ]}
      />

      <View
        style={[
          styles.roadV,
          {
            top: 0,
            left: 255,
            bottom: 0,
            width: 10,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 15,
            left: 15,
            width: 90,
            height: 30,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 15,
            left: 145,
            width: 95,
            height: 30,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 15,
            left: 280,
            width: 85,
            height: 30,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 80,
            left: 15,
            width: 90,
            height: 25,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 80,
            left: 145,
            width: 95,
            height: 25,
          },
        ]}
      />

      <View
        style={[
          styles.park,
          {
            top: 80,
            left: 280,
            width: 85,
            height: 25,
          },
        ]}
      />

      <View
        style={[
          styles.block,
          {
            top: 140,
            left: 15,
            width: 90,
            height: 45,
          },
        ]}
      />

      <View
        style={[
          styles.park,
          {
            top: 140,
            left: 145,
            width: 95,
            height: 45,
          },
        ]}
      />

      <View
        style={[
          styles.water,
          {
            bottom: -10,
            right: -10,
            width: 100,
            height: 75,
            borderRadius: 50,
          },
        ]}
      />

      <View
        style={[
          styles.destPin,
          {
            backgroundColor: pinColor,
            top: 65,
            left: 260,
          },
        ]}
      >
        <Feather
          name="map-pin"
          size={14}
          color="#FFF"
        />
      </View>

      <View
        style={[
          styles.suburbLabel,
          {
            left: 15,
            bottom: 15,
          },
        ]}
      >
        <Text
          style={{
            color: '#4B5563',
            fontSize: 11,
            fontWeight: '600',
          }}
        >
          {suburb}
        </Text>
      </View>
    </View>
  );
}

function Divider({
  colors,
  isWireframe,
}: DividerProps) {
  const backgroundColor = isWireframe
    ? '#DDDDDD'
    : colors.divider;

  return (
    <View
      style={{
        height: 1,
        backgroundColor,
        marginVertical: Spacing.md,
      }}
    />
  );
}

function InfoRow({
  icon,
  label,
  value,
  bold,
  accent,
  colors,
  font,
  isWireframe,
}: InfoRowProps) {
  let valueColor: string;

  if (accent) {
    valueColor = isWireframe
      ? '#1A1A1A'
      : colors.petrolDeep;
  } else {
    valueColor = isWireframe
      ? '#1A1A1A'
      : colors.charcoalInk;
  }

  const valueFont = bold
    ? font('displayBold')
    : font('bodyMedium');

  const valueFontSize = bold
    ? FontSizes.md
    : FontSizes.sm;

  return (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor: isWireframe
              ? '#E8E8E8'
              : colors.warmAsh,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={14}
          color={
            isWireframe
              ? '#666'
              : colors.inkLight
          }
        />
      </View>

      <Text
        style={[
          styles.infoLabel,
          {
            color: isWireframe
              ? '#666'
              : colors.inkLight,
            fontFamily: font('body'),
            fontSize: FontSizes.sm,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          {
            color: valueColor,
            fontFamily: valueFont,
            fontSize: valueFontSize,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function getCustomerInitials(
  customerName: string
): string {
  const name = customerName.trim();

  if (!name) {
    return 'C';
  }

  const parts = name
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function getSuburbFromAddress(
  address: string
): string {
  const parts = address
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return 'Destination';
}

function getDistanceDisplay(
  order: AvailableOrder
): string | null {
  if (!order.distance) {
    return null;
  }

  if (
    order.distance === 'Distance unavailable' ||
    order.distance === 'Location available'
  ) {
    return order.distance;
  }

  return order.distance;
}

export default function OrderDetailsScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const order =
    route?.params?.order as
      | AvailableOrder
      | undefined;

  const [accepting, setAccepting] =
    useState(false);

  if (!order) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWireframe
              ? '#F0F0F0'
              : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.missingOrder}>
          <Text
            style={{
              color: isWireframe
                ? '#1A1A1A'
                : colors.charcoalInk,
              fontFamily: font('bodyMedium'),
              fontSize: FontSizes.base,
            }}
          >
            Order information is unavailable.
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backToOrdersButton,
              {
                backgroundColor: isWireframe
                  ? '#888'
                  : colors.petrolDeep,
              },
            ]}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: font('bodySemiBold'),
                fontSize: FontSizes.sm,
              }}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isDiesel =
    order.fuelType.startsWith('Diesel');

  const suburb = getSuburbFromAddress(
    order.address
  );

  const customerInitials =
    getCustomerInitials(
      order.customerName
    );

  const distanceDisplay =
    getDistanceDisplay(order);

  const fmt = (n: number) =>
    'R ' +
    n.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const handleAccept = async () => {
    if (accepting) {
      return;
    }

    setAccepting(true);

    try {
      await driverRepository.acceptOrder(
        order.orderId
      );

      navigation.navigate(
        'ActiveNavigation',
        {
          order: {
            ...order,
            status: 'ACCEPTED',
          },
        }
      );
    } catch (error: any) {
      console.error(
        'OrderDetailsScreen: failed to accept order',
        error
      );

      Alert.alert(
        'Unable to Accept Order',
        error?.message ??
          'The order could not be accepted. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWireframe
            ? '#F0F0F0'
            : colors.warmAsh,
        },
      ]}
      edges={['top', 'bottom']}
    >
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: isWireframe
              ? '#FFFFFF'
              : colors.white,
            borderBottomWidth:
              isWireframe ? 1.5 : 1,
            borderBottomColor:
              isWireframe
                ? '#CCCCCC'
                : colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={
              isWireframe
                ? '#333'
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: isWireframe
                ? '#1A1A1A'
                : colors.charcoalInk,
              fontFamily: font('displayBold'),
              fontSize: FontSizes.md,
            }}
            numberOfLines={1}
          >
            Order #
            {order.orderId
              .slice(0, 8)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={[
            styles.newBadge,
            {
              backgroundColor: isWireframe
                ? '#D0D0D0'
                : colors.petrolLight,
            },
          ]}
        >
          <Text
            style={{
              color: isWireframe
                ? '#555'
                : colors.petrolDeep,
              fontFamily: font('bodySemiBold'),
              fontSize: FontSizes.xs,
            }}
          >
            New Order
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <DestinationMap
          suburb={suburb}
          isDiesel={isDiesel}
          isWireframe={isWireframe}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isWireframe
                ? '#FFFFFF'
                : colors.white,
              borderRadius: isWireframe
                ? Radius.sm
                : Radius.lg,
              borderWidth:
                isWireframe ? 1.5 : 0,
              borderColor: '#CCCCCC',
              ...(isWireframe
                ? {}
                : Shadow.md),
            },
          ]}
        >
          <View style={styles.customerRow}>
            <View
              style={[
                styles.initialsCircle,
                {
                  backgroundColor:
                    isWireframe
                      ? '#D0D0D0'
                      : colors.petrolLight,
                },
              ]}
            >
              <Text
                style={{
                  color: isWireframe
                    ? '#555'
                    : colors.petrolDeep,
                  fontFamily: font('displayBold'),
                  fontSize: FontSizes.sm,
                }}
              >
                {customerInitials}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: isWireframe
                    ? '#666'
                    : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.xs,
                }}
              >
                Customer
              </Text>

              <Text
                style={{
                  color: isWireframe
                    ? '#1A1A1A'
                    : colors.charcoalInk,
                  fontFamily: font('bodyMedium'),
                  fontSize: FontSizes.base,
                }}
                numberOfLines={1}
              >
                {order.customerName}
              </Text>
            </View>
          </View>

          <Divider
            colors={colors}
            isWireframe={isWireframe}
          />

          <InfoRow
            icon="droplet"
            label="Fuel Type"
            value={order.fuelType}
            colors={colors}
            font={font}
            isWireframe={isWireframe}
          />

          <InfoRow
            icon="layers"
            label="Quantity"
            value={`${order.volumeLitres} litres`}
            colors={colors}
            font={font}
            isWireframe={isWireframe}
          />

          <InfoRow
            icon="map-pin"
            label="Address"
            value={order.address}
            colors={colors}
            font={font}
            isWireframe={isWireframe}
          />

          {distanceDisplay && (
            <InfoRow
              icon="navigation"
              label="Distance"
              value={distanceDisplay}
              colors={colors}
              font={font}
              isWireframe={isWireframe}
            />
          )}

          <Divider
            colors={colors}
            isWireframe={isWireframe}
          />

          <View style={styles.priceRow}>
            <Text
              style={{
                color: isWireframe
                  ? '#666'
                  : colors.inkLight,
                fontFamily: font('body'),
                fontSize: FontSizes.sm,
              }}
            >
              Fuel Subtotal
            </Text>

            <Text
              style={{
                color: isWireframe
                  ? '#1A1A1A'
                  : colors.charcoalInk,
                fontFamily: font('bodyMedium'),
                fontSize: FontSizes.sm,
              }}
            >
              {fmt(order.fuelSubtotal)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text
              style={{
                color: isWireframe
                  ? '#666'
                  : colors.inkLight,
                fontFamily: font('body'),
                fontSize: FontSizes.sm,
              }}
            >
              Delivery Fee
            </Text>

            <Text
              style={{
                color: isWireframe
                  ? '#1A1A1A'
                  : colors.charcoalInk,
                fontFamily: font('bodyMedium'),
                fontSize: FontSizes.sm,
              }}
            >
              {fmt(order.deliveryFee)}
            </Text>
          </View>

          {order.serviceFee > 0 && (
            <View style={styles.priceRow}>
              <Text
                style={{
                  color: isWireframe
                    ? '#666'
                    : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.sm,
                }}
              >
                Service Fee
              </Text>

              <Text
                style={{
                  color: isWireframe
                    ? '#1A1A1A'
                    : colors.charcoalInk,
                  fontFamily: font('bodyMedium'),
                  fontSize: FontSizes.sm,
                }}
              >
                {fmt(order.serviceFee)}
              </Text>
            </View>
          )}

          {order.vatAmount > 0 && (
            <View style={styles.priceRow}>
              <Text
                style={{
                  color: isWireframe
                    ? '#666'
                    : colors.inkLight,
                  fontFamily: font('body'),
                  fontSize: FontSizes.sm,
                }}
              >
                VAT
              </Text>

              <Text
                style={{
                  color: isWireframe
                    ? '#1A1A1A'
                    : colors.charcoalInk,
                  fontFamily: font('bodyMedium'),
                  fontSize: FontSizes.sm,
                }}
              >
                {fmt(order.vatAmount)}
              </Text>
            </View>
          )}

          <Divider
            colors={colors}
            isWireframe={isWireframe}
          />

          <View style={styles.priceRow}>
            <Text
              style={{
                color: isWireframe
                  ? '#1A1A1A'
                  : colors.charcoalInk,
                fontFamily: font('displayBold'),
                fontSize: FontSizes.base,
              }}
            >
              Total
            </Text>

            <Text
              style={{
                color: isWireframe
                  ? '#1A1A1A'
                  : colors.petrolDeep,
                fontFamily: font('displayBold'),
                fontSize: FontSizes.lg,
              }}
            >
              {fmt(order.totalAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: isWireframe
              ? '#FFFFFF'
              : colors.white,
            borderTopWidth:
              isWireframe ? 1.5 : 1,
            borderTopColor:
              isWireframe
                ? '#CCCCCC'
                : colors.divider,
            ...(isWireframe
              ? {}
              : Shadow.lg),
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={accepting}
          activeOpacity={0.82}
          style={[
            styles.declineBtn,
            {
              flex: 1,
              borderColor: isWireframe
                ? '#888'
                : colors.petrolDeep,
              borderRadius: isWireframe
                ? Radius.sm
                : Radius.md,
              opacity: accepting ? 0.5 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: isWireframe
                ? '#555'
                : colors.petrolDeep,
              fontFamily: font('bodySemiBold'),
              fontSize: FontSizes.base,
            }}
          >
            Decline
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAccept}
          disabled={accepting}
          activeOpacity={0.82}
          style={[
            styles.acceptBtn,
            {
              flex: 1.6,
              backgroundColor: isWireframe
                ? '#B0B0B0'
                : colors.petrolDeep,
              borderRadius: isWireframe
                ? Radius.sm
                : Radius.md,
              borderWidth:
                isWireframe ? 1.5 : 0,
              borderColor: '#666',
              opacity: accepting ? 0.7 : 1,
            },
          ]}
        >
          {accepting ? (
            <ActivityIndicator
              color="#FFF"
              size="small"
            />
          ) : (
            <>
              <Feather
                name="check-circle"
                size={18}
                color="#FFFFFF"
              />

              <Text
                style={{
                  color: '#FFFFFF',
                  fontFamily: font('bodySemiBold'),
                  fontSize: FontSizes.base,
                }}
              >
                Accept Order
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },

  backBtn: {
    padding: Spacing.xs,
  },

  newBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },

  scroll: {
    paddingBottom: Spacing.xl,
  },

  map: {
    height: 200,
    position: 'relative',
  },

  block: {
    position: 'absolute',
    backgroundColor: '#E8E8E0',
    borderRadius: 4,
  },

  park: {
    position: 'absolute',
    backgroundColor: '#E0EAE2',
    borderRadius: 4,
  },

  water: {
    position: 'absolute',
    backgroundColor: '#BACDD8',
  },

  road: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  roadV: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  destPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    transform: [
      { translateX: -16 },
      { translateY: -16 },
    ],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  suburbLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  card: {
    margin: Spacing.base,
    padding: Spacing.base,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  initialsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoLabel: {
    flex: 1,
  },

  infoValue: {
    textAlign: 'right',
    flex: 1.4,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },

  actionBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },

  declineBtn: {
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  acceptBtn: {
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  missingOrder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  backToOrdersButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
});