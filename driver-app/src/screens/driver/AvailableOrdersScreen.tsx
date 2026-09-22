import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export interface AvailableOrder {
  orderId: string;
  customerId: string;
  customerName: string;
  address: string;
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
  navigate: (screen: string, params?: any) => void;
};

type RawOrder = {
  order_id: string;
  customer_id: string;
  fuel_type_id: string;
  volume_litres: number | null;
  delivery_type: string | null;
  scheduled_date_time: string | null;
  status: string;
  placed_at: string;
  address_id: string;
  addresses:
    | {
        unit_number: string | null;
        street_number: string | null;
        street_name: string | null;
        suburb: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
      }
    | {
        unit_number: string | null;
        street_number: string | null;
        street_name: string | null;
        suburb: string | null;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
      }[]
    | null;
  fuel_types:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
  payments:
    | {
        fuel_subtotal: number | null;
        delivery_fee: number | null;
        service_fee: number | null;
        vat_amount: number | null;
        total_amount: number | null;
      }
    | {
        fuel_subtotal: number | null;
        delivery_fee: number | null;
        service_fee: number | null;
        vat_amount: number | null;
        total_amount: number | null;
      }[]
    | null;
};

type Customer = {
  user_id: string;
  full_name: string | null;
};

const getRelationObject = <T,>(relation: T | T[] | null | undefined): T | null => {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

const formatCurrency = (amount: number): string => {
  return `R ${amount.toFixed(2)}`;
};

const formatAddress = (
  address:
    | {
        unit_number: string | null;
        street_number: string | null;
        street_name: string | null;
        suburb: string | null;
        city: string | null;
      }
    | null
): string => {
  if (!address) {
    return 'Address unavailable';
  }

  const parts = [
    address.unit_number,
    address.street_number,
    address.street_name,
    address.suburb,
    address.city,
  ].filter(
    (part): part is string =>
      typeof part === 'string' && part.trim().length > 0
  );

  return parts.length > 0 ? parts.join(', ') : 'Address unavailable';
};

const isSameLocalDay = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const isScheduledStillValid = (dateString: string | null): boolean => {
  if (!dateString) {
    return false;
  }

  return new Date(dateString).getTime() > Date.now();
};

const calculateDistanceAndEta = (
  latitude: number | null | undefined,
  longitude: number | null | undefined
): { distance: string; eta: string } => {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return {
      distance: 'Distance unavailable',
      eta: 'ETA unavailable',
    };
  }

  /*
   * The driver app does not currently have a routing provider connected
   * directly to this screen, so we avoid inventing a route distance.
   * These values can be replaced once the navigation service is wired in.
   */
  return {
    distance: 'Location available',
    eta: 'ETA calculated on navigation',
  };
};

