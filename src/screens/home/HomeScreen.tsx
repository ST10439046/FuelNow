import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Shadow, Colors } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getCurrentRates, FuelRate, MOCK_USER } from '../../services/mockApi';

const { width: W } = Dimensions.get('window');

interface Props { navigation: any }

// Mock map background colours
const MAP_COLORS = {
  road: '#FFFFFF',
  land: '#F5F5F0',
  water: '#BACDD8',
  block: '#E8E8E0',
  park: '#E0EAE2',
};

function MockMap({ isWireframe }: { isWireframe: boolean }) {
  if (isWireframe) {
    return (
      <View style={[styles.map, { backgroundColor: '#D8D8D8' }]}>
        <View style={[styles.wireframeMapLabel]}>
          <Text style={{ color: '#888', fontSize: FontSizes.sm }}>[ Map View ]</Text>
        </View>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: `${p * 100}%`, width: '100%', height: 1 }]} />
        ))}
        {[0.25, 0.5, 0.75].map((p, i) => (
          <View key={`v${i}`} style={[styles.gridLine, { left: `${p * 100}%`, height: '100%', width: 1 }]} />
        ))}
      </View>
    );
  }
  return (
    <View style={[styles.map, { backgroundColor: MAP_COLORS.land }]}>
      {/* ── Grid Roads ─────────────────────────────────────────────────── */}
      {/* Horizontal Roads */}
      <View style={[styles.road, { top: 65, left: 0, right: 0, height: 10, backgroundColor: MAP_COLORS.road }]} />
      <View style={[styles.road, { top: 125, left: 0, right: 0, height: 10, backgroundColor: MAP_COLORS.road }]} />
      {/* Vertical Roads */}
      <View style={[styles.road, { left: 120, top: 0, bottom: 0, width: 10, backgroundColor: MAP_COLORS.road }]} />
      <View style={[styles.road, { left: 255, top: 0, bottom: 0, width: 10, backgroundColor: MAP_COLORS.road }]} />

      {/* ── Top Row Blocks (top < 65) ──────────────────────────────────── */}
      <View style={[styles.mapBlock, { top: 15, left: 15, width: 90, height: 35, backgroundColor: MAP_COLORS.block }]} />
      <View style={[styles.mapBlock, { top: 15, left: 145, width: 95, height: 35, backgroundColor: MAP_COLORS.block }]} />
      <View style={[styles.mapBlock, { top: 15, left: 280, width: 85, height: 35, backgroundColor: MAP_COLORS.block }]} />

      {/* ── Middle Row Blocks (65 < top < 125) ─────────────────────────── */}
      <View style={[styles.mapBlock, { top: 85, left: 15, width: 90, height: 30, backgroundColor: MAP_COLORS.block }]} />
      <View style={[styles.mapBlock, { top: 85, left: 145, width: 95, height: 30, backgroundColor: MAP_COLORS.block }]} />
      <View style={[styles.mapBlock, { top: 85, left: 280, width: 85, height: 30, backgroundColor: MAP_COLORS.park, borderRadius: 6 }]} />

      {/* ── Bottom Row Blocks (top > 125) ────────────────────────────────── */}
      <View style={[styles.mapBlock, { top: 145, left: 15, width: 90, height: 45, backgroundColor: MAP_COLORS.block }]} />
      <View style={[styles.mapBlock, { top: 145, left: 145, width: 95, height: 45, backgroundColor: MAP_COLORS.park, borderRadius: 8 }]} />

      {/* Water body (Bottom Right Corner) */}
      <View style={[styles.waterBlob, { bottom: -10, right: -10, width: 100, height: 75, backgroundColor: MAP_COLORS.water }]} />

      {/* Street labels aligned on the road surfaces */}
      <Text style={{ position: 'absolute', top: 66, left: 10, fontSize: 8, color: '#A0A090', fontWeight: 'bold' }}>
        KENNETH KAUNDA RD
      </Text>
      <Text style={{ position: 'absolute', top: 126, left: 10, fontSize: 8, color: '#A0A090', fontWeight: 'bold' }}>
        BROADWAY / M4
      </Text>

      {/* User Location Orange Pin/Dot (Centered in Kenneth Kaunda Road intersection) */}
      <View style={[styles.pin, { top: 60, left: 115 }]}>
        <View style={[styles.pinDot, { backgroundColor: '#F97316' }]} />
        <View style={[styles.pinRing, { borderColor: '#F97316' }]} />
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const isWF = isWireframe;
  const [rates, setRates] = useState<FuelRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const tickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const data = await getCurrentRates();
        setRates(data);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 30000);
    return () => clearInterval(interval);
  }, []);

  // Ticker animation
  useEffect(() => {
    if (rates.length === 0) return;
    const anim = Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -W * 1.2,
        duration: 18000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rates]);

  const tickerContent = rates
    .map((r) => `${r.type}  R${r.pricePerLitre.toFixed(2)}/L  ${r.trend === 'up' ? '▲' : r.trend === 'down' ? '▼' : '—'}${Math.abs(r.change)}c`)
    .join('     •     ');

  const RECENT_ORDER = {
    id: 'ord_7821',
    type: 'Petrol 95',
    litres: 40,
    address: '18 Kenneth Kaunda Rd, Durban North',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#D8D8D8' : colors.warmAsh }]} edges={['top']}>
      {/* Map area */}
      <View style={styles.mapContainer}>
        <MockMap isWireframe={isWF} />

        {/* Top bar overlay */}
        <View style={styles.topBar}>
          <View
            style={[
              styles.locationChip,
              {
                backgroundColor: isWF ? '#FFFFFF' : colors.white,
                borderRadius: isWF ? Radius.sm : Radius.full,
                ...(!isWF ? Shadow.sm : { borderWidth: 1, borderColor: '#CCC' }),
              },
            ]}
          >
            <Feather name="map-pin" size={14} color={isWF ? '#555' : colors.ignitionAmber} />
            <Text
              style={[
                styles.locationText,
                {
                  color: isWF ? '#333' : colors.charcoalInk,
                  fontFamily: font('bodyMedium'),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              18 Kenneth Kaunda Rd, Durban North
            </Text>
            <Feather name="chevron-down" size={14} color={isWF ? '#555' : colors.inkLight} />
          </View>

          <TouchableOpacity
            style={[
              styles.notifBtn,
              {
                backgroundColor: isWF ? '#FFFFFF' : colors.white,
                ...(!isWF ? Shadow.sm : { borderWidth: 1, borderColor: '#CCC' }),
                borderRadius: isWF ? Radius.sm : Radius.full,
              },
            ]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Feather name="bell" size={20} color={isWF ? '#333' : colors.charcoalInk} />
            {/* Unread dot */}
            <View style={[styles.unreadDot, { backgroundColor: isWF ? '#888' : colors.signalRed }]} />
          </TouchableOpacity>
        </View>


      </View>

      {/* Bottom sheet */}
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        >
          {/* Greeting */}
          <View style={styles.greetingRow}>
            <View>
              <Text
                style={[
                  styles.greeting,
                  {
                    color: isWF ? '#666' : colors.inkLight,
                    fontFamily: font('body'),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Good afternoon 👋
              </Text>
              <Text
                style={[
                  styles.userName,
                  {
                    color: isWF ? '#1A1A1A' : colors.charcoalInk,
                    fontFamily: font('displayBold'),
                    fontSize: FontSizes.xl,
                  },
                ]}
              >
                {MOCK_USER.name.split(' ')[0]}
              </Text>
            </View>
            {!isWF && (
              <View style={[styles.loyaltyBadge, { backgroundColor: colors.amberLight }]}>
                <Feather name="award" size={14} color={colors.ignitionAmber} />
                <Text style={[styles.loyaltyText, { color: colors.amberDark, fontFamily: font('bodyMedium'), fontSize: FontSizes.xs }]}>
                  340 pts
                </Text>
              </View>
            )}
          </View>

          {/* Order Fuel CTA */}
          <TouchableOpacity
            style={[
              styles.orderCta,
              {
                backgroundColor: isWF ? '#4A4A4A' : colors.petrolDeep,
                borderRadius: isWF ? Radius.sm : Radius.xl,
                ...(!isWF ? Shadow.lg : {}),
              },
            ]}
            onPress={() => navigation.navigate('FuelSelection')}
            activeOpacity={0.88}
          >
            {!isWF && (
              <LinearGradient
                colors={[colors.petrolDeep, colors.petrolMid]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={styles.ctaInner}>
              <View>
                <Text
                  style={[
                    styles.ctaLabel,
                    { color: isWF ? '#CCC' : colors.ignitionAmber, fontFamily: font('body'), fontSize: FontSizes.sm },
                  ]}
                >
                  Ready to fill up?
                </Text>
                <Text
                  style={[
                    styles.ctaTitle,
                    { color: '#FFFFFF', fontFamily: font('displayBold'), fontSize: FontSizes.xl },
                  ]}
                >
                  Order Fuel
                </Text>
                <Text
                  style={[
                    styles.ctaSub,
                    { color: isWF ? '#BBB' : 'rgba(255,255,255,0.65)', fontFamily: font('body'), fontSize: FontSizes.xs },
                  ]}
                >
                  Petrol 93/95 · Diesel 50ppm/500ppm
                </Text>
              </View>
              <View
                style={[
                  styles.ctaArrow,
                  { backgroundColor: isWF ? '#666' : colors.ignitionAmber },
                ]}
              >
                <Feather name="arrow-right" size={22} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Fuel prices card */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
              Today's Rates
            </Text>
            <Text style={[styles.sectionSub, { color: isWF ? '#888' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
              Live SAPIA regulated prices
            </Text>
          </View>

          <Card style={styles.ratesCard}>
            {loadingRates ? (
              <ActivityIndicator color={isWF ? '#888' : colors.petrolDeep} />
            ) : (
              rates.map((rate, i) => (
                <View key={rate.type}>
                  <View style={styles.rateRow}>
                    <Text style={[styles.rateName, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
                      {rate.type}
                    </Text>
                    <View style={styles.rateRight}>
                      <Text
                        style={[
                          styles.ratePrice,
                          {
                            color: isWF ? '#1A1A1A' : colors.ignitionAmber,
                            fontFamily: isWF ? undefined : 'Inter_600SemiBold',
                            fontSize: FontSizes.md,
                          },
                        ]}
                      >
                        R{rate.pricePerLitre.toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.changePill,
                          {
                            backgroundColor: rate.trend === 'up'
                              ? (isWF ? '#E0E0E0' : '#FEE2E2')
                              : (isWF ? '#E0E0E0' : colors.greenLight),
                          },
                        ]}
                      >
                        <Feather
                          name={rate.trend === 'up' ? 'trending-up' : 'trending-down'}
                          size={11}
                          color={
                            isWF
                              ? '#666'
                              : rate.trend === 'up'
                              ? colors.signalRed
                              : colors.dieselGreen
                          }
                        />
                        <Text
                          style={[
                            styles.changeText,
                            {
                              color: isWF ? '#666' : rate.trend === 'up' ? colors.signalRed : colors.dieselGreen,
                              fontFamily: isWF ? undefined : 'Inter_400Regular',
                              fontSize: FontSizes.xs,
                            },
                          ]}
                        >
                          {rate.change > 0 ? '+' : ''}{rate.change}c
                        </Text>
                      </View>
                    </View>
                  </View>
                  {i < rates.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: isWF ? '#DDDDDD' : colors.divider }]} />
                  )}
                </View>
              ))
            )}
          </Card>

          {/* Reorder shortcut */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
              Reorder Quickly
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('FuelSelection', { reorder: RECENT_ORDER })}
            activeOpacity={0.85}
          >
            <Card style={styles.reorderCard}>
              <View style={styles.reorderInner}>
                {!isWF && (
                  <View style={[styles.reorderIcon, { backgroundColor: colors.petrolLight }]}>
                    <Text style={{ fontSize: 22 }}>⛽</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reorderType, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                    {RECENT_ORDER.litres}L {RECENT_ORDER.type}
                  </Text>
                  <Text style={[styles.reorderAddr, { color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                    {RECENT_ORDER.address}
                  </Text>
                </View>
                <View style={[styles.reorderBtn, { backgroundColor: isWF ? '#D0D0D0' : colors.ignitionAmber }]}>
                  <Feather name="refresh-cw" size={16} color={isWF ? '#333' : '#FFFFFF'} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard} padded={false}>
              <LinearGradient
                colors={isWF ? ['#E0E0E0', '#D0D0D0'] : [colors.petrolDeep, colors.petrolMid]}
                style={styles.statGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.statValue, { color: isWF ? '#333' : '#FFFFFF', fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes.xl }]}>
                  3
                </Text>
                <Text style={[styles.statLabel, { color: isWF ? '#555' : 'rgba(255,255,255,0.75)', fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  Orders this month
                </Text>
              </LinearGradient>
            </Card>
            <Card style={styles.statCard} padded={false}>
              <LinearGradient
                colors={isWF ? ['#E0E0E0', '#D0D0D0'] : [colors.ignitionAmber, colors.amberDark]}
                style={styles.statGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[styles.statValue, { color: isWF ? '#333' : '#FFFFFF', fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes.xl }]}>
                  125L
                </Text>
                <Text style={[styles.statLabel, { color: isWF ? '#555' : 'rgba(255,255,255,0.75)', fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  Total delivered
                </Text>
              </LinearGradient>
            </Card>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapContainer: { height: 260, position: 'relative' },
  map: { flex: 1, position: 'relative', overflow: 'hidden' },
  wireframeMapLabel: { position: 'absolute', top: '50%', left: '50%', marginTop: -20, marginLeft: -40 },
  gridLine: { position: 'absolute', backgroundColor: '#BBBBBB' },
  mapBlock: { position: 'absolute', borderRadius: 4 },
  road: { position: 'absolute', backgroundColor: '#DDDAD4' },
  waterBlob: { width: 80, height: 50, borderRadius: 25, backgroundColor: '#C8E0EC' },
  pin: { position: 'absolute', alignItems: 'center' },
  pinDot: { width: 16, height: 16, borderRadius: 8, zIndex: 2 },
  pinRing: { position: 'absolute', width: 32, height: 32, borderRadius: 16, borderWidth: 2, opacity: 0.3, top: -8, left: -8 },
  truckMarker: { position: 'absolute' },
  topBar: {
    position: 'absolute', top: Spacing.md, left: Spacing.base, right: Spacing.base,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  locationChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, flex: 1, marginRight: Spacing.sm,
  },
  locationText: { flex: 1 },
  notifBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  ticker: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
    justifyContent: 'center', overflow: 'hidden',
  },
  tickerText: { paddingLeft: W, fontSize: FontSizes.xs, letterSpacing: 0.5 },
  sheet: { flex: 1, paddingHorizontal: Spacing.base, paddingTop: Spacing.lg },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: {},
  userName: {},
  loyaltyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: Radius.full },
  loyaltyText: {},
  orderCta: { overflow: 'hidden', marginBottom: Spacing.xl },
  ctaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.xl },
  ctaLabel: {},
  ctaTitle: {},
  ctaSub: { marginTop: 4 },
  ctaArrow: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle: {},
  sectionSub: {},
  ratesCard: { marginBottom: Spacing.xl },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rateName: {},
  rateRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratePrice: {},
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  changeText: {},
  divider: { height: 1, marginVertical: 2 },
  reorderCard: { marginBottom: Spacing.xl },
  reorderInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  reorderIcon: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  reorderType: {},
  reorderAddr: { marginTop: 2 },
  reorderBtn: { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, overflow: 'hidden' },
  statGrad: { padding: Spacing.base, borderRadius: Radius.lg, gap: 4 },
  statValue: {},
  statLabel: {},
});
