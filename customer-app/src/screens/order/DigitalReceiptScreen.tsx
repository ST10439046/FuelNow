import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface Props { navigation: any; route?: any }

const ORDER = {
  id: 'ord_8821',
  date: '28 July 2026',
  time: '16:42',
  driver: 'France Sizwe',
  station: 'Engen Durban North',
  vehicle: 'White Toyota Hilux · ND 456-789',
  fuelType: 'Petrol 95',
  litres: 40,
  ratePerLitre: 23.45,
  subtotal: 938.0,
  deliveryFee: 49.0,
  serviceFee: 0.0,
  vat: 135.21,
  total: 987.0,
  address: '18 Kenneth Kaunda Road, Durban North, Durban, 4051',
  paymentMethod: 'FNB Cheque ••• 4821 (Visa)',
  deliveredAt: '17:05',
  loyaltyEarned: 80,
};

function ReceiptRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { fontWeight: bold ? '700' : '400' }]}>{label}</Text>
      <Text style={[styles.rowValue, { fontWeight: bold ? '700' : '400' }]}>{value}</Text>
    </View>
  );
}

export default function DigitalReceiptScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backBtn}>
          <Feather name="x" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Receipt
        </Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Feather name="share-2" size={20} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.receiptHeader, { backgroundColor: isWF ? '#4A4A4A' : colors.petrolDeep, borderRadius: isWF ? Radius.sm : Radius.xl }]}>
          {!isWF && (
            <LinearGradient
              colors={[colors.petrolDeep, colors.petrolMid]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}
          <View style={[styles.successBadge, { backgroundColor: isWF ? '#D0D0D0' : colors.dieselGreen }]}>
            <Feather name="check" size={24} color="#FFFFFF" />
          </View>
          <Text style={[{ color: isWF ? '#CCC' : 'rgba(255,255,255,0.7)', fontFamily: font('body'), fontSize: FontSizes.sm }]}>
            Delivered
          </Text>
          <Text style={[{ color: '#FFFFFF', fontFamily: isWF ? undefined : 'Inter_700Bold', fontSize: FontSizes['3xl'] }]}>
            R{ORDER.total.toFixed(2)}
          </Text>
          <Text style={[{ color: isWF ? '#CCC' : 'rgba(255,255,255,0.7)', fontFamily: isWF ? undefined : 'Inter_400Regular', fontSize: FontSizes.xs }]}>
            Order #{ORDER.id} · {ORDER.date} at {ORDER.time}
          </Text>
        </View>

        {/* Fuel details */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            Fuel Delivered
          </Text>
          <View style={[styles.fuelBadge, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight, borderRadius: isWF ? Radius.sm : Radius.lg }]}>
            {isWF ? (
              <Feather name="droplet" size={24} color="#555" />
            ) : (
              <Text style={{ fontSize: 28 }}>⛽</Text>
            )}
            <View>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes.xl }]}>
                {ORDER.litres}L
              </Text>
              <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                {ORDER.fuelType} · R{ORDER.ratePerLitre}/L
              </Text>
            </View>
          </View>
          <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: Spacing.sm }]}>
            Dispensed at {ORDER.deliveredAt} by {ORDER.driver} from {ORDER.station}
          </Text>
          <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
            {ORDER.vehicle}
          </Text>
        </Card>

        {/* Cost breakdown */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            Cost Breakdown
          </Text>
          <View style={{ gap: 6 }}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                Fuel ({ORDER.litres}L × R{ORDER.ratePerLitre})
              </Text>
              <Text style={[styles.rowValue, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_500Medium', fontSize: FontSizes.sm }]}>
                R{ORDER.subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>Delivery fee</Text>
              <Text style={[styles.rowValue, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_500Medium', fontSize: FontSizes.sm }]}>
                R{ORDER.deliveryFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>Service fee</Text>
              <Text style={[styles.rowValue, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_500Medium', fontSize: FontSizes.sm }]}>
                R0.00
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isWF ? '#DDD' : colors.divider }]} />
            <View style={styles.row}>
              <Text style={[{ color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.base }]}>
                Total (incl. VAT)
              </Text>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes.lg }]}>
                R{ORDER.total.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment & delivery */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            Details
          </Text>
          <View style={{ gap: 8 }}>
            {[
              { label: 'Payment', value: ORDER.paymentMethod },
              { label: 'Address', value: ORDER.address },
              { label: 'Delivered at', value: ORDER.deliveredAt },
            ].map((d) => (
              <View key={d.label} style={styles.row}>
                <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm, flex: 1 }]}>
                  {d.label}
                </Text>
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.sm, flex: 2, textAlign: 'right' }]}>
                  {d.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Loyalty earned */}
        {!isWF && (
          <View style={[styles.loyaltyBanner, { backgroundColor: colors.amberLight, borderRadius: Radius.lg }]}>
            <Feather name="award" size={20} color={colors.ignitionAmber} />
            <Text style={[{ color: colors.amberDark, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm, flex: 1 }]}>
              You earned <Text style={{ fontFamily: 'Inter_600SemiBold' }}>+{ORDER.loyaltyEarned} FuelPoints</Text> on this order!
            </Text>
          </View>
        )}

        <Button
          label="Back to Home"
          onPress={() => navigation.navigate('MainTabs')}
          variant="outline"
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: {},
  scroll: { padding: Spacing.base, paddingBottom: Spacing['5xl'], gap: Spacing.md },
  receiptHeader: { overflow: 'hidden', padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  successBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  section: { gap: Spacing.sm },
  sectionTitle: { marginBottom: Spacing.sm },
  fuelBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: {},
  rowValue: {},
  divider: { height: 1, marginVertical: 4 },
  loyaltyBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
});
