import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { userRepository } from '../../repositories/UserRepository';

interface Props {
  navigation: any;
  route?: any;
}

export default function AddCardScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const insets = useSafeAreaInsets();

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (text: string) => {
    const clean = text.replace(/\D/g, '');
    const limited = clean.slice(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const clean = text.replace(/\D/g, '');
    const limited = clean.slice(0, 4);
    if (limited.length >= 2) {
      setExpiryDate(`${limited.slice(0, 2)}/${limited.slice(2)}`);
    } else {
      setExpiryDate(limited);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!cardholderName.trim()) e.cardholderName = 'Cardholder name is required';
    
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (!cleanCard) e.cardNumber = 'Card number is required';
    else if (cleanCard.length < 16) e.cardNumber = 'Enter a valid 16-digit card number';

    if (!expiryDate) e.expiryDate = 'Required';
    else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) e.expiryDate = 'MM/YY';
    
    if (!cvv) e.cvv = 'Required';
    else if (cvv.length < 3) e.cvv = 'CVV must be 3 digits';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const brand = cardNumber.startsWith('4') ? 'visa' : 'mastercard';
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);
      
      const newMethod = await userRepository.addPaymentMethod({
        type: 'card',
        brand,
        label: `${brand === 'visa' ? 'Visa' : 'Mastercard'} ••• ${last4}`,
        last4,
        isDefault: true,
      });

      if (route?.params?.onCardAdded) {
        route.params.onCardAdded(newMethod);
      }
      navigation.goBack();
    } catch (err: any) {
      setErrors({ form: err.message ?? 'Failed to save card.' });
    } finally {
      setLoading(false);
    }
  };

  const bg = isWF ? '#F0F0F0' : colors.warmAsh;
  const cardBg = isWF ? '#FFFFFF' : colors.white;
  const border = isWF ? '#DDDDDD' : colors.divider;
  const headingColor = isWF ? '#1A1A1A' : colors.charcoalInk;
  const subColor = isWF ? '#555' : colors.inkLight;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={headingColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: headingColor, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Add Card
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Virtual Card Preview */}
          {!isWF && (
            <Card elevated style={StyleSheet.flatten([styles.cardPreview, { backgroundColor: colors.petrolDeep }])}>
              <View style={styles.cardPreviewHeader}>
                <Text style={[styles.cardBrand, { fontFamily: font('displayBold') }]}>
                  {cardNumber.startsWith('4') ? 'VISA' : 'Mastercard'}
                </Text>
                <Feather name="wifi" size={18} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </View>
              <Text style={[styles.cardNumberText, { fontFamily: 'Inter_500Medium' }]}>
                {cardNumber || '•••• •••• •••• ••••'}
              </Text>
              <View style={styles.cardPreviewFooter}>
                <View>
                  <Text style={styles.cardLabel}>CARDHOLDER</Text>
                  <Text style={[styles.cardValue, { fontFamily: font('bodyMedium') }]}>
                    {cardholderName.toUpperCase() || 'NAME SURNAME'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={[styles.cardValue, { fontFamily: 'Inter_500Medium' }]}>
                    {expiryDate || 'MM/YY'}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Form details */}
          <Text style={[styles.sectionLabel, { color: subColor, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
            CARD INFORMATION
          </Text>
          <Card style={{ gap: Spacing.md }}>
            <Input
              label="Cardholder Name"
              placeholder="Name Surname"
              value={cardholderName}
              onChangeText={setCardholderName}
              error={errors.cardholderName}
              icon="user"
              autoCapitalize="words"
            />

            <Input
              label="Card Number"
              placeholder="4000 1234 5678 9010"
              value={cardNumber}
              onChangeText={formatCardNumber}
              keyboardType="number-pad"
              error={errors.cardNumber}
              icon="credit-card"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Expiry Date"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChangeText={formatExpiry}
                  keyboardType="number-pad"
                  maxLength={5}
                  error={errors.expiryDate}
                  icon="calendar"
                />
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Input
                  label="CVV"
                  placeholder="123"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  error={errors.cvv}
                  icon="lock"
                />
              </View>
            </View>
          </Card>

          {errors.form ? (
            <Text style={{ color: colors.signalRed, fontFamily: font('body'), fontSize: FontSizes.sm, textAlign: 'center' }}>
              {errors.form}
            </Text>
          ) : null}

          <View style={styles.securityNote}>
            <Feather name="shield" size={14} color={isWF ? '#777' : colors.dieselGreen} />
            <Text style={{ color: subColor, fontFamily: font('body'), fontSize: FontSizes.xs, flex: 1 }}>
              Secure 256-bit SSL encrypted connection. Your card details are stored securely.
            </Text>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={[
          styles.footer,
          {
            backgroundColor: cardBg,
            borderTopColor: border,
            paddingBottom: Platform.OS === 'web'
              ? Spacing.lg
              : Math.max(insets.bottom, Spacing.base),
          },
        ]}>
          <Button
            label={loading ? 'Adding Card...' : 'Add Card'}
            onPress={handleSave}
            loading={loading}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    maxHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {},
  scroll: { padding: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.md },
  sectionLabel: { letterSpacing: 0.5, marginBottom: Spacing.xs },
  cardPreview: {
    height: 180,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    letterSpacing: 1,
  },
  cardNumberText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  cardPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  footer: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
});
