import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Shadow } from '../../theme/tokens';

interface Props {
  navigation: any;
  route: any;
}

export default function DeliveryCompleteScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe } = useDesignMode();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.warmAsh }]}
      edges={['top', 'bottom']}
    >
      {/* ── Main content — centered ───────────────────────────────────────── */}
      <View style={styles.body}>
        {/* ── Success circle ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.successCircle,
            {
              backgroundColor: isWireframe ? '#6A6A6A' : '#22C55E',
              shadowColor: isWireframe ? '#000' : '#22C55E',
            },
          ]}
        >
          {/* Inner gradient-like overlay for premium look */}
          <View
            style={[
              styles.successInner,
              { backgroundColor: isWireframe ? '#8A8A8A' : '#16A34A' },
            ]}
          />
          <Feather name="check" size={48} color="#FFFFFF" />
        </View>

        {/* ── Title & subtitle ─────────────────────────────────────────────── */}
        <Text style={[styles.title, { fontFamily: font('displayBold'), color: colors.charcoalInk }]}>
          Delivery Complete!
        </Text>
        <Text style={[styles.subtitle, { fontFamily: font('body'), color: colors.inkLight }]}>
          Great work, France! Order ord_7821{'\n'}successfully delivered.
        </Text>

        {/* ── Earnings card ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.earningsCard,
            {
              backgroundColor: isWireframe ? colors.ashDark : colors.petrolLight,
              ...Shadow.sm,
            },
          ]}
        >
          {/* Card header */}
          <View style={styles.earningsHeader}>
            <Feather
              name="trending-up"
              size={16}
              color={isWireframe ? colors.inkLight : colors.petrolDeep}
            />
            <Text
              style={[
                styles.earningsHeaderText,
                { fontFamily: font('bodySemiBold'), color: isWireframe ? colors.inkLight : colors.petrolDeep },
              ]}
            >
              {'  '}Today's Earnings
            </Text>
          </View>

          <View style={[styles.earningsDivider, { backgroundColor: isWireframe ? colors.divider : '#FED7AA' }]} />

          {/* Row: Order Earnings */}
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { fontFamily: font('body'), color: colors.inkLight }]}>
              Order Earnings
            </Text>
            <Text
              style={[
                styles.earningsValue,
                { fontFamily: font('bodyBold'), color: isWireframe ? colors.charcoalInk : colors.petrolDeep },
              ]}
            >
              R 49.00
            </Text>
          </View>

          {/* Row: Total Today */}
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { fontFamily: font('body'), color: colors.inkLight }]}>
              Total Today
            </Text>
            <Text style={[styles.earningsValue, { fontFamily: font('bodyBold'), color: colors.charcoalInk }]}>
              R 892.50
            </Text>
          </View>

          {/* Row: Deliveries */}
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { fontFamily: font('body'), color: colors.inkLight }]}>
              Deliveries Today
            </Text>
            <Text style={[styles.earningsValue, { fontFamily: font('bodyBold'), color: colors.charcoalInk }]}>
              5
            </Text>
          </View>
        </View>

        {/* ── Customer rating ───────────────────────────────────────────────── */}
        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { fontFamily: font('bodyMedium'), color: colors.inkLight }]}>
            Customer Rating
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather
                key={star}
                name="star"
                size={24}
                color={isWireframe ? '#8A8A8A' : '#FACC15'}
                style={{ marginHorizontal: 3 }}
              />
            ))}
          </View>
        </View>
      </View>

      {/* ── Action buttons ───────────────────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.divider }]}>
        {/* Primary: Find Next Order */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.petrolDeep }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DriverTabs')}
        >
          <Feather name="search" size={18} color="#FFFFFF" />
          <Text style={[styles.primaryButtonText, { fontFamily: font('bodyBold') }]}>
            {'  '}Find Next Order
          </Text>
        </TouchableOpacity>

        {/* Secondary: Go to Earnings */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.petrolDeep }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('DriverEarnings')}
        >
          <Feather name="bar-chart-2" size={18} color={colors.petrolDeep} />
          <Text style={[styles.secondaryButtonText, { fontFamily: font('bodyBold'), color: colors.petrolDeep }]}>
            {'  '}Go to Earnings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },
  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  // ── Success circle ─────────────────────────────────────────────────────────
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  successInner: {
    ...(StyleSheet.absoluteFill as any),
    top: '50%',
    borderRadius: 50,
    opacity: 0.5,
  },
  // ── Text ───────────────────────────────────────────────────────────────────
  title: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  // ── Earnings card ──────────────────────────────────────────────────────────
  earningsCard: {
    width: '100%',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  earningsHeaderText: {
    fontSize: FontSizes.sm,
  },
  earningsDivider: {
    height: 1,
    marginBottom: Spacing.sm,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  earningsLabel: {
    fontSize: FontSizes.sm,
  },
  earningsValue: {
    fontSize: FontSizes.sm,
  },
  // ── Rating ─────────────────────────────────────────────────────────────────
  ratingSection: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    minHeight: 52,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: FontSizes.base,
  },
});
