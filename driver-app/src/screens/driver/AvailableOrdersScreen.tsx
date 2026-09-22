import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../services/supabase';
import { useDesignMode } from '../../context/DesignModeContext';

export interface AvailableOrder {
  // Database fields
  order_id: string;
  customer_id: string | null;
  driver_id: string | null;
  address_id: string | null;
  fuel_type_id: string | null;
  volume_litres: number | null;
  rand_amount: number | null;
  delivery_type: string | null;
  scheduled_date_time: string | null;
  status: string | null;
  placed_at: string | null;

  // Display fields
  fuel_type_name: string;
  address: string;
  suburb: string;

  // Legacy fields expected by OrderDetailsScreen
  id: string;
  customerInitials: string;
  fuelType: string;
  litres: number;
  totalZAR: number;
  distanceKm: number;
  estimatedMinutes: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface RawOrder {
  order_id: string;
  customer_id: string | null;
  driver_id: string | null;
  address_id: string | null;
  fuel_type_id: string | null;
  volume_litres: number | null;
  rand_amount: number | null;
  delivery_type: string | null;
  scheduled_date_time: string | null;
  status: string | null;
  placed_at: string | null;
  fuel_types:
    | {
        name: string | null;
      }
    | {
        name: string | null;
      }[]
    | null;
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
}

function getFirstRelation<T>(
  relation: T | T[] | null | undefined
): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function isSameCalendarDay(date: Date, reference: Date): boolean {
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

function isOrderAvailable(order: RawOrder, now: Date): boolean {
  if (String(order.status ?? '').toUpperCase() !== 'PAID') {
    return false;
  }

  if (order.driver_id) {
    return false;
  }

  const deliveryType = String(order.delivery_type ?? '')
    .trim()
    .toLowerCase();

  const isDeliverNow =
    deliveryType === 'deliver now' ||
    deliveryType === 'now' ||
    deliveryType === 'immediate';

  if (isDeliverNow) {
    if (!order.placed_at) {
      return false;
    }

    const placedAt = new Date(order.placed_at);

    if (Number.isNaN(placedAt.getTime())) {
      return false;
    }

    return isSameCalendarDay(placedAt, now);
  }

  if (deliveryType === 'scheduled') {
    if (!order.scheduled_date_time) {
      return false;
    }

    const scheduledAt = new Date(order.scheduled_date_time);

    if (Number.isNaN(scheduledAt.getTime())) {
      return false;
    }

    return scheduledAt.getTime() >= now.getTime();
  }

  return false;
}

function formatDeliveryTime(order: AvailableOrder): string {
  const deliveryType = String(order.delivery_type ?? '')
    .trim()
    .toLowerCase();

  if (
    deliveryType === 'deliver now' ||
    deliveryType === 'now' ||
    deliveryType === 'immediate'
  ) {
    return 'Deliver Now';
  }

  if (deliveryType === 'scheduled' && order.scheduled_date_time) {
    const date = new Date(order.scheduled_date_time);

    if (!Number.isNaN(date.getTime())) {
      return `Scheduled: ${date.toLocaleDateString()} ${date.toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      )}`;
    }
  }

  return 'Delivery';
}

function formatAddress(order: RawOrder): string {
  const address = getFirstRelation(order.addresses);

  if (!address) {
    return 'Address unavailable';
  }

  const parts = [
    address.unit_number,
    address.street_number,
    address.street_name,
    address.suburb,
    address.city,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address unavailable';
}

function mapOrder(order: RawOrder): AvailableOrder {
  const fuelType = getFirstRelation(order.fuel_types);
  const address = getFirstRelation(order.addresses);

  const addressParts = [
    address?.unit_number,
    address?.street_number,
    address?.street_name,
  ].filter(Boolean);

  const formattedAddress =
    addressParts.length > 0
      ? addressParts.join(', ')
      : 'Address unavailable';

  const suburb = address?.suburb ?? '';

  /*
   * The current Available Orders query does not fetch the customer's
   * name, because the database relationship points to a customers
   * table that does not contain full_name.
   *
   * Use a neutral fallback until customer information is retrieved
   * through the correct relationship.
   */
  const customerInitials = 'C';

  return {
    // Database fields
    order_id: order.order_id,
    customer_id: order.customer_id,
    driver_id: order.driver_id,
    address_id: order.address_id,
    fuel_type_id: order.fuel_type_id,
    volume_litres: order.volume_litres,
    rand_amount: order.rand_amount,
    delivery_type: order.delivery_type,
    scheduled_date_time: order.scheduled_date_time,
    status: order.status,
    placed_at: order.placed_at,

    // Display fields
    fuel_type_name: fuelType?.name ?? 'Fuel',
    address: formatAddress(order),
    suburb,

    // Legacy fields used by OrderDetailsScreen
    id: order.order_id,
    customerInitials,
    fuelType: fuelType?.name ?? 'Fuel',
    litres: Number(order.volume_litres ?? 0),
    totalZAR: Number(order.rand_amount ?? 0),

    /*
     * These remain 0 until we connect the driver's current location
     * to the order destination and calculate a real route/ETA.
     */
    distanceKm: 0,
    estimatedMinutes: 0,

    coordinates: {
      lat: address?.latitude ?? 0,
      lng: address?.longitude ?? 0,
    },
  };
}

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const { mode } = useDesignMode();

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isWireframe = mode === 'WIREFRAME';

  const fetchAvailableOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_id,
          customer_id,
          driver_id,
          address_id,
          fuel_type_id,
          volume_litres,
          rand_amount,
          delivery_type,
          scheduled_date_time,
          status,
          placed_at,
          fuel_types (
            name
          ),
          addresses (
            unit_number,
            street_number,
            street_name,
            suburb,
            city,
            latitude,
            longitude
          )
        `)
        .eq('status', 'PAID')
        .is('driver_id', null)
        .order('placed_at', { ascending: false });

      if (error) {
        console.error(
          'AvailableOrdersScreen: failed to fetch available orders',
          error
        );
        setOrders([]);
        return;
      }

      const now = new Date();

      const availableOrders = ((data ?? []) as RawOrder[])
        .filter((order) => isOrderAvailable(order, now))
        .map(mapOrder);

      setOrders(availableOrders);
    } catch (error) {
      console.error(
        'AvailableOrdersScreen: unexpected error while fetching orders',
        error
      );

      setOrders([]);
    }
  }, []);

  useEffect(() => {
    fetchAvailableOrders().finally(() => {
      setLoading(false);
    });
  }, [fetchAvailableOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchAvailableOrders();
    } finally {
      setRefreshing(false);
    }
  }, [fetchAvailableOrders]);

  const handleOrderPress = (order: AvailableOrder) => {
    navigation.navigate('DriverOrderDetails', {
      orderId: order.order_id,
      order,
    });
  };

  const renderOrder = ({ item }: { item: AvailableOrder }) => {
    const amount = Number(item.rand_amount ?? 0);
    const litres = Number(item.volume_litres ?? 0);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isWireframe && styles.wireframeCard,
        ]}
        activeOpacity={0.8}
        onPress={() => handleOrderPress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderIdContainer}>
            <Text
              style={[
                styles.orderLabel,
                isWireframe && styles.wireframeText,
              ]}
            >
              ORDER
            </Text>

            <Text
              style={[
                styles.orderId,
                isWireframe && styles.wireframeText,
              ]}
              numberOfLines={1}
            >
              #{item.order_id.slice(0, 8).toUpperCase()}
            </Text>
          </View>

          <View style={styles.paidBadge}>
            <Text style={styles.paidText}>PAID</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailBlock}>
            <Text
              style={[
                styles.detailLabel,
                isWireframe && styles.wireframeText,
              ]}
            >
              FUEL
            </Text>

            <Text
              style={[
                styles.detailValue,
                isWireframe && styles.wireframeText,
              ]}
            >
              {item.fuel_type_name}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text
              style={[
                styles.detailLabel,
                isWireframe && styles.wireframeText,
              ]}
            >
              VOLUME
            </Text>

            <Text
              style={[
                styles.detailValue,
                isWireframe && styles.wireframeText,
              ]}
            >
              {litres.toFixed(0)} L
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text
              style={[
                styles.detailLabel,
                isWireframe && styles.wireframeText,
              ]}
            >
              VALUE
            </Text>

            <Text
              style={[
                styles.detailValue,
                isWireframe && styles.wireframeText,
              ]}
            >
              R{amount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.deliveryContainer}>
          <Text
            style={[
              styles.detailLabel,
              isWireframe && styles.wireframeText,
            ]}
          >
            DELIVERY
          </Text>

          <Text
            style={[
              styles.deliveryValue,
              isWireframe && styles.wireframeText,
            ]}
          >
            {formatDeliveryTime(item)}
          </Text>
        </View>

        <View style={styles.addressContainer}>
          <Text
            style={[
              styles.detailLabel,
              isWireframe && styles.wireframeText,
            ]}
          >
            DELIVERY ADDRESS
          </Text>

          <Text
            style={[
              styles.addressText,
              isWireframe && styles.wireframeText,
            ]}
            numberOfLines={2}
          >
            {item.address}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Text
            style={[
              styles.viewText,
              isWireframe && styles.wireframeText,
            ]}
          >
            View Order
          </Text>

          <Text
            style={[
              styles.arrow,
              isWireframe && styles.wireframeText,
            ]}
          >
            →
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.centered,
          isWireframe && styles.wireframeBackground,
        ]}
      >
        <ActivityIndicator size="large" />

        <Text
          style={[
            styles.loadingText,
            isWireframe && styles.wireframeText,
          ]}
        >
          Loading available orders...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isWireframe && styles.wireframeBackground,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.title,
              isWireframe && styles.wireframeText,
            ]}
          >
            Available Orders
          </Text>

          <Text
            style={[
              styles.subtitle,
              isWireframe && styles.wireframeText,
            ]}
          >
            Paid orders ready for delivery
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.order_id}
        renderItem={renderOrder}
        contentContainerStyle={[
          styles.listContent,
          orders.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyTitle,
                isWireframe && styles.wireframeText,
              ]}
            >
              No available orders
            </Text>

            <Text
              style={[
                styles.emptyText,
                isWireframe && styles.wireframeText,
              ]}
            >
              Paid orders that are available for delivery will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#F7F8FA',
  },

  wireframeBackground: {
    backgroundColor: '#FFFFFF',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666666',
  },

  countBadge: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },

  countText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  listContent: {
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  card: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  wireframeCard: {
    borderWidth: 1,
    borderColor: '#111111',
    shadowOpacity: 0,
    elevation: 0,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  orderIdContainer: {
    flex: 1,
  },

  orderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#777777',
  },

  orderId: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },

  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#DFF5E5',
  },

  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#237A3B',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDDDDD',
    marginVertical: 16,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  detailBlock: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#777777',
  },

  detailValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  deliveryContainer: {
    marginTop: 18,
  },

  deliveryValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  addressContainer: {
    marginTop: 18,
  },

  addressText: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 18,
  },

  viewText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  arrow: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F7F8FA',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#555555',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111111',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#666666',
  },

  wireframeText: {
    color: '#111111',
  },
});