const AvailableOrdersScreen = () => {
  const navigation = useNavigation<Navigation>();

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAvailableOrders = useCallback(async () => {
    try {
      console.log('AvailableOrdersScreen: loading available orders');

      /*
       * Do not request the customer through a nested users/customer
       * relationship here. The orders.customer_id column points to the
       * application-level users.user_id, while the database also contains
       * auth.users and potentially other relationships. PostgREST can
       * therefore resolve the relationship incorrectly.
       *
       * Customers are loaded separately below using users.user_id.
       */
      const {
        data: rawOrders,
        error: ordersError,
      } = await supabase
        .from('orders')
        .select(`
          order_id,
          customer_id,
          fuel_type_id,
          volume_litres,
          delivery_type,
          scheduled_date_time,
          status,
          placed_at,
          address_id,
          addresses (
            unit_number,
            street_number,
            street_name,
            suburb,
            city,
            latitude,
            longitude
          ),
          fuel_types (
            name
          ),
          payments (
            fuel_subtotal,
            delivery_fee,
            service_fee,
            vat_amount,
            total_amount
          )
        `)
        .eq('status', 'PAID')
        .is('driver_id', null)
        .order('placed_at', { ascending: false });

      if (ordersError) {
        console.error(
          'AvailableOrdersScreen: orders query failed',
          ordersError
        );
        throw ordersError;
      }

      console.log(
        'AvailableOrdersScreen: raw orders count',
        rawOrders?.length ?? 0
      );

      const typedOrders = (rawOrders ?? []) as RawOrder[];

      /*
       * Get all unique customer IDs from the returned orders.
       */
      const customerIds = [
        ...new Set(
          typedOrders
            .map(order => order.customer_id)
            .filter(
              (customerId): customerId is string =>
                typeof customerId === 'string' &&
                customerId.trim().length > 0
            )
        ),
      ];

      let customers: Customer[] = [];

      /*
       * Fetch customer names directly from public.users.
       */
      if (customerIds.length > 0) {
        const {
          data: customerData,
          error: customersError,
        } = await supabase
          .from('users')
          .select('user_id, full_name')
          .in('user_id', customerIds);

        if (customersError) {
          console.error(
            'AvailableOrdersScreen: customer query failed',
            customersError
          );
          throw customersError;
        }

        customers = (customerData ?? []) as Customer[];
      }

      const customerMap = new Map<string, string>(
        customers.map(customer => [
          customer.user_id,
          customer.full_name ?? 'Customer',
        ])
      );

      /*
       * Apply the driver-specific availability rules:
       *
       * Deliver Now:
       *   Must have been placed today.
       *
       * Scheduled:
       *   Scheduled datetime must still be in the future.
       *
       * Anything else:
       *   Hidden from Available Orders.
       */
      const filteredOrders = typedOrders.filter(order => {
        const deliveryType = (order.delivery_type ?? '').toUpperCase();

        if (deliveryType === 'DELIVER NOW') {
          return isSameLocalDay(order.placed_at);
        }

        if (deliveryType === 'SCHEDULED') {
          return isScheduledStillValid(order.scheduled_date_time);
        }

        /*
         * Also support underscore/compact values if the database uses
         * values such as DELIVER_NOW.
         */
        if (deliveryType === 'DELIVER_NOW') {
          return isSameLocalDay(order.placed_at);
        }

        return false;
      });

      console.log(
        'AvailableOrdersScreen: filtered order count',
        filteredOrders.length
      );

      const mappedOrders: AvailableOrder[] = filteredOrders.map(order => {
        const address = getRelationObject(order.addresses);
        const fuelType = getRelationObject(order.fuel_types);
        const payment = getRelationObject(order.payments);

        const {
          distance,
          eta,
        } = calculateDistanceAndEta(
          address?.latitude,
          address?.longitude
        );

        const deliveryType =
          (order.delivery_type ?? '').toUpperCase() === 'DELIVER_NOW'
            ? 'Deliver Now'
            : order.delivery_type ?? 'Unknown';

        return {
          orderId: order.order_id,
          customerId: order.customer_id,
          customerName:
            customerMap.get(order.customer_id) ?? 'Customer',
          address: formatAddress(address),
          fuelType: fuelType?.name ?? 'Fuel',
          volumeLitres: Number(order.volume_litres ?? 0),
          deliveryType,
          scheduledDateTime: order.scheduled_date_time,
          placedAt: order.placed_at,
          latitude: address?.latitude,
          longitude: address?.longitude,
          distance,
          eta,
          fuelSubtotal: Number(payment?.fuel_subtotal ?? 0),
          deliveryFee: Number(payment?.delivery_fee ?? 0),
          serviceFee: Number(payment?.service_fee ?? 0),
          vatAmount: Number(payment?.vat_amount ?? 0),
          totalAmount: Number(payment?.total_amount ?? 0),
        };
      });

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
    }, [loadAvailableOrders])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAvailableOrders();
  };

  const handleOrderPress = (order: AvailableOrder) => {
    navigation.navigate('DriverOrderDetails', {
      order,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading available orders...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          orders.length === 0 && styles.emptyScrollContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Available Orders</Text>
          <Text style={styles.subtitle}>
            Paid orders waiting for a driver
          </Text>
        </View>

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No available orders
            </Text>

            <Text style={styles.emptyText}>
              There are currently no paid orders available for delivery.
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              activeOpacity={0.8}
            >
              <Text style={styles.refreshButtonText}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map(order => (
            <TouchableOpacity
              key={order.orderId}
              style={styles.orderCard}
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.customerSection}>
                  <Text style={styles.customerName}>
                    {order.customerName}
                  </Text>

                  <Text style={styles.deliveryType}>
                    {order.deliveryType}
                  </Text>
                </View>

                <Text style={styles.totalAmount}>
                  {formatCurrency(order.totalAmount)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fuel</Text>
                <Text style={styles.detailValue}>
                  {order.fuelType}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Volume</Text>
                <Text style={styles.detailValue}>
                  {order.volumeLitres.toFixed(2)} L
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text
                  style={[
                    styles.detailValue,
                    styles.addressValue,
                  ]}
                >
                  {order.address}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>
                  {order.distance}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ETA</Text>
                <Text style={styles.detailValue}>
                  {order.eta}
                </Text>
              </View>

              {order.deliveryType === 'Scheduled' &&
                order.scheduledDateTime && (
                  <View style={styles.scheduledBox}>
                    <Text style={styles.scheduledLabel}>
                      Scheduled for
                    </Text>

                    <Text style={styles.scheduledValue}>
                      {new Date(
                        order.scheduledDateTime
                      ).toLocaleString()}
                    </Text>
                  </View>
                )}

              <View style={styles.priceSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Fuel Subtotal
                  </Text>

                  <Text style={styles.priceValue}>
                    {formatCurrency(order.fuelSubtotal)}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Delivery Fee
                  </Text>

                  <Text style={styles.priceValue}>
                    {formatCurrency(order.deliveryFee)}
                  </Text>
                </View>

                {order.serviceFee > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      Service Fee
                    </Text>

                    <Text style={styles.priceValue}>
                      {formatCurrency(order.serviceFee)}
                    </Text>
                  </View>
                )}

                {order.vatAmount > 0 && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>
                      VAT
                    </Text>

                    <Text style={styles.priceValue}>
                      {formatCurrency(order.vatAmount)}
                    </Text>
                  </View>
                )}

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalValue}>
                    {formatCurrency(order.totalAmount)}
                  </Text>
                </View>
              </View>

              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>
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

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
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
    justifyContent: 'space-between',
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