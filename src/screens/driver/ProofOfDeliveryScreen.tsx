import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import { MOCK_DRIVER } from '../../services/mockApi';

interface Props {
  navigation: any;
  route: any;
}

function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export default function ProofOfDeliveryScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const order = route?.params?.order ?? { id: 'ord_7821' };

  const [photoTaken, setPhotoTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [pin, setPin] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [expiredOnce, setExpiredOnce] = useState(false);

  // Generate PIN on mount
  useEffect(() => {
    setPin(generateRandomPin());
  }, []);

  // Timer Countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer expired, generate new PIN
          setPin(generateRandomPin());
          setExpiredOnce(true);
          return 30; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isDisabled = !photoTaken || !expiredOnce || loading;

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('DeliveryComplete', { order });
    }, 600);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.warmAsh }]} edges={['top', 'bottom']}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.ashDark }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: font('displayBold'), color: colors.charcoalInk }]}>
          Proof of Delivery
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Photo capture ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { fontFamily: font('bodyBold'), color: colors.charcoalInk }]}>
          Delivery Photo
        </Text>

        <TouchableOpacity
          style={[
            styles.photoBox,
            {
              borderColor: photoTaken
                ? colors.dieselGreen
                : isWireframe ? '#AAAAAA' : colors.petrolDeep,
              backgroundColor: photoTaken
                ? '#E0EAE2'
                : colors.white,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setPhotoTaken((prev) => !prev)}
        >
          {photoTaken ? (
            <>
              <Feather name="check-circle" size={40} color="#22C55E" />
              <Text style={[styles.photoText, { fontFamily: font('bodyMedium'), color: '#15803D', marginTop: Spacing.sm }]}>
                Photo captured
              </Text>
              <Text style={[styles.photoHint, { fontFamily: font('body'), color: '#16A34A' }]}>
                Tap to retake
              </Text>
            </>
          ) : (
            <>
              <Feather
                name="camera"
                size={40}
                color={isWireframe ? '#888888' : colors.petrolDeep}
              />
              <Text
                style={[
                  styles.photoText,
                  {
                    fontFamily: font('bodyMedium'),
                    color: isWireframe ? '#888888' : colors.petrolDeep,
                    marginTop: Spacing.sm,
                  },
                ]}
              >
                Tap to capture photo
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── PIN verification ──────────────────────────────────────────────── */}
        <Text
          style={[
            styles.sectionLabel,
            { fontFamily: font('bodyBold'), color: colors.charcoalInk, marginTop: Spacing.lg },
          ]}
        >
          Customer PIN Verification
        </Text>
        <Text style={[styles.sectionSub, { fontFamily: font('body'), color: colors.inkLight }]}>
          Show this PIN to the customer. Wait 30 seconds for verification to complete.
        </Text>

        <View style={styles.pinRow}>
          {pin.split('').map((digit, idx) => (
            <View
              key={idx}
              style={[
                styles.pinBox,
                {
                  borderColor: isWireframe ? '#CCCCCC' : colors.divider,
                  backgroundColor: colors.white,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.charcoalInk,
                  fontFamily: font('displayBold'),
                  fontSize: FontSizes['3xl'],
                }}
              >
                {digit}
              </Text>
            </View>
          ))}
        </View>

        {/* Expiry / Refresh Indicator */}
        <View style={styles.timerContainer}>
          <Feather name="clock" size={14} color={colors.inkLight} />
          <Text style={[styles.timerText, { color: colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
            PIN refreshes in <Text style={{ fontFamily: font('bodyBold'), color: colors.signalRed }}>{timeLeft}s</Text>
          </Text>
        </View>

        {/* ── Order reminder ────────────────────────────────────────────────── */}
        <View style={[styles.orderReminder, { backgroundColor: colors.petrolLight, borderRadius: Radius.lg }]}>
          <Feather name="info" size={14} color={colors.petrolDeep} />
          <Text style={[styles.orderReminderText, { fontFamily: font('body'), color: colors.petrolMid }]}>
            {'  '}Order {order?.id} · Petrol 95 · 50 L · R 1,221.50
          </Text>
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>

      {/* ── Footer CTA ──────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { backgroundColor: colors.white, borderTopColor: colors.divider }]}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: isDisabled ? (isWireframe ? '#CCCCCC' : colors.divider) : colors.petrolDeep },
          ]}
          onPress={handleConfirm}
          disabled={isDisabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="shield" size={18} color={isDisabled ? colors.inkFaint : '#FFFFFF'} />
              <Text
                style={[
                  styles.confirmText,
                  {
                    fontFamily: font('bodyBold'),
                    color: isDisabled ? colors.inkFaint : '#FFFFFF',
                  },
                ]}
              >
                {'  '}Confirm Delivery
              </Text>
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.md,
  },
  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  // ── Section labels ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.sm,
  },
  sectionSub: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.base,
    lineHeight: 18,
  },
  // ── Photo box ──────────────────────────────────────────────────────────────
  photoBox: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  photoText: {
    fontSize: FontSizes.base,
  },
  photoHint: {
    fontSize: FontSizes.xs,
    marginTop: 4,
  },
  // ── PIN ────────────────────────────────────────────────────────────────────
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  pinBox: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  timerText: {},
  // ── Order reminder ─────────────────────────────────────────────────────────
  orderReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  orderReminderText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    padding: Spacing.base,
    borderTopWidth: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    minHeight: 52,
  },
  confirmText: {
    fontSize: FontSizes.base,
  },
});
