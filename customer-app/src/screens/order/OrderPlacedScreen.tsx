import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import { driverRepository } from '../../repositories/DriverRepository';

interface Props { navigation: any; route?: any }

// ── Progress step definition ──────────────────────────────────────────────────
const STEPS = [
  { icon: 'check-circle' as const, label: 'Order confirmed', color: '#22C55E' },
  { icon: 'user' as const, label: 'Driver assigned', color: '#F97316' },
  { icon: 'truck' as const, label: 'Driver en route', color: '#F97316' },
  { icon: 'package' as const, label: 'Fuel delivered', color: '#9CA3AF' },
];

// ── Animated truck that moves across the screen ───────────────────────────────
function MovingTruck({ color }: { color: string }) {
  const pos = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pos, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(pos, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={{
      transform: [{
        translateX: pos.interpolate({ inputRange: [0, 1], outputRange: [-20, 240] }),
      }],
    }}>
      <Text style={{ fontSize: 36 }}>🚛</Text>
    </Animated.View>
  );
}



export default function OrderPlacedScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const orderId = route?.params?.orderId ?? 'ord_8821';
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-advance steps every 2 seconds to simulate real-time updates
  useEffect(() => {
    const intervals: ReturnType<typeof setTimeout>[] = [];
    intervals.push(setTimeout(() => setCurrentStep(1), 800));
    intervals.push(setTimeout(() => setCurrentStep(2), 2500));
    return () => intervals.forEach(clearTimeout);
  }, []);

  const bg = isWF ? '#F0F0F0' : colors.warmAsh;
  const accentColor = isWF ? '#4A4A4A' : colors.petrolDeep;
  const headingColor = isWF ? '#1A1A1A' : colors.charcoalInk;
  const subColor = isWF ? '#555' : colors.inkLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Order ID header */}
      <View style={styles.header}>
        <View style={[styles.orderIdBadge, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight, borderRadius: Radius.full }]}>
          <Feather name="hash" size={12} color={isWF ? '#555' : colors.petrolDeep} />
          <Text style={{ color: isWF ? '#333' : colors.petrolDeep, fontFamily: isWF ? undefined : 'Inter_500Medium', fontSize: FontSizes.xs }}>
            {orderId}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* ── Animated driver card ───────────────────────────────────────── */}
        <View style={[styles.driverCard, { backgroundColor: isWF ? '#FFFFFF' : colors.white, borderRadius: isWF ? Radius.sm : Radius.xl, borderColor: isWF ? '#DDD' : colors.divider }]}>
          {/* Moving truck strip */}
          <View style={[styles.truckStrip, { backgroundColor: isWF ? '#F0F0F0' : colors.petrolLight }]}>
            {!isWF && <MovingTruck color={accentColor} />}
            {isWF && <Text style={{ color: '#888', fontSize: FontSizes.sm }}>[ Truck en route animation ]</Text>}
            {/* Road line */}
            {!isWF && <View style={[styles.roadLine, { backgroundColor: colors.petrolDeep }]} />}
          </View>

          {/* Driver info */}
          <View style={styles.driverInfo}>
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.avatar, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolDeep }]}>
                {isWF ? (
                  <Feather name="user" size={24} color="#555" />
                ) : (
                  <Text style={{ fontSize: 28 }}>👤</Text>
                )}
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: headingColor, fontFamily: font('displayBold'), fontSize: FontSizes.lg }}>
                {MOCK_DRIVER.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Feather name="star" size={13} color={isWF ? '#888' : '#FACC15'} />
                <Text style={{ color: subColor, fontFamily: font('body'), fontSize: FontSizes.xs }}>
                  {MOCK_DRIVER.rating} · {MOCK_DRIVER.vehicleColor} {MOCK_DRIVER.vehicleModel}
                </Text>
              </View>
              <Text style={{ color: isWF ? '#888' : colors.inkFaint, fontFamily: isWF ? undefined : 'Inter_400Regular', fontSize: FontSizes.xs, marginTop: 2 }}>
                {MOCK_DRIVER.vehicleReg}
              </Text>
            </View>
            {/* ETA pill */}
            <View style={[styles.etaPill, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolDeep, borderRadius: Radius.full }]}>
              <Feather name="clock" size={11} color={isWF ? '#555' : 'rgba(255,255,255,0.8)'} />
              <Text style={{ color: isWF ? '#333' : '#FFFFFF', fontFamily: isWF ? undefined : 'Inter_700Bold', fontSize: FontSizes.sm }}>
                ~23 min
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status message ─────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ color: headingColor, fontFamily: font('displayBold'), fontSize: FontSizes['2xl'], textAlign: 'center' }}>
            {currentStep >= 2
              ? (isWF ? 'Driver is on the way!' : 'Driver is on the way! 🚛')
              : currentStep >= 1
              ? (isWF ? 'Driver found!' : 'Driver found! 🎉')
              : 'Placing your order…'}
          </Text>
          <Text style={{ color: subColor, fontFamily: font('body'), fontSize: FontSizes.base, textAlign: 'center', maxWidth: 300, lineHeight: 22 }}>
            {currentStep >= 2
              ? `${MOCK_DRIVER.name} is heading to your location with your fuel. Expected in ~23 minutes.`
              : currentStep >= 1
              ? 'We found a driver nearby. They are loading your fuel now.'
              : 'Confirming your order and finding the nearest driver…'}
          </Text>
        </View>

        {/* ── Progress steps ─────────────────────────────────────────────── */}
        <View style={[styles.stepsCard, { backgroundColor: isWF ? '#FFFFFF' : colors.white, borderColor: isWF ? '#DDD' : colors.divider, borderRadius: isWF ? Radius.sm : Radius.lg }]}>
          {STEPS.map((step, i) => {
            const isDone = i <= currentStep;
            const isActive = i === currentStep + 1;
            return (
              <View key={i} style={styles.stepRow}>
                <View style={[
                  styles.stepDot,
                  {
                    backgroundColor: isDone
                      ? (isWF ? '#4A4A4A' : step.color)
                      : isActive
                      ? (isWF ? '#CCCCCC' : '#E2E8F0')
                      : (isWF ? '#E8E8E8' : '#F3F4F6'),
                    borderWidth: isActive ? 2 : 0,
                    borderColor: isWF ? '#888' : colors.petrolDeep,
                  },
                ]}>
                  {isDone && <Feather name="check" size={11} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: isDone
                      ? (isWF ? '#1A1A1A' : colors.charcoalInk)
                      : (isWF ? '#AAAAAA' : colors.inkFaint),
                    fontFamily: font(isDone ? 'bodyMedium' : 'body'),
                    fontSize: FontSizes.sm,
                  }}>
                    {step.label}
                  </Text>
                </View>
                {isDone && i === 0 && (
                  <Text style={{ color: isWF ? '#888' : colors.dieselGreen, fontFamily: font('body'), fontSize: FontSizes.xs }}>✓ Done</Text>
                )}
                {isDone && i === 1 && (
                  <Text style={{ color: isWF ? '#888' : colors.petrolDeep, fontFamily: font('body'), fontSize: FontSizes.xs }}>Sipho</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── CTA buttons ────────────────────────────────────────────────── */}
        <View style={styles.buttons}>
          <Button
            label="Track Live →"
            onPress={() => navigation.navigate('LiveTracking', { orderId })}
            variant="primary"
            size="lg"
          />
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: isWF ? '#AAAAAA' : colors.divider, borderRadius: isWF ? Radius.sm : Radius.lg }]}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Feather name="home" size={16} color={isWF ? '#555' : colors.inkLight} />
            <Text style={{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }}>
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    justifyContent: 'center',
  },
  driverCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  truckStrip: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  roadLine: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  stepsCard: {
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { gap: Spacing.sm },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },
});
