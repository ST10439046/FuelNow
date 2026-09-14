// ─────────────────────────────────────────────────────────────────────────────
// EarningsScreen.tsx — Driver Earnings Tab
// Shows today's earnings gauge, summary stats, and delivery history.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import FuelGaugeArc from '../../components/FuelGaugeArc';
import { driverRepository, DriverEarnings, DriverEarningsEntry } from '../../repositories/DriverRepository';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a ZAR amount: R 1,234.56 */
function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format an ISO date string relative to today */
function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeStr = date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (entryDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (entryDay.getTime() === yesterday.getTime()) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  isWireframe: boolean;
  colors: ReturnType<typeof useDesignMode>['colors'];
  font: ReturnType<typeof useDesignMode>['font'];
}

function StatCard({ label, value, isWireframe, colors, font }: StatCardProps) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: colors.cardBg,
          borderColor: colors.divider,
          borderWidth: isWireframe ? 1.5 : 0,
        },
        !isWireframe && {
          shadowColor: '#111827',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <Text
        style={[
          styles.statValue,
          { color: colors.charcoalInk, fontFamily: font('displayBold') },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { color: colors.inkLight, fontFamily: font('body') },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

interface DeliveryRowProps {
  entry: DriverEarningsEntry;
  isWireframe: boolean;
  colors: ReturnType<typeof useDesignMode>['colors'];
  font: ReturnType<typeof useDesignMode>['font'];
}

function DeliveryRow({ entry, isWireframe, colors, font }: DeliveryRowProps) {
  const orangeColor = isWireframe ? colors.inkLight : '#F97316';
  const iconBg = isWireframe ? colors.ashDark : '#FFEDD5';

  return (
    <View style={[styles.deliveryRow, { backgroundColor: colors.cardBg }]}>
      {/* Left: truck icon */}
      <View style={[styles.deliveryIconCircle, { backgroundColor: iconBg }]}>
        <Feather name="truck" size={18} color={orangeColor} />
      </View>

      {/* Center: order info */}
      <View style={styles.deliveryCenter}>
        <Text
          style={[
            styles.deliveryOrderId,
            { color: colors.charcoalInk, fontFamily: font('bodyBold') },
          ]}
        >
          #{entry.id}
        </Text>
        <Text
          style={[
            styles.deliveryAddress,
            { color: colors.inkLight, fontFamily: font('body') },
          ]}
          numberOfLines={1}
        >
          {entry.address}
        </Text>
        <Text
          style={[
            styles.deliveryDate,
            { color: colors.inkFaint, fontFamily: font('body') },
          ]}
        >
          {formatRelativeDate(entry.date)}  ·  {entry.litres}L {entry.fuelType}
        </Text>
      </View>

      {/* Right: amount + badge */}
      <View style={styles.deliveryRight}>
        <Text
          style={[
            styles.deliveryAmount,
            { color: orangeColor, fontFamily: font('displayBold') },
          ]}
        >
          {formatZAR(entry.amount)}
        </Text>
        <View
          style={[
            styles.completedBadge,
            { backgroundColor: isWireframe ? colors.ashDark : '#DCFCE7' },
          ]}
        >
          <Text
            style={[
              styles.completedBadgeText,
              {
                color: isWireframe ? colors.inkLight : '#16A34A',
                fontFamily: font('bodyMedium'),
              },
            ]}
          >
            completed
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

interface Props {
  navigation: any;
}

export default function EarningsScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();

  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await driverRepository.getEarnings();
        setEarnings(data);
      } catch (_) {
        // silently fall back — mock data always succeeds
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const orangeColor = isWireframe ? colors.charcoalInk : '#F97316';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.warmAsh }]}
      edges={['top', 'left', 'right']}
    >
      <View
        style={[
          styles.root,
          { backgroundColor: colors.warmAsh },
        ]}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.divider }]}>
          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.charcoalInk, fontFamily: font('displayBold') },
              ]}
            >
              Earnings
            </Text>
            <Text
              style={[
                styles.headerSub,
                { color: colors.inkLight, fontFamily: font('body') },
              ]}
            >
              France Sizwe
            </Text>
          </View>
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: isWireframe ? colors.ashDark : '#FFEDD5',
                borderWidth: isWireframe ? 1.5 : 0,
                borderColor: colors.divider,
              },
            ]}
          >
            <Text
              style={[
                styles.avatarInitials,
                { color: orangeColor, fontFamily: font('displayBold') },
              ]}
            >
              FS
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isWireframe ? colors.inkLight : '#F97316'}
            />
            <Text
              style={[
                styles.loadingText,
                { color: colors.inkLight, fontFamily: font('body') },
              ]}
            >
              Loading earnings…
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Today's Gauge ─────────────────────────────────────────── */}
            <View
              style={[
                styles.gaugeCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.divider,
                  borderWidth: isWireframe ? 1.5 : 0,
                },
                !isWireframe && {
                  shadowColor: '#111827',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.09,
                  shadowRadius: 16,
                  elevation: 5,
                },
              ]}
            >
              <Text
                style={[
                  styles.gaugeCardTitle,
                  { color: colors.inkLight, fontFamily: font('bodyMedium') },
                ]}
              >
                Today's Earnings
              </Text>

              <View style={styles.gaugeCenter}>
                <FuelGaugeArc
                  value={892.5}
                  max={1500}
                  label="Today"
                  size={220}
                  color={isWireframe ? undefined : '#F97316'}
                />
              </View>

              {/* Big orange amount below the gauge */}
              <Text
                style={[
                  styles.gaugeAmount,
                  { color: orangeColor, fontFamily: font('displayBold') },
                ]}
              >
                R 892.50
              </Text>
              <Text
                style={[
                  styles.gaugeTarget,
                  { color: colors.inkLight, fontFamily: font('body') },
                ]}
              >
                of R 1,500 daily target
              </Text>
            </View>

            {/* ── Stats Row ─────────────────────────────────────────────── */}
            <View style={styles.statsRow}>
              <StatCard
                label="This Week"
                value="R 4,310"
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />
              <StatCard
                label="This Month"
                value="R 16,840"
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />
              <StatCard
                label="All Time Trips"
                value="1,247"
                isWireframe={isWireframe}
                colors={colors}
                font={font}
              />
            </View>

            {/* ── Delivery History ──────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.charcoalInk, fontFamily: font('displayBold') },
                ]}
              >
                Delivery History
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text
                  style={[
                    styles.seeAll,
                    { color: orangeColor, fontFamily: font('bodyMedium') },
                  ]}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.historyCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.divider,
                  borderWidth: isWireframe ? 1.5 : 0,
                },
                !isWireframe && {
                  shadowColor: '#111827',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07,
                  shadowRadius: 10,
                  elevation: 3,
                },
              ]}
            >
              {(earnings?.deliveryHistory ?? []).slice(0, 5).map((entry, idx, arr) => (
                <View
                  key={entry.id}
                  style={
                    idx < arr.length - 1
                      ? {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.divider,
                        }
                      : undefined
                  }
                >
                  <DeliveryRow
                    entry={entry}
                    isWireframe={isWireframe}
                    colors={colors}
                    font={font}
                  />
                </View>
              ))}
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 15, fontWeight: '700' },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Gauge card
  gaugeCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  gaugeCardTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gaugeCenter: { alignItems: 'center' },
  gaugeAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  gaugeTarget: { fontSize: 13, marginTop: 4 },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '500' },

  // History card
  historyCard: { borderRadius: 16, overflow: 'hidden' },

  // Delivery row
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  deliveryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  deliveryCenter: { flex: 1, gap: 2 },
  deliveryOrderId: { fontSize: 13, fontWeight: '700' },
  deliveryAddress: { fontSize: 12 },
  deliveryDate: { fontSize: 11, marginTop: 1 },
  deliveryRight: { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  deliveryAmount: { fontSize: 13, fontWeight: '700' },
  completedBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  completedBadgeText: { fontSize: 10, fontWeight: '500' },
});
