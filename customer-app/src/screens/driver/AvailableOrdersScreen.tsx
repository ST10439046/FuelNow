// ─────────────────────────────────────────────────────────────────────────────
// AvailableOrdersScreen.tsx — Driver 'Orders' tab (main screen)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Shadow } from '../../theme/tokens';
import { getAvailableOrders, AvailableOrder } from '../../services/mockApi';

interface Props { navigation: any; }

// ── Vector map (same visual language as customer app) ─────────────────────────
function VectorMap({ orders, isWireframe, colors }: {
  orders: AvailableOrder[];
  isWireframe: boolean;
  colors: any;
}) {
  // 3 fixed pin positions for the 3 available order locations
  const pins = [
    { x: '55%', y: '30%', isDiesel: false },
    { x: '20%', y: '58%', isDiesel: true  },
    { x: '72%', y: '62%', isDiesel: false },
  ];

  if (isWireframe) {
    return (
      <View style={[styles.map, { backgroundColor: '#D8D8D8', borderWidth: 1.5, borderColor: '#BBBBBB' }]}>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 70, fontSize: 13 }}>
          [ Available Orders Map ]
        </Text>
        {pins.map((p, i) => (
          <View key={i} style={{
            position: 'absolute', left: p.x as any, top: p.y as any,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: '#888', alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: '#FFF',
            transform: [{ translateX: -9 }, { translateY: -9 }],
          }}>
            <Text style={{ color: '#FFF', fontSize: 8 }}>{i + 1}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.map, { backgroundColor: '#F0EBE3', overflow: 'hidden' }]}>
      {/* City blocks */}
      <View style={[styles.block, { top: 8,   left: 16,   width: 70, height: 36 }]} />
      <View style={[styles.block, { top: 8,   right: 24,  width: 55, height: 44 }]} />
      <View style={[styles.block, { top: 60,  left: 8,    width: 44, height: 28 }]} />
      <View style={[styles.block, { top: 60,  left: 68,   width: 60, height: 32 }]} />
      <View style={[styles.block, { top: 60,  right: 16,  width: 52, height: 36 }]} />
      <View style={[styles.block, { top: 108, left: 20,   width: 80, height: 38 }]} />
      <View style={[styles.block, { top: 108, right: 30,  width: 60, height: 40 }]} />
      <View style={[styles.block, { top: 108, left: 120,  width: 48, height: 38 }]} />
      {/* Parks */}
      <View style={[styles.park, { top: 16,  left: 100, width: 40, height: 28 }]} />
      <View style={[styles.park, { top: 90,  right: 90, width: 30, height: 22 }]} />
      {/* Water */}
      <View style={[styles.water, { bottom: 0, left: 0, right: 0, height: 22 }]} />
      {/* Roads (horizontal) */}
      <View style={[styles.road, { top: 52,  left: 0, right: 0, height: 10 }]} />
      <View style={[styles.road, { top: 100, left: 0, right: 0, height: 10 }]} />
      {/* Roads (vertical) */}
      <View style={[styles.roadV, { top: 0, left: '33%' as any, bottom: 0, width: 10 }]} />
      <View style={[styles.roadV, { top: 0, right: '25%' as any, bottom: 0, width: 10 }]} />
      {/* Driver dot */}
      <View style={[styles.driverDot, { top: 80, left: '32%' as any }]}>
        <Feather name="truck" size={10} color="#FFF" />
      </View>
      {/* Order pins */}
      {pins.map((p, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: p.x as any,
          top: p.y as any,
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: p.isDiesel ? '#2563EB' : '#F97316',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#FFFFFF',
          transform: [{ translateX: -11 }, { translateY: -11 }],
        }}>
          <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800' }}>{i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Single order card ─────────────────────────────────────────────────────────
function OrderCard({ order, onPress, isWireframe, colors, font }: {
  order: AvailableOrder;
  onPress: () => void;
  isWireframe: boolean;
  colors: any;
  font: any;
}) {
  const isDiesel = order.fuelType.startsWith('Diesel');
  const dotColor  = isWireframe ? '#888' : (isDiesel ? '#2563EB' : '#F97316');
  const dotBg     = isWireframe ? '#E0E0E0' : (isDiesel ? '#DBEAFE' : '#FFEDD5');
  const fmt = (n: number) =>
    'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[styles.orderCard, {
        backgroundColor: isWireframe ? '#FFFFFF' : colors.white,
        borderRadius: isWireframe ? Radius.sm : Radius.lg,
        borderWidth: isWireframe ? 1.5 : 0,
        borderColor: '#CCCCCC',
        ...(isWireframe ? {} : Shadow.sm),
      }]}
    >
      {/* Left: fuel type indicator */}
      <View style={[styles.fuelDotContainer, { backgroundColor: dotBg }]}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotColor }} />
        <Text style={{ fontSize: 8, color: dotColor, fontWeight: '700', marginTop: 2 }}>
          {isDiesel ? 'DSL' : 'PET'}
        </Text>
      </View>

      {/* Center: order info */}
      <View style={{ flex: 1 }}>
        <Text style={[{ color: isWireframe ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
          {order.fuelType} · {order.litres}L
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 3 }}>
          <View style={[styles.initialsTag, { backgroundColor: isWireframe ? '#D0D0D0' : colors.petrolLight }]}>
            <Text style={[{ color: isWireframe ? '#555' : colors.petrolDeep, fontFamily: font('bodySemiBold'), fontSize: 9 }]}>
              {order.customerInitials}
            </Text>
          </View>
          <Text style={[{ color: isWireframe ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, flex: 1 }]} numberOfLines={1}>
            {order.address}, {order.suburb}
          </Text>
        </View>
        <View style={[styles.etaChip, { backgroundColor: isWireframe ? '#EBEBEB' : colors.warmAsh, marginTop: 5 }]}>
          <Feather name="map-pin" size={10} color={isWireframe ? '#888' : colors.inkLight} />
          <Text style={[{ color: isWireframe ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
            {order.distanceKm} km · {order.estimatedMinutes} min ETA
          </Text>
        </View>
      </View>

      {/* Right: price + chevron */}
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.sm }}>
        <Text style={[{ color: isWireframe ? '#1A1A1A' : colors.petrolDeep, fontFamily: font('displayBold'), fontSize: FontSizes.base }]}>
          {fmt(order.totalZAR)}
        </Text>
        <View style={[styles.viewChevron, { backgroundColor: isWireframe ? '#E0E0E0' : colors.petrolLight }]}>
          <Feather name="chevron-right" size={14} color={isWireframe ? '#555' : colors.petrolDeep} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AvailableOrdersScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const [orders, setOrders]   = useState<AvailableOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getAvailableOrders();
      setOrders(data);
    } catch (_) {
      setOrders([]);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleRefresh = () => { setRefreshing(true); loadOrders(); };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isWireframe ? '#F0F0F0' : colors.warmAsh }]}
      edges={['top']}
    >
      {/* ── Header bar ── */}
      <View style={[styles.headerBar, {
        backgroundColor: isWireframe ? '#FFFFFF' : colors.white,
        borderBottomWidth: isWireframe ? 1.5 : 1,
        borderBottomColor: isWireframe ? '#CCCCCC' : colors.divider,
      }]}>
        <View>
          <Text style={[{ color: isWireframe ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes.lg }]}>
            Available Orders
          </Text>
          <Text style={[{ color: isWireframe ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm, marginTop: 1 }]}>
            France Sizwe
          </Text>
        </View>
        <View style={[styles.onlinePill, { backgroundColor: isWireframe ? '#E0E0E0' : '#F0FDF4', borderColor: isWireframe ? '#CCCCCC' : '#BBF7D0', borderWidth: 1 }]}>
          <View style={[styles.greenDot, { backgroundColor: isWireframe ? '#888' : '#22C55E' }]} />
          <Text style={[{ color: isWireframe ? '#555' : '#16A34A', fontFamily: font('bodySemiBold'), fontSize: FontSizes.sm }]}>
            Online
          </Text>
        </View>
      </View>

      {/* ── Mini map ── */}
      <VectorMap orders={orders} isWireframe={isWireframe} colors={colors} />

      {/* ── Orders list ── */}
      <View style={{ flex: 1 }}>
        <Text style={[{
          color: isWireframe ? '#1A1A1A' : colors.charcoalInk,
          fontFamily: font('bodySemiBold'), fontSize: FontSizes.sm,
          marginHorizontal: Spacing.base,
          marginTop: Spacing.md, marginBottom: Spacing.sm,
        }]}>
          Orders Near You
        </Text>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            orders.length === 0 && !initialLoading && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isWireframe ? '#888' : colors.petrolDeep}
              colors={[colors.petrolDeep]}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              isWireframe={isWireframe}
              colors={colors}
              font={font}
              onPress={() => navigation.navigate('DriverOrderDetails', { order: item })}
            />
          )}
          ListEmptyComponent={
            !initialLoading ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: isWireframe ? '#E0E0E0' : colors.petrolLight }]}>
                  <Feather name="inbox" size={32} color={isWireframe ? '#888' : colors.petrolDeep} />
                </View>
                <Text style={[{ color: isWireframe ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                  No orders nearby
                </Text>
                <Text style={[{ color: isWireframe ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm, textAlign: 'center' }]}>
                  Pull down to refresh or wait for new orders
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4 },

  // Map
  map: { height: 180, position: 'relative' },
  block: { position: 'absolute', backgroundColor: '#E8E8E0', borderRadius: 4 },
  park:  { position: 'absolute', backgroundColor: '#E0EAE2', borderRadius: 4 },
  water: { position: 'absolute', backgroundColor: '#BACDD8' },
  road:  { position: 'absolute', backgroundColor: '#FFFFFF' },
  roadV: { position: 'absolute', backgroundColor: '#FFFFFF' },
  driverDot: {
    position: 'absolute', width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },

  // Order cards
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['2xl'], gap: Spacing.md },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  orderCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  fuelDotContainer: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  initialsTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  etaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.sm, alignSelf: 'flex-start',
  },
  viewChevron: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, paddingVertical: Spacing['4xl'] },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
});
