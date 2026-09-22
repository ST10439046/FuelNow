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
import { supabase } from '../../services/supabase';

export interface AvailableOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  address: string;
  suburb: string;
  city: string;
  fuelType: string;
  volumeLitres: number;
  deliveryType: string;
  scheduledDateTime?: string | null;
  placedAt: string;
  latitude?: number | null;
  longitude?: number | null;
  distance: string;
  eta: string;
  fuelSubtotal: number;
  deliveryFee: number;
  serviceFee: number;
  vatAmount: number;
  totalAmount: number;
}

type Navigation = {
  navigate: (
    screen: string,
    params?: any
  ) => void;
};

type RawAvailableOrder = {
  order_id: string;
  customer_id: string;
  customer_name: string | null;
  customer_initials: string | null;
  fuel_type: string | null;
  litres: number | string | null;
  delivery_type: string | null;
  scheduled_date_time: string | null;
  placed_at: string;
  suburb: string | null;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | string | null;
  estimated_minutes: number | null;
  fuel_subtotal: number | string | null;
  delivery_fee: number | string | null;
  service_fee: number | string | null;
  vat_amount: number | string | null;
  total_zar: number | string | null;
};

const formatCurrency = (
  amount: number
): string => {
  return `R ${amount.toFixed(2)}`;
};

const formatDistance = (
  distanceKm: number | string | null
): string => {
  if (
    distanceKm === null ||
    distanceKm === undefined
  ) {
    return 'Distance unavailable';
  }

  const distance = Number(distanceKm);

  if (!Number.isFinite(distance)) {
    return 'Distance unavailable';
  }

  return `${distance.toFixed(1)} km`;
};

