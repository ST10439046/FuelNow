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

// ── Vector-style mock map colours ─────────────────────────────────────────────
const MAP = {
  land: '#F5F5F0',
  road: '#FFFFFF',
  block: '#E8E8E0',
  park: '#E0EAE2',
  water: '#BACDD8',
};

function MockMap({ isWireframe }: { isWireframe: boolean }) {
  if (isWireframe) {
    return (
      <View style={[styles.map, { backgroundColor: '#D8D8D8' }]}>
        {[0.3, 0.6].map((p, i) => (
          <View key={`h${i}`} style={[styles.gridLine, { top: `${p * 100}%` as any, width: '100%', height: 1 }]} />
        ))}
        {[0.33, 0.66].map((p, i) => (
          <View key={`v${i}`} style={[styles.gridLine, { left: `${p * 100}%` as any, height: '100%', width: 1 }]} />
        ))}
        <View style={styles.wireframeMapLabel}>
          <Text style={{ color: '#888', fontSize: FontSizes.sm }}>[ Map View ]</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.map, { backgroundColor: MAP.land }]}>
      {/* ── Horizontal Roads ─────────────────────────────────────────────── */}
      <View style={[styles.road, { top: 65, left: 0, right: 0, height: 10, backgroundColor: MAP.road }]} />
      <View style={[styles.road, { top: 125, left: 0, right: 0, height: 10, backgroundColor: MAP.road }]} />

      {/* ── Vertical Roads ───────────────────────────────────────────────── */}
      <View style={[styles.road, { left: 120, top: 0, bottom: 0, width: 10, backgroundColor: MAP.road }]} />
      <View style={[styles.road, { left: 255, top: 0, bottom: 0, width: 10, backgroundColor: MAP.road }]} />

      {/* ── Detailed City Blocks & Houses ─────────────────────────────────── */}
      {/* Top Left Quadrant */}
      <View style={[styles.block, { top: 10, left: 10, width: 44, height: 20 }]} />
      <View style={[styles.block, { top: 10, left: 60, width: 48, height: 20 }]} />
      <View style={[styles.block, { top: 36, left: 10, width: 28, height: 18 }]} />
      <View style={[styles.block, { top: 36, left: 44, width: 64, height: 18 }]} />

      {/* Top Middle Quadrant */}
      <View style={[styles.block, { top: 10, left: 140, width: 40, height: 44 }]} />
      <View style={[styles.block, { top: 10, left: 188, width: 50, height: 18 }]} />
      <View style={[styles.block, { top: 34, left: 188, width: 22, height: 20 }]} />
      <View style={[styles.block, { top: 34, left: 216, width: 22, height: 20 }]} />

      {/* Top Right Quadrant */}
      <View style={[styles.block, { top: 10, left: 275, width: 35, height: 20 }]} />
      <View style={[styles.block, { top: 10, left: 318, width: 50, height: 20 }]} />
      <View style={[styles.block, { top: 36, left: 275, width: 50, height: 18 }]} />
      <View style={[styles.block, { top: 36, left: 333, width: 35, height: 18 }]} />

      {/* Middle Left Quadrant */}
      <View style={[styles.block, { top: 85, left: 10, width: 30, height: 30 }]} />
      <View style={[styles.block, { top: 85, left: 48, width: 30, height: 30 }]} />
      <View style={[styles.block, { top: 85, left: 86, width: 22, height: 30 }]} />

      {/* Middle Middle Quadrant */}
      <View style={[styles.block, { top: 85, left: 140, width: 45, height: 30 }]} />
      <View style={[styles.block, { top: 85, left: 193, width: 45, height: 30 }]} />

      {/* Middle Right Quadrant */}
      <View style={[styles.block, { top: 85, left: 275, width: 40, height: 30 }]} />
      <View style={[styles.block, { top: 85, left: 323, width: 45, height: 30 }]} />

      {/* Bottom Left Quadrant */}
      <View style={[styles.block, { top: 145, left: 10, width: 44, height: 26 }]} />
      <View style={[styles.block, { top: 145, left: 60, width: 48, height: 26 }]} />
      <View style={[styles.block, { top: 178, left: 10, width: 98, height: 22 }]} />
      <View style={[styles.block, { top: 208, left: 10, width: 44, height: 30 }]} />
      <View style={[styles.block, { top: 208, left: 60, width: 48, height: 30 }]} />

      {/* Bottom Middle Quadrant */}
      <View style={[styles.block, { top: 145, left: 140, width: 65, height: 30 }]} />
      <View style={[styles.block, { top: 183, left: 140, width: 30, height: 25 }]} />
      <View style={[styles.block, { top: 183, left: 178, width: 27, height: 25 }]} />
      <View style={[styles.block, { top: 216, left: 140, width: 65, height: 30 }]} />

      {/* Bottom Right Quadrant */}
      <View style={[styles.block, { top: 145, left: 275, width: 45, height: 35 }]} />
      <View style={[styles.block, { top: 145, left: 328, width: 40, height: 35 }]} />
      <View style={[styles.block, { top: 188, left: 275, width: 93, height: 20 }]} />

      {/* ── Park ─────────────────────────────────────────────────────────── */}
      <View style={[styles.park, { top: 148, left: 220, width: 28, height: 45 }]} />

      {/* ── Water blob — bottom-right ─────────────────────────────────────── */}
      <View style={styles.waterBlob} />

      {/* ── Street labels ─────────────────────────────────────────────────── */}
      <Text style={[styles.streetLabel, { top: 50, left: 148 }]}>KENNETH KAUNDA RD</Text>
      <Text style={[styles.streetLabel, { top: 110, left: 148 }]}>BROADWAY / M4</Text>

      {/* ── Orange dashed route line (Horizontal & Vertical segments on grid) ── */}
      {/* Horizontal segment along Kenneth Kaunda Road */}
      <View style={[styles.routeLine, { top: 69, left: 125, width: 135, height: 2, borderStyle: 'dashed', borderWidth: 2, borderColor: '#F97316' }]} />
      {/* Vertical segment along M4 */}
      <View style={[styles.routeLine, { top: 69, left: 259, width: 2, height: 75, borderStyle: 'dashed', borderWidth: 2, borderColor: '#F97316' }]} />

      {/* ── Driver pulsing ring + dot (At first major intersection) ── */}
      <View style={[styles.driverRing, { top: 54, left: 109 }]} />
      <View style={[styles.driverDot, { top: 62, left: 117 }]} />

      {/* ── Destination pin (In bottom right block/surface) ────────────────── */}
      <View style={[styles.pinContainer, { top: 135, left: 280 }]}>
        <View style={styles.pinCircle}>
          <Feather name="map-pin" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.pinTriangle} />
      </View>
    </View>
  );
}

