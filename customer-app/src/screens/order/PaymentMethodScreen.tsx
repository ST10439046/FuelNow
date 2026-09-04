import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { getMe, PaymentMethod } from '../../services/mockApi';

interface Props { navigation: any; route?: any }

export default function PaymentMethodScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const params = route?.params ?? {};
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<string>('pm_001');

  useEffect(() => {
    getMe().then((u) => {
      if (u.paymentMethods && u.paymentMethods.length > 0) {
        setPaymentMethods(u.paymentMethods);
        const def = u.paymentMethods.find((p) => p.isDefault);
        if (def) setSelected(def.id);
        else setSelected(u.paymentMethods[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleContinue = () => {
    navigation.navigate('OrderReview', { ...params, paymentMethodId: selected });
  };

  const getPaymentIcon = (pm: PaymentMethod) => {
    if (pm.type === 'mobile_money') return 'smartphone';
    if (pm.type === 'eft') return 'link';
    return 'credit-card';
  };

  const getCardBrandLabel = (pm: PaymentMethod) => {
    if (pm.brand === 'visa') return isWF ? 'VISA' : '💳 VISA';
    if (pm.brand === 'mastercard') return isWF ? 'MC' : '💳 MC';
    return '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Payment Method
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Saved methods */}
        <Text style={[styles.sectionTitle, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
          Saved payment methods
        </Text>

        {paymentMethods.map((pm) => {
          const isSelected = pm.id === selected;
          return (
            <TouchableOpacity
              key={pm.id}
              style={[
                styles.pmCard,
                {
                  backgroundColor: isSelected ? (isWF ? '#E0E0E0' : colors.petrolLight) : (isWF ? '#FFFFFF' : colors.white),
                  borderColor: isSelected ? (isWF ? '#555' : colors.petrolDeep) : (isWF ? '#CCCCCC' : colors.divider),
                  borderWidth: isSelected ? 1.5 : 1,
                  borderRadius: isWF ? Radius.sm : Radius.lg,
                },
              ]}
              onPress={() => setSelected(pm.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.pmIcon, { backgroundColor: isWF ? '#D8D8D8' : colors.petrolLight }]}>
                <Feather name={getPaymentIcon(pm) as any} size={20} color={isWF ? '#555' : colors.petrolDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                  {pm.label}
                </Text>
                {pm.type === 'card' && (
                  <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                    {getCardBrandLabel(pm)} ending in {pm.last4}
                  </Text>
                )}
                {pm.isDefault && (
                  <View style={[styles.defaultBadge, { backgroundColor: isWF ? '#C8C8C8' : colors.petrolLight }]}>
                    <Text style={[{ color: isWF ? '#444' : colors.petrolMid, fontFamily: font('body'), fontSize: 10 }]}>
                      Default
                    </Text>
                  </View>
                )}
              </View>
              <View style={[styles.radioOuter, { borderColor: isSelected ? (isWF ? '#555' : colors.petrolDeep) : (isWF ? '#AAAAAA' : colors.divider) }]}>
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: isWF ? '#555' : colors.petrolDeep }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add new methods */}
        <Text style={[styles.sectionTitle, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm, marginTop: Spacing.xl }]}>
          Add payment method
        </Text>

        {[
          { icon: 'credit-card', label: 'Add debit / credit card' },
          { icon: 'link', label: 'Instant EFT via Ozow' },
          { icon: 'smartphone', label: 'SnapScan / Zapper' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={[styles.addOption, { backgroundColor: isWF ? '#FFFFFF' : colors.white, borderColor: isWF ? '#CCCCCC' : colors.divider, borderRadius: isWF ? Radius.sm : Radius.lg }]}
            activeOpacity={0.8}
          >
            <View style={[styles.pmIcon, { backgroundColor: isWF ? '#E8E8E8' : colors.warmAsh }]}>
              <Feather name={opt.icon as any} size={18} color={isWF ? '#666' : colors.inkLight} />
            </View>
            <Text style={[{ color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base, flex: 1 }]}>
              {opt.label}
            </Text>
            <Feather name="chevron-right" size={18} color={isWF ? '#888' : colors.inkFaint} />
          </TouchableOpacity>
        ))}

        {/* Security note */}
        {!isWF && (
          <View style={[styles.securityNote, { backgroundColor: colors.greenLight, borderRadius: Radius.md }]}>
            <Feather name="shield" size={16} color={colors.dieselGreen} />
            <Text style={[{ color: colors.dieselGreen, fontFamily: font('body'), fontSize: FontSizes.xs, flex: 1 }]}>
              All payments are encrypted and processed securely via PCI DSS compliant providers.
            </Text>
          </View>
        )}

        <Button label="Continue" onPress={handleContinue} size="lg" style={{ marginTop: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: {},
  scroll: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  sectionTitle: { marginBottom: Spacing.md },
  pmCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, marginBottom: Spacing.sm },
  pmIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  defaultBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  addOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, marginBottom: Spacing.sm },
  securityNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, marginTop: Spacing.md },
});
