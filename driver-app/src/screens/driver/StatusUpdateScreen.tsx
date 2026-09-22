import React, {
  useMemo,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
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

import {
  driverRepository,
  DriverActiveOrder,
} from '../../repositories/DriverRepository';

interface Props {
  navigation: any;
  route: any;
}

const STEPS = [
  {
    status: 'ACCEPTED',
    label: 'Accepted',
  },
  {
    status: 'IN_TRANSIT',
    label: 'En Route',
  },
  {
    status: 'ARRIVED',
    label: 'Arrived',
  },
  {
    status: 'DISPENSING',
    label: 'Dispensing',
  },
  {
    status: 'COMPLETION_PENDING',
    label: 'PIN',
  },
];

const STEP_CONTENT: Record<
  string,
  {
    title: string;
    description: string;
    icon: string;
  }
> = {
  ACCEPTED: {
    title: 'Order Accepted',
    description:
      'This delivery is assigned to you. Start the delivery when you are ready to leave.',
    icon: 'check-circle',
  },

  IN_TRANSIT: {
    title: 'En Route to Customer',
    description:
      'You are travelling to the delivery location. Follow your navigation and drive safely.',
    icon: 'navigation',
  },

  ARRIVED: {
    title: 'You Have Arrived',
    description:
      'You have reached the customer location. Begin dispensing when you are ready.',
    icon: 'map-pin',
  },

  DISPENSING: {
    title: 'Dispensing Fuel',
    description:
      'Fuel dispensing is in progress. Verify the correct fuel type and quantity before completing the delivery.',
    icon: 'droplet',
  },

  COMPLETION_PENDING: {
    title: 'Delivery PIN Ready',
    description:
      'Show the delivery PIN to the customer. Once the customer confirms the PIN, finalise the delivery.',
    icon: 'key',
  },
};

const NEXT_ACTIONS: Record<
  string,
  string
> = {
  ACCEPTED:
    'Start Delivery',

  IN_TRANSIT:
    'Mark as Arrived',

  ARRIVED:
    'Start Dispensing',

  DISPENSING:
    'Complete Delivery',

  COMPLETION_PENDING:
    'Confirm Delivery',
};

export default function StatusUpdateScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const initialOrder =
    route?.params?.order as
      | DriverActiveOrder
      | undefined;

  const [
    order,
    setOrder,
  ] = useState(
    initialOrder
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    deliveryPin,
    setDeliveryPin,
  ] = useState<
    string | null
  >(null);

  const currentStatus =
    order?.status ??
    'ACCEPTED';

  const content =
    STEP_CONTENT[
      currentStatus
    ] ??
    STEP_CONTENT.ACCEPTED;

  const currentStep =
    useMemo(() => {
      const index =
        STEPS.findIndex(
          step =>
            step.status ===
            currentStatus
        );

      return index < 0
        ? 0
        : index;
    }, [currentStatus]);

const handleAdvance =
  async () => {
    if (
      !order ||
      loading
    ) {
      return;
    }

    if (
      currentStatus ===
      'DISPENSING'
    ) {
      try {
        setLoading(true);

        const result =
          await driverRepository.revealDeliveryPin(
            order.orderId
          );

        setDeliveryPin(
          result.deliveryPin
        );

        setOrder(
          current => {
            if (!current) {
              return current;
            }

            return {
              ...current,
              status:
                'COMPLETION_PENDING',
            };
          }
        );
      } catch (error: any) {
        console.error(
          'StatusUpdateScreen: failed to reveal delivery PIN',
          error
        );

        Alert.alert(
          'Unable to Complete',
          error?.message ??
            'The delivery PIN could not be displayed.'
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    if (
      currentStatus ===
      'COMPLETION_PENDING'
    ) {
      try {
        setLoading(true);

        await driverRepository.confirmDelivery(
          order.orderId
        );

        navigation.replace(
          'DeliveryComplete',
          {
            order: {
              ...order,
              status:
                'DELIVERED',
            },
          }
        );
      } catch (error: any) {
        console.error(
          'StatusUpdateScreen: failed to confirm delivery',
          error
        );

        Alert.alert(
          'Delivery Failed',
          error?.message ??
            'The delivery could not be confirmed.'
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    let nextStatus:
      | 'IN_TRANSIT'
      | 'ARRIVED'
      | 'DISPENSING';

    switch (
      currentStatus
    ) {
      case 'ACCEPTED':
        nextStatus =
          'IN_TRANSIT';
        break;

      case 'IN_TRANSIT':
        nextStatus =
          'ARRIVED';
        break;

      case 'ARRIVED':
        nextStatus =
          'DISPENSING';
        break;

      default:
        return;
    }

    try {
      setLoading(true);

      await driverRepository.updateOrderStatus(
        order.orderId,
        nextStatus
      );

      setOrder(
        current => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            status:
              nextStatus,
          };
        }
      );
    } catch (error: any) {
      console.error(
        'StatusUpdateScreen: failed to update order status',
        error
      );

      Alert.alert(
        'Status Update Failed',
        error?.message ??
          'The order status could not be updated.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency =
    (value: number) =>
      `R ${value.toLocaleString(
        'en-ZA',
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )}`;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            colors.warmAsh,
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
              colors.white,
            borderBottomColor:
              colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor:
                colors.ashDark,
            },
          ]}
          onPress={() =>
            navigation.goBack()
          }
          disabled={loading}
        >
          <Feather
            name="arrow-left"
            size={20}
            color={
              colors.charcoalInk
            }
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color:
                  colors.charcoalInk,
                fontFamily:
                  font(
                    'displayBold'
                  ),
              },
            ]}
          >
            Delivery Status
          </Text>

          <Text
            style={[
              styles.headerSub,
              {
                color:
                  colors.inkFaint,
                fontFamily:
                  font('body'),
              },
            ]}
          >
            #
            {order?.orderId
              ?.slice(0, 8)
              .toUpperCase() ??
              'UNKNOWN'}
          </Text>
        </View>

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.stepperCard,
            {
              backgroundColor:
                colors.white,
              ...Shadow.sm,
            },
          ]}
        >
          <View
            style={
              styles.stepperRow
            }
          >
            {STEPS.map(
              (
                step,
                index
              ) => {
                const isDone =
                  index <
                  currentStep;

                const isCurrent =
                  index ===
                  currentStep;

                return (
                  <React.Fragment
                    key={
                      step.status
                    }
                  >
                    {index > 0 && (
                      <View
                        style={[
                          styles.connector,
                          {
                            backgroundColor:
                              index <=
                              currentStep
                                ? isWireframe
                                  ? '#555555'
                                  : colors.petrolDeep
                                : colors.divider,
                          },
                        ]}
                      />
                    )}

                    <View
                      style={
                        styles.stepItem
                      }
                    >
                      <View
                        style={[
                          styles.stepCircle,
                          {
                            backgroundColor:
                              isDone ||
                              isCurrent
                                ? isWireframe
                                  ? '#555555'
                                  : colors.petrolDeep
                                : colors.divider,
                          },
                        ]}
                      >
                        {isDone ? (
                          <Feather
                            name="check"
                            size={12}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Text
                            style={[
                              styles.stepNumber,
                              {
                                color:
                                  isCurrent
                                    ? '#FFFFFF'
                                    : colors.inkFaint,

                                fontFamily:
                                  font(
                                    'bodyBold'
                                  ),
                              },
                            ]}
                          >
                            {index +
                              1}
                          </Text>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.stepLabel,
                          {
                            color:
                              index <=
                              currentStep
                                ? colors.charcoalInk
                                : colors.inkFaint,

                            fontFamily:
                              isCurrent
                                ? font(
                                    'bodyBold'
                                  )
                                : font(
                                    'body'
                                  ),
                          },
                        ]}
                        numberOfLines={
                          1
                        }
                      >
                        {
                          step.label
                        }
                      </Text>
                    </View>
                  </React.Fragment>
                );
              }
            )}
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor:
                colors.white,
              ...Shadow.sm,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  isWireframe
                    ? '#E5E5E5'
                    : colors.petrolLight,
              },
            ]}
          >
            <Feather
              name={
                content.icon as any
              }
              size={25}
              color={
                isWireframe
                  ? '#555555'
                  : colors.petrolDeep
              }
            />
          </View>

          <Text
            style={[
              styles.infoTitle,
              {
                color:
                  colors.charcoalInk,
                fontFamily:
                  font(
                    'displayBold'
                  ),
              },
            ]}
          >
            {content.title}
          </Text>

          <Text
            style={[
              styles.infoDescription,
              {
                color:
                  colors.inkLight,
                fontFamily:
                  font('body'),
              },
            ]}
          >
            {
              content.description
            }
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor:
                colors.white,
              ...Shadow.sm,
            },
          ]}
        >
          <View
            style={
              styles.summaryRow
            }
          >
            <Feather
              name="user"
              size={15}
              color={
                colors.petrolDeep
              }
            />

            <Text
              style={[
                styles.summaryText,
                {
                  color:
                    colors.charcoalInk,
                  fontFamily:
                    font(
                      'bodyMedium'
                    ),
                },
              ]}
            >
              {order?.customerName ??
                'Customer'}
            </Text>
          </View>

          <View
            style={[
              styles.summaryRow,
              {
                marginTop:
                  Spacing.sm,
              },
            ]}
          >
            <Feather
              name="droplet"
              size={15}
              color={
                colors.petrolDeep
              }
            />

            <Text
              style={[
                styles.summaryText,
                {
                  color:
                    colors.charcoalInk,
                  fontFamily:
                    font(
                      'bodyMedium'
                    ),
                },
              ]}
            >
              {order?.fuelType ??
                'Fuel'}{' '}
              ·{' '}
              {order?.litres ??
                0}{' '}
              L
            </Text>

            <Text
              style={[
                styles.summaryPrice,
                {
                  color:
                    colors.petrolDeep,
                  fontFamily:
                    font(
                      'bodyBold'
                    ),
                },
              ]}
            >
              {formatCurrency(
                order?.totalZar ??
                  0
              )}
            </Text>
          </View>

          <View
            style={[
              styles.summaryRow,
              {
                marginTop:
                  Spacing.sm,
              },
            ]}
          >
            <Feather
              name="map-pin"
              size={15}
              color={
                colors.inkFaint
              }
            />

            <Text
              style={[
                styles.summaryText,
                {
                  color:
                    colors.inkLight,
                  fontFamily:
                    font('body'),
                },
              ]}
              numberOfLines={
                2
              }
            >
              {order?.fullAddress ||
                order?.suburb ||
                'Destination unavailable'}
            </Text>
          </View>
        </View>

        {deliveryPin && (
          <View
            style={[
              styles.pinCard,
              {
                backgroundColor:
                  isWireframe
                    ? '#EEEEEE'
                    : colors.petrolLight,

                borderColor:
                  isWireframe
                    ? '#BBBBBB'
                    : colors.petrolDeep,
              },
            ]}
          >
            <View
              style={
                styles.pinHeader
              }
            >
              <View
                style={[
                  styles.pinIcon,
                  {
                    backgroundColor:
                      isWireframe
                        ? '#D0D0D0'
                        : colors.petrolDeep,
                  },
                ]}
              >
                <Feather
                  name="key"
                  size={19}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.pinHeaderText
                }
              >
                <Text
                  style={[
                    styles.pinTitle,
                    {
                      color:
                        colors.charcoalInk,
                      fontFamily:
                        font(
                          'displayBold'
                        ),
                    },
                  ]}
                >
                  Delivery PIN
                </Text>

                <Text
                  style={[
                    styles.pinDescription,
                    {
                      color:
                        colors.inkLight,
                      fontFamily:
                        font('body'),
                    },
                  ]}
                >
                  Show this PIN to the customer.
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.pinValue,
                {
                  color:
                    isWireframe
                      ? '#111111'
                      : colors.petrolDeep,
                  fontFamily:
                    font(
                      'displayBold'
                    ),
                },
              ]}
            >
              {deliveryPin}
            </Text>

            <View
              style={[
                styles.pinWarning,
                {
                  backgroundColor:
                    colors.white,
                },
              ]}
            >
              <Feather
                name="info"
                size={14}
                color={
                  colors.inkLight
                }
              />

              <Text
                style={[
                  styles.pinWarningText,
                  {
                    color:
                      colors.inkLight,
                    fontFamily:
                      font('body'),
                  },
                ]}
              >
                Confirm with the customer before finalising the delivery.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              colors.white,
            borderTopColor:
              colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cta,
            {
              backgroundColor:
                isWireframe
                  ? '#555555'
                  : currentStatus ===
                    'DISPENSING'
                  ? colors.dieselGreen
                  : colors.petrolDeep,

              opacity:
                loading ? 0.65 : 1,
            },
          ]}
          onPress={
            handleAdvance
          }
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Feather
                name={
                  currentStatus ===
                  'DISPENSING'
                    ? 'key'
                    : currentStatus ===
                      'COMPLETION_PENDING'
                    ? 'check-circle'
                    : 'arrow-right'
                }
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={[
                  styles.ctaText,
                  {
                    fontFamily:
                      font(
                        'bodyBold'
                      ),
                  },
                ]}
              >
                {
                  NEXT_ACTIONS[
                    currentStatus
                  ]
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      height:
        Platform.OS === 'web'
          ? ('100vh' as any)
          : '100%',
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal:
        Spacing.base,
      paddingVertical:
        Spacing.md,
      borderBottomWidth: 1,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius:
        Radius.md,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    headerCenter: {
      flex: 1,
      alignItems:
        'center',
    },

    headerTitle: {
      fontSize:
        FontSizes.md,
    },

    headerSub: {
      fontSize:
        FontSizes.xs,
      marginTop: 2,
    },

    scrollContent: {
      padding:
        Spacing.base,
      paddingBottom:
        Spacing.xl,
      gap: Spacing.md,
    },

    stepperCard: {
      borderRadius:
        Radius.lg,
      padding:
        Spacing.base,
    },

    stepperRow: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
    },

    stepItem: {
      alignItems:
        'center',
      width: 54,
    },

    stepCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    stepNumber: {
      fontSize:
        FontSizes.xs,
    },

    stepLabel: {
      fontSize: 8,
      marginTop: 4,
      textAlign:
        'center',
    },

    connector: {
      flex: 1,
      height: 2,
      marginTop: 14,
      marginHorizontal: 2,
    },

    infoCard: {
      borderRadius:
        Radius.lg,
      padding:
        Spacing.lg,
      alignItems:
        'center',
    },

    iconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom:
        Spacing.md,
    },

    infoTitle: {
      fontSize:
        FontSizes.lg,
      textAlign:
        'center',
      marginBottom:
        Spacing.sm,
    },

    infoDescription: {
      fontSize:
        FontSizes.sm,
      lineHeight: 21,
      textAlign:
        'center',
    },

    summaryCard: {
      borderRadius:
        Radius.lg,
      padding:
        Spacing.base,
    },

    summaryRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    summaryText: {
      flex: 1,
      marginLeft:
        Spacing.sm,
      fontSize:
        FontSizes.sm,
    },

    summaryPrice: {
      fontSize:
        FontSizes.sm,
    },

    pinCard: {
      borderRadius:
        Radius.lg,
      borderWidth: 1.5,
      padding:
        Spacing.lg,
      alignItems:
        'center',
    },

    pinHeader: {
      flexDirection:
        'row',
      alignItems:
        'center',
      width: '100%',
    },

    pinIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginRight:
        Spacing.md,
    },

    pinHeaderText: {
      flex: 1,
    },

    pinTitle: {
      fontSize:
        FontSizes.base,
    },

    pinDescription: {
      fontSize:
        FontSizes.xs,
      marginTop: 2,
    },

    pinValue: {
      fontSize: 42,
      letterSpacing: 8,
      marginVertical:
        Spacing.lg,
    },

    pinWarning: {
      width: '100%',
      flexDirection:
        'row',
      alignItems:
        'center',
      padding:
        Spacing.sm,
      borderRadius:
        Radius.md,
      gap: Spacing.sm,
    },

    pinWarningText: {
      flex: 1,
      fontSize:
        FontSizes.xs,
      lineHeight: 17,
    },

    footer: {
      padding:
        Spacing.base,
      borderTopWidth: 1,
    },

    cta: {
      minHeight: 54,
      borderRadius:
        Radius.lg,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: Spacing.sm,
    },

    ctaText: {
      color: '#FFFFFF',
      fontSize:
        FontSizes.base,
    },
  });