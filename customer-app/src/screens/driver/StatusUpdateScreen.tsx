import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Shadow } from '../../theme/tokens';

interface Props {
  navigation: any;
  route: any;
}

// ── Step configuration ────────────────────────────────────────────────────────
const STEPS = ['En Route', 'Arrived', 'Dispensing', 'Completed'];

const STEP_CONTENT: Array<{ title: string; description: string; icon: string }> = [
  {
    title: 'En Route to Customer',
    icon: 'truck',
    description:
      'You are on your way to the delivery location. Follow navigation and notify the customer of your ETA.',
  },
  {
    title: 'You Have Arrived',
    icon: 'map-pin',
    description:
      'Let the customer know you are at the location. Begin dispensing when ready.',
  },
  {
    title: 'Dispensing Fuel',
    icon: 'droplet',
    description:
      'Dispensing is in progress. Ensure the correct fuel type and quantity are being delivered safely.',
  },
  {
    title: 'Delivery Completed',
    icon: 'check-circle',
    description:
      'The delivery has been completed successfully. Collect the customer PIN to finalise the order.',
  },
];

const NEXT_STEP_LABELS = ['Mark as Arrived', 'Start Dispensing', 'Complete Delivery', 'Finalise'];

export default function StatusUpdateScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const order = route?.params?.order ?? { id: 'ord_7821' };

  const [currentStep, setCurrentStep] = useState(1); // Start at "Arrived" since driver just arrived
  const [loading, setLoading] = useState(false);

  const content = STEP_CONTENT[currentStep];

  const handleAdvance = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (currentStep === 3) {
        navigation.navigate('ProofOfDelivery', { order });
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }, 600);
  };

  // ── Stepper ─────────────────────────────────────────────────────────────────
  const renderStepper = () => (
    <View style={styles.stepperRow}>
      {STEPS.map((label, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;
        const isFuture = idx > currentStep;

        const circleColor = isDone || isCurrent
          ? (isWireframe ? '#4A4A4A' : '#F97316')
          : (isWireframe ? '#CCCCCC' : colors.divider);

        const textColor = isDone || isCurrent
          ? (isWireframe ? '#FFFFFF' : '#FFFFFF')
          : (isWireframe ? '#888888' : colors.inkFaint);

        return (
          <React.Fragment key={idx}>
            {/* Connecting line before this step */}
            {idx > 0 && (
              <View
                style={[
                  styles.connectorLine,
                  {
                    backgroundColor:
                      idx <= currentStep
                        ? (isWireframe ? '#4A4A4A' : '#F97316')
                        : (isWireframe ? '#CCCCCC' : colors.divider),
                  },
                ]}
              />
            )}

            {/* Step circle */}
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: circleColor }]}>
                {isDone ? (
                  <Feather name="check" size={12} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNum, { color: textColor, fontFamily: font('bodyBold') }]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isFuture ? colors.inkFaint : colors.charcoalInk,
                    fontFamily: isCurrent ? font('bodyBold') : font('body'),
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.warmAsh }]} edges={['top', 'bottom']}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.ashDark }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.charcoalInk} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { fontFamily: font('displayBold'), color: colors.charcoalInk }]}>
            Delivery Status
          </Text>
          <Text style={[styles.headerSub, { fontFamily: font('body'), color: colors.inkFaint }]}>
            #{order?.id ?? 'ord_7821'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {/* Stepper */}
        <View style={[styles.stepperCard, { backgroundColor: colors.white, ...Shadow.sm }]}>
          {renderStepper()}
        </View>

        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.white, ...Shadow.sm }]}>
          <View style={[styles.infoIconCircle, { backgroundColor: colors.petrolLight }]}>
            <Feather name={content.icon as any} size={24} color={colors.petrolDeep} />
          </View>
          <Text style={[styles.infoTitle, { fontFamily: font('displayBold'), color: colors.charcoalInk }]}>
            {content.title}
          </Text>
          <Text style={[styles.infoDesc, { fontFamily: font('body'), color: colors.inkLight }]}>
            {content.description}
          </Text>
        </View>

        {/* Order summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.white, ...Shadow.sm }]}>
          <View style={styles.summaryRow}>
            <Feather name="droplet" size={14} color={colors.petrolDeep} />
            <Text style={[styles.summaryText, { fontFamily: font('bodyMedium'), color: colors.charcoalInk }]}>
              {'  '}Petrol 95 · 50 L
            </Text>
            <Text style={[styles.summaryPrice, { fontFamily: font('bodyBold'), color: colors.petrolDeep }]}>
              R 1,221.50
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryRow}>
            <Feather name="map-pin" size={14} color={colors.inkFaint} />
            <Text style={[styles.summaryText, { fontFamily: font('body'), color: colors.inkLight }]}>
              {'  '}8 Windermere Road, Morningside
            </Text>
          </View>
        </View>
      </View>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.ctaButton,
            { backgroundColor: currentStep === 3 ? colors.dieselGreen : colors.petrolDeep },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleAdvance}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={[styles.ctaText, { fontFamily: font('bodyBold') }]}>
                {NEXT_STEP_LABELS[currentStep]}
              </Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
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
  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
  },
  headerSub: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  // ── Body ───────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    gap: Spacing.md,
  },
  // ── Stepper ────────────────────────────────────────────────────────────────
  stepperCard: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    width: 58,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: FontSizes.xs,
  },
  stepLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginTop: 13,
    marginHorizontal: 2,
  },
  // ── Info card ──────────────────────────────────────────────────────────────
  infoCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  infoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  // ── Summary card ───────────────────────────────────────────────────────────
  summaryCard: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: FontSizes.sm,
  },
  summaryPrice: {
    fontSize: FontSizes.sm,
  },
  summaryDivider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    minHeight: 52,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },
});