export default function ActiveNavigationScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const order = route?.params?.order ?? null;

  return (
    <View style={[styles.container, { backgroundColor: colors.warmAsh }]}>
      {/* ── Full-height map ──────────────────────────────────────────────── */}
      <MockMap isWireframe={isWireframe} />

      {/* ── Floating top bar ─────────────────────────────────────────────── */}
      <SafeAreaView style={styles.topBarSafe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.topBarButton, Shadow.sm, { backgroundColor: colors.white }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color={colors.charcoalInk} />
          </TouchableOpacity>

          <View style={[styles.topBarLabel, Shadow.sm, { backgroundColor: colors.white }]}>
            <Feather name="navigation" size={14} color={colors.petrolDeep} style={{ marginRight: 6 }} />
            <Text style={[styles.topBarText, { fontFamily: font('bodySemiBold'), color: colors.charcoalInk }]}>
              Navigating to Delivery
            </Text>
          </View>

          {/* Spacer to balance layout */}
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {/* ── Bottom sheet ─────────────────────────────────────────────────── */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.white }]}>
        <View style={[styles.dragHandle, { backgroundColor: colors.divider }]} />

        {/* ETA row */}
        <View style={styles.etaRow}>
          <View style={styles.etaLeft}>
            <Text style={[styles.etaTime, { fontFamily: font('displayBold'), color: colors.petrolDeep }]}>
              12 min
            </Text>
            <Text style={[styles.etaUnit, { fontFamily: font('body'), color: colors.inkLight }]}>
              {' '}away
            </Text>
          </View>
          <View style={[styles.etaBadge, { backgroundColor: colors.petrolLight }]}>
            <Feather name="map-pin" size={12} color={colors.petrolDeep} />
            <Text style={[styles.etaBadgeText, { fontFamily: font('bodyMedium'), color: colors.petrolDeep }]}>
              {'  '}Morningside
            </Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Feather name="navigation-2" size={14} color={colors.inkFaint} />
          <Text style={[styles.addressText, { fontFamily: font('body'), color: colors.inkLight }]}>
            {'  '}8 Windermere Road, Morningside
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Arrived CTA */}
        <TouchableOpacity
          style={[styles.arrivedButton, { backgroundColor: colors.petrolDeep }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('DriverStatusUpdate', { order })}
        >
          <Feather name="check-circle" size={18} color="#FFFFFF" />
          <Text style={[styles.arrivedButtonText, { fontFamily: font('bodyBold') }]}>
            {'  '}I Have Arrived
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
  },
  // ── Map ──────────────────────────────────────────────────────────────────
  map: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
  },
  block: {
    position: 'absolute',
    backgroundColor: '#E8E8E0',
    borderRadius: 3,
  },
  park: {
    position: 'absolute',
    backgroundColor: '#E0EAE2',
    borderRadius: 6,
  },
  waterBlob: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 120,
    height: 100,
    backgroundColor: '#BACDD8',
    borderRadius: 60,
  },
  streetLabel: {
    position: 'absolute',
    fontSize: 8,
    color: '#A0A090',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  routeLine: {
    position: 'absolute',
    top: 68,
    left: 125,
    width: 100,
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  driverRing: {
    position: 'absolute',
    top: 60,
    left: 110,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F97316',
    opacity: 0.3,
    backgroundColor: 'transparent',
  },
  driverDot: {
    position: 'absolute',
    top: 68,
    left: 118,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  pinContainer: {
    position: 'absolute',
    top: 85,
    left: 220,
    alignItems: 'center',
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  pinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F97316',
    marginTop: -1,
  },
  // ── Wireframe placeholders ────────────────────────────────────────────────
  gridLine: {
    position: 'absolute',
    backgroundColor: '#BBBBBB',
  },
  wireframeMapLabel: {
    position: 'absolute',
    top: '45%' as any,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // ── Top bar ───────────────────────────────────────────────────────────────
  topBarSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  topBarText: {
    fontSize: FontSizes.sm,
  },
  // ── Bottom sheet ──────────────────────────────────────────────────────────
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing['3xl'],
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  etaLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  etaTime: {
    fontSize: FontSizes['2xl'],
  },
  etaUnit: {
    fontSize: FontSizes.base,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  etaBadgeText: {
    fontSize: FontSizes.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  addressText: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.base,
  },
  arrivedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
  },
  arrivedButtonText: {
    color: '#FFFFFF',
    fontSize: FontSizes.base,
  },
});
