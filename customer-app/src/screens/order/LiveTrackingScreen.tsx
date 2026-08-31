import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Shadow } from '../../theme/tokens';
import Card from '../../components/Card';
import FuelGaugeArc from '../../components/FuelGaugeArc';
import { trackOrder, MOCK_DRIVER } from '../../services/mockApi';

interface Props { navigation: any; route?: any }

// Simple tracking map
function TrackingMap({ isWireframe }: { isWireframe: boolean }) {
  const truckX = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(truckX, { toValue: 120, duration: 3000, useNativeDriver: true }),
        Animated.timing(truckX, { toValue: 30, duration: 3000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  if (isWireframe) {
    return (
      <View style={[styles.map, { backgroundColor: '#D8D8D8' }]}>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 80, fontSize: 13 }}>[ Live Tracking Map ]</Text>
      </View>
    );
  }
  return (
    <View style={[styles.map, { backgroundColor: '#F0EBE3' }]}>
      <View style={{ position: 'absolute', top: 40, left: 20, right: 20, height: 10, backgroundColor: '#E8E0D8', borderRadius: 5 }} />
      <View style={{ position: 'absolute', top: 80, left: 20, right: 20, height: 10, backgroundColor: '#E8E0D8', borderRadius: 5 }} />
      <View style={{ position: 'absolute', top: 20, left: '45%', bottom: 0, width: 10, backgroundColor: '#E8E0D8' }} />
      <View style={{ position: 'absolute', top: 10, left: 30, width: 80, height: 40, backgroundColor: '#DDDAD4', borderRadius: 6 }} />
      <View style={{ position: 'absolute', top: 10, right: 20, width: 60, height: 50, backgroundColor: '#DDDAD4', borderRadius: 6 }} />
      <View style={{ position: 'absolute', top: 60, left: 10, width: 40, height: 30, backgroundColor: '#DDDAD4', borderRadius: 4 }} />
      {/* Dashed route line */}
      <View style={{ position: 'absolute', top: 84, left: 0, right: 0, height: 2, borderStyle: 'dashed', borderWidth: 1, borderColor: '#F2994A' }} />
      {/* Destination pin */}
      <View style={{ position: 'absolute', top: 70, right: 30, alignItems: 'center' }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0B3D42', alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="home" size={14} color="#FFFFFF" />
        </View>
      </View>
      {/* Moving truck */}
      <Animated.View style={{ position: 'absolute', top: 72, transform: [{ translateX: truckX }] }}>
        {isWireframe ? (
          <View style={{ width: 24, height: 20, borderWidth: 1.5, borderColor: '#555', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderRadius: 2 }}>
            <Feather name="truck" size={12} color="#555" />
          </View>
        ) : (
          <Text style={{ fontSize: 22 }}>🚛</Text>
        )}
      </Animated.View>
    </View>
  );
}

function StarRating({ rating }: { rating: number }) {
  const { isWireframe } = useDesignMode();
  const activeColor = isWireframe ? '#555555' : '#F97316';
  const inactiveColor = isWireframe ? '#CCCCCC' : '#E2E8F0';
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Feather key={s} name="star" size={12} color={s <= Math.round(rating) ? activeColor : inactiveColor} />
      ))}
    </View>
  );
}

export default function LiveTrackingScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const orderId = route?.params?.orderId ?? 'ord_8821';
  const [etaMinutes, setEtaMinutes] = useState(23);

  // Countdown ETA
  useEffect(() => {
    const t = setInterval(() => {
      setEtaMinutes((prev) => Math.max(1, prev - 1));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]} edges={['bottom']}>
      {/* Map */}
      <TrackingMap isWireframe={isWF} />

      {/* Bottom panel */}
      <View style={[styles.panel, { backgroundColor: isWF ? '#F0F0F0' : colors.white, ...(!isWF ? Shadow.lg : { borderTopWidth: 1.5, borderTopColor: '#CCCCCC' }) }]}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* ETA */}
          <View style={styles.etaRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.etaLabel, { color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                Estimated arrival
              </Text>
              <Text style={[styles.etaValue, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_700Bold', fontSize: FontSizes['3xl'] }]}>
                {etaMinutes} min
              </Text>
            </View>
            {/* ETA gauge */}
            <FuelGaugeArc
              value={etaMinutes}
              max={35}
              label="ETA"
              unit="min"
              size={110}
              color={isWF ? '#888888' : colors.ignitionAmber}
            />
          </View>

          {/* Driver card */}
          <Card style={StyleSheet.flatten([styles.driverCard, { marginBottom: Spacing.md }])}>
            <View style={styles.driverRow}>
              <View style={[styles.driverAvatar, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolDeep }]}>
                {isWF ? (
                  <Feather name="user" size={22} color="#555" />
                ) : (
                  <Text style={{ fontSize: 26 }}>👤</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.driverName, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                  {MOCK_DRIVER.name}
                </Text>
                <StarRating rating={MOCK_DRIVER.rating} />
                <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: 2 }]}>
                  {MOCK_DRIVER.rating} · {MOCK_DRIVER.totalDeliveries.toLocaleString()} deliveries
                </Text>
              </View>
              <View style={styles.actionBtns}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolLight }]}>
                  <Feather name="phone" size={18} color={isWF ? '#555' : colors.petrolDeep} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolLight }]}>
                  <Feather name="message-circle" size={18} color={isWF ? '#555' : colors.petrolDeep} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.vehicleRow, { borderTopWidth: 1, borderTopColor: isWF ? '#DDDDDD' : colors.divider, paddingTop: Spacing.sm, marginTop: Spacing.sm }]}>
              <Feather name="truck" size={14} color={isWF ? '#888' : colors.inkLight} />
              <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                {MOCK_DRIVER.vehicleColor} {MOCK_DRIVER.vehicleModel} · {MOCK_DRIVER.vehicleReg}
              </Text>
            </View>
          </Card>

          {/* Order summary inline */}
          <Card variant="filled" style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[{ color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
                40L Petrol 95 → 18 Kenneth Kaunda Rd
              </Text>
              <Text style={[{ color: isWF ? '#333' : colors.ignitionAmber, fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes.sm }]}>
                R987.00
              </Text>
            </View>
          </Card>

          <TouchableOpacity
            onPress={() => navigation.navigate('DeliveryPin', { orderId })}
            style={[styles.pinBtn, { backgroundColor: isWF ? '#4A4A4A' : colors.petrolDeep, borderRadius: isWF ? Radius.sm : Radius.lg }]}
          >
            <Feather name="lock" size={16} color={isWF ? '#CCC' : colors.ignitionAmber} />
            <Text style={[{ color: '#FFFFFF', fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
              Enter delivery PIN
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { height: 230, position: 'relative', overflow: 'hidden' },
  sosBtn: { position: 'absolute', top: 190, right: Spacing.base, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  panel: { flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.base, paddingTop: Spacing.lg },
  etaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  etaLabel: {},
  etaValue: {},
  driverCard: {},
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  driverName: {},
  actionBtns: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
});
