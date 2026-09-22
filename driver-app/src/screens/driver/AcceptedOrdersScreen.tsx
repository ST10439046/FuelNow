import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { Feather } from '@expo/vector-icons';

import { supabase } from '../../services/supabase';

import {
  FontSizes,
  Radius,
  Shadow,
  Spacing,
} from '../../theme/tokens';

import { useDesignMode } from '../../context/DesignModeContext';

export interface AcceptedOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  fuelType: string;
  litres: number;
  deliveryType: string;
  scheduledDateTime: string | null;
  placedAt: string;
  suburb: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  fuelSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  vatAmount: number;
  totalZar: number;
}

type RawAcceptedOrder = {
  order_id: string;
  customer_id: string;
  customer_name: string | null;
  fuel_type: string | null;
  litres: number | string | null;
  delivery_type: string | null;
  scheduled_date_time: string | null;
  placed_at: string;
  suburb: string | null;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  fuel_subtotal: number | string | null;
  delivery_fee: number | string | null;
  service_fee: number | string | null;
  vat_amount: number | string | null;
  total_zar: number | string | null;
};

type Navigation = {
  navigate: (
    screen: string,
    params?: any
  ) => void;
};

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

const getStatusColor = (
  status: string
): string => {
  switch (status.toUpperCase()) {
    case 'DISPENSING':
      return '#2563EB';

    case 'ARRIVED':
      return '#22C55E';

    case 'NAVIGATING':
      return '#F97316';

    default:
      return '#F97316';
  }
};

