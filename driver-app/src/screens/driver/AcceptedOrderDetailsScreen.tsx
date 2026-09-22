import React, {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
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
  Shadow,
  Spacing,
} from '../../theme/tokens';

import {
  AcceptedOrder,
} from './AcceptedOrdersScreen';

import {
  supabase,
} from '../../services/supabase';

interface Props {
  navigation: any;
  route: any;
}

const formatCurrency = (
  amount: number
): string => {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatStatus = (
  status: string
): string => {
  switch (status.toUpperCase()) {
    case 'ACCEPTED':
      return 'Accepted';

    case 'NAVIGATING':
      return 'En Route';

    case 'ARRIVED':
      return 'Arrived';

    case 'DISPENSING':
      return 'Dispensing';

    default:
      return status;
  }
};

export default function AcceptedOrderDetailsScreen({
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
      | AcceptedOrder
      | undefined;

  const [
    completing,
    setCompleting,
  ] = useState(false);

  if (!order) {
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
      >
        <View
          style={styles.center}
        >
          <Text
            style={[
              styles.errorText,
              {
                color:
                  isWireframe
                    ? '#222'
                    : colors.charcoalInk,
                fontFamily:
                  font('bodyMedium'),
              },
            ]}
          >
            Order information is unavailable.
          </Text>

          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor:
                  isWireframe
                    ? '#555'
                    : colors.petrolDeep,
              },
            ]}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={[
                styles.backButtonText,
                {
                  fontFamily:
                    font('bodySemiBold'),
                },
              ]}
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completeOrder =
    async () => {
      if (completing) {
        return;
      }

      Alert.alert(
        'Complete Delivery',
        'Are you sure this delivery has been completed? The order will be marked as completed.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                setCompleting(true);

                const {
                  data,
                  error,
                } = await supabase.rpc(
                  'complete_driver_order',
                  {
                    p_order_id:
                      order.orderId,
                  }
                );

                if (error) {
                  throw error;
                }

                const result =
                  Array.isArray(data)
                    ? data[0]
                    : data;

                if (
                  !result
                    ?.delivery_pin
                ) {
                  throw new Error(
                    'The delivery was completed, but the delivery PIN could not be retrieved.'
                  );
                }

                navigation.replace(
                  'DeliveryPin',
                  {
                    order,
                    deliveryPin:
                      result.delivery_pin,
                    completedAt:
                      result.completed_at,
                  }
                );
              } catch (error) {
                console.error(
                  'AcceptedOrderDetailsScreen: completion failed',
                  error
                );

                Alert.alert(
                  'Unable to Complete Delivery',
                  error instanceof Error
                    ? error.message
                    : 'The delivery could not be completed.'
                );
              } finally {
                setCompleting(false);
              }
            },
          },
        ]
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
        style={[
          styles.header,
          {
            backgroundColor:
              isWireframe
                ? '#FFFFFF'
                : colors.white,
            borderBottomColor:
              isWireframe
                ? '#CCCCCC'
                : colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            navigation.goBack()
          }
          disabled={completing}
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

        <View
          style={styles.headerCenter}
        >
          <Text
            style={[
              styles.headerTitle,
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
            Delivery
          </Text>

          <Text
            style={[
              styles.headerSubtitle,
              {
                color:
                  isWireframe
                    ? '#777'
                    : colors.inkFaint,
                fontFamily:
                  font('body'),
              },
            ]}
          >
            #
            {order.orderId
              .slice(0, 8)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={styles.headerButton}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor:
                isWireframe
                  ? '#FFFFFF'
                  : colors.white,
            },
            !isWireframe &&
              Shadow.sm,
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor:
                  isWireframe
                    ? '#E0E0E0'
                    : colors.petrolLight,
              },
            ]}
          >
            <Feather
              name="truck"
              size={26}
              color={
                isWireframe
                  ? '#555'
                  : colors.petrolDeep
              }
            />
          </View>

          <View
            style={styles.statusInfo}
          >
            <Text
              style={[
                styles.statusLabel,
                {
                  color:
                    isWireframe
                      ? '#777'
                      : colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              Current Status
            </Text>

            <Text
              style={[
                styles.statusValue,
                {
                  color:
                    isWireframe
                      ? '#222'
                      : colors.charcoalInk,
                  fontFamily:
                    font('displayBold'),
                },
              ]}
            >
              {formatStatus(
                order.status
              )}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
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
            !isWireframe &&
              Shadow.sm,
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  isWireframe
                    ? '#222'
                    : colors.charcoalInk,
                fontFamily:
                  font('displayBold'),
              },
            ]}
          >
            Customer
          </Text>

          <View
            style={styles.infoRow}
          >
            <Feather
              name="user"
              size={18}
              color={
                isWireframe
                  ? '#666'
                  : colors.petrolDeep
              }
            />

            <Text
              style={[
                styles.infoText,
                {
                  color:
                    isWireframe
                      ? '#333'
                      : colors.charcoalInk,
                  fontFamily:
                    font('bodyMedium'),
                },
              ]}
            >
              {order.customerName}
            </Text>
          </View>

          <View
            style={styles.infoRow}
          >
            <Feather
              name="map-pin"
              size={18}
              color={
                isWireframe
                  ? '#666'
                  : colors.petrolDeep
              }
            />

            <Text
              style={[
                styles.infoText,
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
              {order.fullAddress}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
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
            !isWireframe &&
              Shadow.sm,
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  isWireframe
                    ? '#222'
                    : colors.charcoalInk,
                fontFamily:
                  font('displayBold'),
              },
            ]}
          >
            Fuel
          </Text>

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    isWireframe
                      ? '#777'
                      : colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              Fuel Type
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    isWireframe
                      ? '#222'
                      : colors.charcoalInk,
                  fontFamily:
                    font('bodyMedium'),
                },
              ]}
            >
              {order.fuelType}
            </Text>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    isWireframe
                      ? '#777'
                      : colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              Quantity
            </Text>

            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    isWireframe
                      ? '#222'
                      : colors.charcoalInk,
                  fontFamily:
                    font('bodyMedium'),
                },
              ]}
            >
              {order.litres} L
            </Text>
          </View>

          <View
            style={styles.detailRow}
          >
            <Text
              style={[
                styles.detailLabel,
                {
                  color:
                    isWireframe
                      ? '#777'
                      : colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
            >
              Order Total
            </Text>

            <Text
              style={[
                styles.total,
                {
                  color:
                    isWireframe
                      ? '#222'
                      : colors.petrolDeep,
                  fontFamily:
                    font('displayBold'),
                },
              ]}
            >
              {formatCurrency(
                order.totalZar
              )}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.warningCard,
            {
              backgroundColor:
                isWireframe
                  ? '#E8E8E8'
                  : colors.petrolFaint,
              borderColor:
                isWireframe
                  ? '#CCCCCC'
                  : colors.petrolLight,
            },
          ]}
        >
          <Feather
            name="info"
            size={18}
            color={
              isWireframe
                ? '#555'
                : colors.petrolDeep
            }
          />

          <Text
            style={[
              styles.warningText,
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
            Only complete the delivery once
            the fuel has been delivered to
            the customer.
          </Text>
        </View>
      </ScrollView>

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
            styles.completeButton,
            {
              backgroundColor:
                isWireframe
                  ? '#444'
                  : colors.dieselGreen,
            },
            completing &&
              styles.disabledButton,
          ]}
          onPress={completeOrder}
          disabled={completing}
          activeOpacity={0.85}
        >
          {completing ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Feather
                name="check-circle"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={[
                  styles.completeText,
                  {
                    fontFamily:
                      font('bodyBold'),
                  },
                ]}
              >
                Complete Delivery
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  errorText: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },

  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: FontSizes.md,
  },

  headerSubtitle: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },

  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },

  statusIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  statusInfo: {
    flex: 1,
  },

  statusLabel: {
    fontSize: FontSizes.xs,
  },

  statusValue: {
    fontSize: FontSizes.lg,
    marginTop: 2,
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },

  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSizes.sm,
    lineHeight: 21,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },

  detailLabel: {
    fontSize: FontSizes.sm,
  },

  detailValue: {
    fontSize: FontSizes.sm,
    maxWidth: '60%',
    textAlign: 'right',
  },

  total: {
    fontSize: FontSizes.lg,
  },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  warningText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
  },

  completeButton: {
    minHeight: 54,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },

  completeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },

  disabledButton: {
    opacity: 0.6,
  },
});