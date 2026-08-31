import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Button from '../../components/Button';
import { confirmDelivery } from '../../services/mockApi';

interface Props { navigation: any; route?: any }

export default function DeliveryPinScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const orderId = route?.params?.orderId ?? 'ord_8821';
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  const handlePinChange = (val: string, i: number) => {
    if (val.length > 1) val = val[val.length - 1];
    const newPin = [...pin];
    newPin[i] = val;
    setPin(newPin);
    setError('');
    if (val && i < 3) refs.current[i + 1]?.focus();
    if (!val && i > 0) refs.current[i - 1]?.focus();
  };

  const handleConfirm = async () => {
    const pinStr = pin.join('');
    if (pinStr.length < 4) { setError('Please enter the full 4-digit PIN.'); return; }
    setLoading(true);
    setError('');
    try {
      await confirmDelivery(orderId, pinStr);
      setSuccess(true);
      setTimeout(() => navigation.navigate('RateReview', { orderId }), 1500);
    } catch (e: any) {
      setError(e.message ?? 'Incorrect PIN. Please try again.');
      Vibration.vibrate(400);
      setPin(['', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Confirm Delivery
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {success ? (
          <>
            <View style={[styles.successIcon, { backgroundColor: isWF ? '#D0D0D0' : colors.greenLight }]}>
              <Feather name="check-circle" size={56} color={isWF ? '#555' : colors.dieselGreen} />
            </View>
            <Text style={[styles.successTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes['2xl'] }]}>
              Delivered! ✅
            </Text>
            <Text style={[styles.successSub, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.base }]}>
              Your fuel has been delivered successfully.
            </Text>
          </>
        ) : (
          <>
            {!isWF && (
              <View style={[styles.lockIcon, { backgroundColor: colors.petrolLight }]}>
                <Feather name="lock" size={36} color={colors.petrolDeep} />
              </View>
            )}
            <Text style={[styles.title, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes['2xl'] }]}>
              Enter delivery PIN
            </Text>
            <Text style={[styles.subtitle, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.base }]}>
              Your driver will show you this 4-digit PIN to confirm delivery. Do not share it until you've received your fuel.
            </Text>

            {/* PIN boxes */}
            <View style={styles.pinRow}>
              {pin.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { refs.current[i] = r; }}
                  style={[
                    styles.pinBox,
                    {
                      backgroundColor: isWF ? '#FFFFFF' : colors.white,
                      borderColor: error
                        ? (isWF ? '#555' : colors.signalRed)
                        : digit
                        ? (isWF ? '#333' : colors.petrolDeep)
                        : (isWF ? '#CCCCCC' : colors.divider),
                      color: isWF ? '#1A1A1A' : colors.charcoalInk,
                      fontFamily: isWF ? undefined : 'Inter_700Bold',
                      fontSize: FontSizes['2xl'],
                      borderRadius: isWF ? Radius.sm : Radius.lg,
                    },
                  ]}
                  value={digit}
                  onChangeText={(v) => handlePinChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  secureTextEntry
                />
              ))}
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={14} color={isWF ? '#555' : colors.signalRed} />
                <Text style={[{ color: isWF ? '#555' : colors.signalRed, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Button
              label="Confirm Delivery"
              onPress={handleConfirm}
              loading={loading}
              size="lg"
              style={{ marginTop: Spacing.lg }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingTop: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: {},
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'], gap: Spacing.lg },
  lockIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  pinRow: { flexDirection: 'row', gap: Spacing.md, marginVertical: Spacing.lg },
  pinBox: { width: 64, height: 72, borderWidth: 2, textAlign: 'center' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  hint: { textAlign: 'center' },
  successIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  successTitle: { textAlign: 'center' },
  successSub: { textAlign: 'center', lineHeight: 24 },
});