export default function AcceptedOrdersScreen() {
  const navigation =
    useNavigation<Navigation>();

  const {
    colors,
    font,
    isWireframe,
  } = useDesignMode();

  const [
    orders,
    setOrders,
  ] = useState<AcceptedOrder[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const loadOrders =
    useCallback(async () => {
      try {
        const {
          data,
          error,
        } = await supabase.rpc(
          'get_driver_accepted_orders'
        );

        if (error) {
          throw error;
        }

        const rows =
          (data ?? []) as RawAcceptedOrder[];

        const mapped: AcceptedOrder[] =
          rows.map(row => ({
            orderId:
              row.order_id,

            customerId:
              row.customer_id,

            customerName:
              row.customer_name ??
              'Customer',

            fuelType:
              row.fuel_type ??
              'Fuel',

            litres:
              Number(
                row.litres ?? 0
              ),

            deliveryType:
              row.delivery_type ??
              'Deliver Now',

            scheduledDateTime:
              row.scheduled_date_time,

            placedAt:
              row.placed_at,

            suburb:
              row.suburb ??
              '',

            fullAddress:
              row.full_address ??
              'Address unavailable',

            latitude:
              row.latitude,

            longitude:
              row.longitude,

            status:
              row.status ??
              'ACCEPTED',

            fuelSubtotal:
              Number(
                row.fuel_subtotal ?? 0
              ),

            deliveryFee:
              Number(
                row.delivery_fee ?? 0
              ),

            serviceFee:
              Number(
                row.service_fee ?? 0
              ),

            vatAmount:
              Number(
                row.vat_amount ?? 0
              ),

            totalZar:
              Number(
                row.total_zar ?? 0
              ),
          }));

        setOrders(mapped);
      } catch (error) {
        console.error(
          'AcceptedOrdersScreen: failed to load orders',
          error
        );

        setOrders([]);

        Alert.alert(
          'Unable to Load Orders',
          'There was a problem loading your accepted orders.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const refresh = async () => {
    setRefreshing(true);
    await loadOrders();
  };

  const openOrder = (
    order: AcceptedOrder
  ) => {
    navigation.navigate(
      'AcceptedOrderDetails',
      {
        order,
      }
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor:
              isWireframe
                ? '#F0F0F0'
                : colors.warmAsh,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={
            isWireframe
              ? '#444'
              : colors.petrolDeep
          }
        />

        <Text
          style={[
            styles.loadingText,
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
          Loading your accepted orders...
        </Text>
      </View>
    );
  }

  return (
    <View
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          orders.length === 0 &&
            styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color:
                  isWireframe
                    ? '#1A1A1A'
                    : colors.charcoalInk,
                fontFamily:
                  font('displayBold'),
              },
            ]}
          >
            My Orders
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
            Orders currently assigned to you
          </Text>
        </View>

        {orders.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
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
                styles.emptyIcon,
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
                size={28}
                color={
                  isWireframe
                    ? '#555'
                    : colors.petrolDeep
                }
              />
            </View>

            <Text
              style={[
                styles.emptyTitle,
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
              No active orders
            </Text>

            <Text
              style={[
                styles.emptyText,
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
              Orders you accept will appear here
              until the delivery is completed.
            </Text>
          </View>
        ) : (
          orders.map(order => {
            const statusColor =
              getStatusColor(
                order.status
              );

            return (
              <TouchableOpacity
                key={order.orderId}
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
                onPress={() =>
                  openOrder(order)
                }
                activeOpacity={0.85}
              >
                <View
                  style={styles.cardTop}
                >
                  <View
                    style={[
                      styles.iconCircle,
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
                      size={20}
                      color={
                        isWireframe
                          ? '#555'
                          : colors.petrolDeep
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.cardTitleArea
                    }
                  >
                    <Text
                      style={[
                        styles.orderNumber,
                        {
                          color:
                            isWireframe
                              ? '#222'
                              : colors.charcoalInk,
                          fontFamily:
                            font(
                              'displayBold'
                            ),
                        },
                      ]}
                    >
                      Order #
                      {order.orderId
                        .slice(0, 8)
                        .toUpperCase()}
                    </Text>

                    <Text
                      style={[
                        styles.customer,
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
                      {order.customerName}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          isWireframe
                            ? '#E0E0E0'
                            : `${statusColor}18`,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            isWireframe
                              ? '#666'
                              : statusColor,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            isWireframe
                              ? '#555'
                              : statusColor,
                          fontFamily:
                            font(
                              'bodySemiBold'
                            ),
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
                    styles.divider,
                    {
                      backgroundColor:
                        isWireframe
                          ? '#DDDDDD'
                          : colors.divider,
                    },
                  ]}
                />

                <View
                  style={styles.infoRow}
                >
                  <Feather
                    name="droplet"
                    size={16}
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
                    {order.fuelType}
                    {'  '}
                    {order.litres} L
                  </Text>
                </View>

                <View
                  style={styles.infoRow}
                >
                  <Feather
                    name="map-pin"
                    size={16}
                    color={
                      isWireframe
                        ? '#666'
                        : colors.inkLight
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
                    numberOfLines={2}
                  >
                    {order.fullAddress}
                  </Text>
                </View>

                <View
                  style={styles.cardBottom}
                >
                  <Text
                    style={[
                      styles.totalLabel,
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

                <View
                  style={styles.openRow}
                >
                  <Text
                    style={[
                      styles.openText,
                      {
                        color:
                          isWireframe
                            ? '#444'
                            : colors.petrolDeep,
                        fontFamily:
                          font('bodySemiBold'),
                      },
                    ]}
                  >
                    View delivery
                  </Text>

                  <Feather
                    name="chevron-right"
                    size={18}
                    color={
                      isWireframe
                        ? '#444'
                        : colors.petrolDeep
                    }
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },

  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.sm,
  },

  header: {
    marginBottom: Spacing.lg,
  },

  title: {
    fontSize: FontSizes.xl,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },

  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  cardTitleArea: {
    flex: 1,
  },

  orderNumber: {
    fontSize: FontSizes.base,
  },

  customer: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },

  statusText: {
    fontSize: FontSizes.xs,
  },

  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },

  infoText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },

  totalLabel: {
    fontSize: FontSizes.sm,
  },

  total: {
    fontSize: FontSizes.lg,
  },

  openRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  openText: {
    fontSize: FontSizes.sm,
    marginRight: Spacing.xs,
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },

  emptyText: {
    fontSize: FontSizes.sm,
    lineHeight: 21,
    textAlign: 'center',
  },
});