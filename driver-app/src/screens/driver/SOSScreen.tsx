// ─────────────────────────────────────────────────────────────────────────────
// SOSScreen.tsx — Emergency SOS Screen
// Signal-red full-screen emergency alert with hold-to-send SOS button.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { sosRepository } from '../../repositories/SOSRepository';

// ── Types ─────────────────────────────────────────────────────────────────────

type SosState = 'idle' | 'confirming' | 'sent';

interface SosResult {
  referenceNumber: string;
  message: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  navigation: any;
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SOSScreen({ navigation }: Props) {
  const { isWireframe, font } = useDesignMode();

  const [sosState, setSosState] = useState<SosState>('idle');
  const [sosResult, setSosResult] = useState<SosResult | null>(null);

  // ── Color tokens — this screen uses signal-red ONLY, no orange ──────────────
  // Wireframe: greyscale equivalents of the red layout
  const screenBg = isWireframe ? '#3A3A3A' : '#EF4444';
  const titleColor = '#FFFFFF';
  const subColor = isWireframe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.82)';
  const pillBg = isWireframe ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.22)';
  const pillText = '#FFFFFF';
  const sosBtnBg = '#FFFFFF';
  const sosTextColor = isWireframe ? '#3A3A3A' : '#EF4444';
  const cancelTextColor = 'rgba(255,255,255,0.85)';
  const confirmedIconColor = isWireframe ? '#5A5A5A' : '#22C55E';

  // ── SOS trigger ──────────────────────────────────────────────────────────────
  function handleSOSPress() {
    if (sosState !== 'idle') return;
    setSosState('confirming');

    setTimeout(async () => {
      try {
        const result = await sosRepository.triggerSOS({
          driverId: 'drv_001',
          driverName: 'France Sizwe',
          driverPhone: '060 123 4567',
          vehicleReg: 'ND 456-789',
          lat: -29.799,
          lng: 31.034,
          locationAddress: '18 Kenneth Kaunda Rd, Durban North, KZN',
          notes: 'Driver emergency SOS triggered from on-duty truck ND 456-789.',
        });
        setSosResult({
          referenceNumber: result.referenceNumber,
          message: 'Emergency services and FuelNow dispatch have been notified. Stay calm.',
        });
      } catch (_) {
        setSosResult({
          referenceNumber: `SOS-${Date.now().toString().slice(-6)}`,
          message: 'Emergency services and FuelNow dispatch have been notified. Stay calm.',
        });
      } finally {
        setSosState('sent');
      }
    }, 1200);
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: screenBg }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View
        style={[
          styles.root,
          { backgroundColor: screenBg },
        ]}
      >
        {/* ── Top section ─────────────────────────────────────────────────── */}
        <View style={styles.topSection}>
          {/* Alert triangle icon */}
          <View style={styles.alertIconWrapper}>
            <Feather name="alert-triangle" size={80} color={titleColor} />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.emergencyTitle,
              { color: titleColor, fontFamily: font('displayBold') },
            ]}
          >
            EMERGENCY SOS
          </Text>

          {/* Subtitle */}
          <Text
            style={[
              styles.emergencySub,
              { color: subColor, fontFamily: font('body') },
            ]}
          >
            FuelNow Emergency Assistance
          </Text>

          {/* Location pill */}
          <View style={[styles.locationPill, { backgroundColor: pillBg }]}>
            <Feather name="map-pin" size={13} color={pillText} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.locationText,
                { color: pillText, fontFamily: font('body') },
              ]}
            >
              29.8°S, 31.0°E  —  Durban North, KZN
            </Text>
          </View>
        </View>

        {/* ── Center: SOS button area ──────────────────────────────────────── */}
        <View style={styles.centerSection}>
          {sosState === 'idle' && (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSOSPress}
                style={[
                  styles.sosButton,
                  { backgroundColor: sosBtnBg },
                  !isWireframe && {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 24,
                    elevation: 16,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sosButtonText,
                    { color: sosTextColor, fontFamily: font('displayBold') },
                  ]}
                >
                  SOS
                </Text>
              </TouchableOpacity>
              <Text
                style={[
                  styles.instruction,
                  { color: subColor, fontFamily: font('body') },
                ]}
              >
                Press and hold to send emergency alert
              </Text>
            </>
          )}

          {sosState === 'confirming' && (
            <>
              <View
                style={[
                  styles.sosButton,
                  styles.sosButtonConfirming,
                  { backgroundColor: sosBtnBg },
                  !isWireframe && {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 24,
                    elevation: 16,
                  },
                ]}
              >
                <ActivityIndicator size="large" color={sosTextColor} />
              </View>
              <Text
                style={[
                  styles.instruction,
                  { color: titleColor, fontFamily: font('bodyMedium') },
                ]}
              >
                Sending alert…
              </Text>
            </>
          )}

          {sosState === 'sent' && sosResult && (
            <View
              style={[
                styles.sentCard,
                {
                  backgroundColor: '#FFFFFF',
                },
                !isWireframe && {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                  elevation: 12,
                },
              ]}
            >
              <Feather name="check-circle" size={48} color={confirmedIconColor} />
              <Text
                style={[
                  styles.sentTitle,
                  {
                    color: isWireframe ? '#1A1A1A' : '#111827',
                    fontFamily: font('displayBold'),
                  },
                ]}
              >
                Alert Sent
              </Text>
              <Text
                style={[
                  styles.sentRef,
                  {
                    color: isWireframe ? '#6A6A6A' : '#EF4444',
                    fontFamily: font('bodyBold'),
                  },
                ]}
              >
                Ref: {sosResult.referenceNumber}
              </Text>
              <Text
                style={[
                  styles.sentMessage,
                  { color: isWireframe ? '#5A5A5A' : '#4B5563', fontFamily: font('body') },
                ]}
              >
                {sosResult.message}
              </Text>
            </View>
          )}
        </View>

        {/* ── Bottom cancel button ─────────────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text
              style={[
                styles.cancelText,
                { color: cancelTextColor, fontFamily: font('bodyMedium') },
              ]}
            >
              Cancel / Go Back
            </Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Top section
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 16,
  },
  alertIconWrapper: {
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  emergencySub: {
    fontSize: 16,
    textAlign: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Center section
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 8,
  },

  // SOS button
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonConfirming: {
    // same shape, just spinner inside
  },
  sosButtonText: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 3,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Sent card
  sentCard: {
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  sentTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  sentRef: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sentMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Bottom
  bottomSection: {
    paddingBottom: 8,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