const formatEta = (
  estimatedMinutes: number | null
): string => {
  if (
    estimatedMinutes === null ||
    estimatedMinutes === undefined
  ) {
    return 'ETA unavailable';
  }

  if (estimatedMinutes < 60) {
    return `${estimatedMinutes} min`;
  }

  const hours = Math.floor(
    estimatedMinutes / 60
  );

  const minutes =
    estimatedMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

const normalizeDeliveryType = (
  deliveryType: string | null
): string => {
  const normalized =
    (
      deliveryType ?? ''
    )
      .trim()
      .toUpperCase();

  if (
    normalized === 'DELIVER_NOW'
  ) {
    return 'Deliver Now';
  }

  if (
    normalized === 'DELIVER NOW'
  ) {
    return 'Deliver Now';
  }

  if (
    normalized === 'SCHEDULED'
  ) {
    return 'Scheduled';
  }

  return (
    deliveryType ?? 'Unknown'
  );
};

const AvailableOrdersScreen =
  () => {
    const navigation =
      useNavigation<Navigation>();

    const [orders, setOrders] =
      useState<AvailableOrder[]>([]);

    const [loading, setLoading] =
      useState(true);

    const [refreshing, setRefreshing] =
      useState(false);

    const loadAvailableOrders =
      useCallback(async () => {
        try {
          console.log(
            'AvailableOrdersScreen: loading available orders via RPC'
          );

          /*
           * All order-related data is now fetched by
           * get_driver_available_orders().
           *
           * The RPC performs the joins for:
           * - orders
           * - users
           * - addresses
           * - fuel_types
           * - payments
           *
           * This means the app makes one Supabase request
           * instead of several independent requests.
           */
          const {
            data,
            error,
          } = await supabase.rpc(
            'get_driver_available_orders'
          );

          if (error) {
            console.error(
              'AvailableOrdersScreen: RPC failed',
              error
            );

            throw error;
          }

          const rawOrders =
            (data ?? []) as RawAvailableOrder[];

          console.log(
            'AvailableOrdersScreen: RPC returned',
            rawOrders.length,
            'orders'
          );

          if (
            rawOrders.length === 0
          ) {
            setOrders([]);
            return;
          }

          /*
           * Convert the database response into the
           * AvailableOrder model used by the rest of
           * the driver application.
           */
          const mappedOrders =
            rawOrders.map(
              order => {
                const distance =
                  formatDistance(
                    order.distance_km
                  );

                const eta =
                  formatEta(
                    order.estimated_minutes
                  );

                return {
                  orderId:
                    order.order_id,

                  customerId:
                    order.customer_id,

                  customerName:
                    order.customer_name ??
                    'Customer',

                  address:
                    order.full_address ??
                    'Address unavailable',

                  suburb:
                    order.suburb ??
                    'Destination',

                  city:
                    order.full_address
                      ?.split(',')
                      .pop()
                      ?.trim() ??
                    'Durban',

                  fuelType:
                    order.fuel_type ??
                    'Fuel',

                  volumeLitres:
                    Number(
                      order.litres ?? 0
                    ),

                  deliveryType:
                    normalizeDeliveryType(
                      order.delivery_type
                    ),

                  scheduledDateTime:
                    order.scheduled_date_time,

                  placedAt:
                    order.placed_at,

                  latitude:
                    order.latitude ??
                    null,

                  longitude:
                    order.longitude ??
                    null,

                  distance,

                  eta,

                  fuelSubtotal:
                    Number(
                      order.fuel_subtotal ??
                        0
                    ),

                  deliveryFee:
                    Number(
                      order.delivery_fee ??
                        0
                    ),

                  serviceFee:
                    Number(
                      order.service_fee ??
                        0
                    ),

                  vatAmount:
                    Number(
                      order.vat_amount ??
                        0
                    ),

                  totalAmount:
                    Number(
                      order.total_zar ??
                        0
                    ),
                };
              }
            );

          console.log(
            'AvailableOrdersScreen: final orders',
            JSON.stringify(
              mappedOrders,
              null,
              2
            )
          );

          setOrders(mappedOrders);
        } catch (error) {
          console.error(
            'AvailableOrdersScreen: failed to load orders',
            error
          );

          setOrders([]);

          Alert.alert(
            'Unable to Load Orders',
            'There was a problem loading available orders. Please try again.'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      }, []);

    useFocusEffect(
      useCallback(() => {
        loadAvailableOrders();
      }, [
        loadAvailableOrders,
      ])
    );

    const handleRefresh =
      async () => {
        setRefreshing(true);
        await loadAvailableOrders();
      };

    const handleOrderPress =
      (order: AvailableOrder) => {
        navigation.navigate(
          'DriverOrderDetails',
          {
            order,
          }
        );
      };

    if (loading) {
      return (
        <View
          style={
            styles.centerContainer
          }
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading available orders...
          </Text>
        </View>
      );
    }

    return (
      <View
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            orders.length === 0 &&
              styles.emptyScrollContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                handleRefresh
              }
            />
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.header}
          >
            <Text
              style={styles.title}
            >
              Available Orders
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Paid orders waiting for a
              driver
            </Text>
          </View>

          {orders.length === 0 ? (
            <View
              style={
                styles.emptyContainer
              }
            >
              <Text
                style={
                  styles.emptyTitle
                }
              >
                No available orders
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                There are currently no
                paid orders available
                for delivery.
              </Text>

              <TouchableOpacity
                style={
                  styles.refreshButton
                }
                onPress={
                  handleRefresh
                }
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.refreshButtonText
                  }
                >
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            orders.map(order => (
              <TouchableOpacity
                key={
                  order.orderId
                }
                style={
                  styles.orderCard
                }
                onPress={() =>
                  handleOrderPress(
                    order
                  )
                }
                activeOpacity={0.85}
              >
                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.customerSection
                    }
                  >
                    <Text
                      style={
                        styles.customerName
                      }
                    >
                      {
                        order.customerName
                      }
                    </Text>

                    <Text
                      style={
                        styles.deliveryType
                      }
                    >
                      {
                        order.deliveryType
                      }
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.totalAmount
                    }
                  >
                    {formatCurrency(
                      order.totalAmount
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.divider
                  }
                />

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Fuel
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {
                      order.fuelType
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Volume
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {order.volumeLitres.toFixed(
                      2
                    )}{' '}
                    L
                  </Text>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Address
                  </Text>

                  <Text
                    style={[
                      styles.detailValue,
                      styles.addressValue,
                    ]}
                  >
                    {
                      order.address
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    Distance
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {
                      order.distance
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.detailRow
                  }
                >
                  <Text
                    style={
                      styles.detailLabel
                    }
                  >
                    ETA
                  </Text>

                  <Text
                    style={
                      styles.detailValue
                    }
                  >
                    {order.eta}
                  </Text>
                </View>

                {order.deliveryType ===
                  'Scheduled' &&
                  order.scheduledDateTime && (
                    <View
                      style={
                        styles.scheduledBox
                      }
                    >
                      <Text
                        style={
                          styles.scheduledLabel
                        }
                      >
                        Scheduled for
                      </Text>

                      <Text
                        style={
                          styles.scheduledValue
                        }
                      >
                        {new Date(
                          order.scheduledDateTime
                        ).toLocaleString()}
                      </Text>
                    </View>
                  )}

                <View
                  style={
                    styles.priceSection
                  }
                >
                  <View
                    style={
                      styles.priceRow
                    }
                  >
                    <Text
                      style={
                        styles.priceLabel
                      }
                    >
                      Fuel Subtotal
                    </Text>

                    <Text
                      style={
                        styles.priceValue
                      }
                    >
                      {formatCurrency(
                        order.fuelSubtotal
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.priceRow
                    }
                  >
                    <Text
                      style={
                        styles.priceLabel
                      }
                    >
                      Delivery Fee
                    </Text>

                    <Text
                      style={
                        styles.priceValue
                      }
                    >
                      {formatCurrency(
                        order.deliveryFee
                      )}
                    </Text>
                  </View>

                  {order.serviceFee >
                    0 && (
                    <View
                      style={
                        styles.priceRow
                      }
                    >
                      <Text
                        style={
                          styles.priceLabel
                        }
                      >
                        Service Fee
                      </Text>

                      <Text
                        style={
                          styles.priceValue
                        }
                      >
                        {formatCurrency(
                          order.serviceFee
                        )}
                      </Text>
                    </View>
                  )}

                  {order.vatAmount >
                    0 && (
                    <View
                      style={
                        styles.priceRow
                      }
                    >
                      <Text
                        style={
                          styles.priceLabel
                        }
                      >
                        VAT
                      </Text>

                      <Text
                        style={
                          styles.priceValue
                        }
                      >
                        {formatCurrency(
                          order.vatAmount
                        )}
                      </Text>
                    </View>
                  )}

                  <View
                    style={
                      styles.totalRow
                    }
                  >
                    <Text
                      style={
                        styles.totalLabel
                      }
                    >
                      Total
                    </Text>

                    <Text
                      style={
                        styles.totalValue
                      }
                    >
                      {formatCurrency(
                        order.totalAmount
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={
                    styles.viewButton
                  }
                >
                  <Text
                    style={
                      styles.viewButtonText
                    }
                  >
                    View Order
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },

    emptyScrollContent: {
      flexGrow: 1,
    },

    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5F7FA',
      padding: 24,
    },

    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: '#666666',
    },

    header: {
      marginBottom: 18,
    },

    title: {
      fontSize: 26,
      fontWeight: '700',
      color: '#111111',
    },

    subtitle: {
      marginTop: 5,
      fontSize: 14,
      color: '#707070',
    },

    orderCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },

    cardHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-start',
    },

    customerSection: {
      flex: 1,
      paddingRight: 12,
    },

    customerName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111111',
    },

    deliveryType: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '600',
      color: '#2E7D32',
    },

    totalAmount: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111111',
    },

    divider: {
      height: 1,
      backgroundColor: '#EEEEEE',
      marginVertical: 14,
    },

    detailRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-start',
      marginBottom: 9,
    },

    detailLabel: {
      fontSize: 13,
      color: '#777777',
      marginRight: 12,
    },

    detailValue: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#222222',
      textAlign: 'right',
    },

    addressValue: {
      maxWidth: '70%',
    },

    scheduledBox: {
      backgroundColor: '#F1F6FF',
      borderRadius: 10,
      padding: 12,
      marginTop: 4,
      marginBottom: 12,
    },

    scheduledLabel: {
      fontSize: 12,
      color: '#55709A',
      marginBottom: 3,
    },

    scheduledValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1E3A5F',
    },

    priceSection: {
      borderTopWidth: 1,
      borderTopColor: '#EEEEEE',
      marginTop: 6,
      paddingTop: 12,
    },

    priceRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginBottom: 7,
    },

    priceLabel: {
      fontSize: 13,
      color: '#777777',
    },

    priceValue: {
      fontSize: 13,
      color: '#333333',
      fontWeight: '500',
    },

    totalRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 5,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#EEEEEE',
    },

    totalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111111',
    },

    totalValue: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111111',
    },

    viewButton: {
      marginTop: 15,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
      backgroundColor: '#111111',
    },

    viewButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#222222',
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 14,
      lineHeight: 21,
      color: '#777777',
      textAlign: 'center',
      marginBottom: 20,
    },

    refreshButton: {
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 9,
      backgroundColor: '#111111',
    },

    refreshButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });

export default AvailableOrdersScreen;