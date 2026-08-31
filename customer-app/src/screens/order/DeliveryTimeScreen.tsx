import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';

const SCHEDULE_SLOTS = [
  { label: 'Today', date: 'Mon, 28 Jul', times: ['08:00', '10:00', '12:00', '14:00', '16:00'] },
  { label: 'Tomorrow', date: 'Tue, 29 Jul', times: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'] },
  { label: 'Wed, 30 Jul', date: 'Wed, 30 Jul', times: ['08:00', '10:00', '12:00', '14:00'] },
];

interface Props { navigation: any; route?: any }

export default function DeliveryTimeScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const params = route?.params ?? {};
  const [deliveryMode, setDeliveryMode] = useState<'now' | 'schedule'>('now');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleContinue = () => {
    const scheduledAt =
      deliveryMode === 'schedule' && selectedTime
        ? `${SCHEDULE_SLOTS[selectedDay].date} at ${selectedTime}`
        : null;
    navigation.navigate('PaymentMethod', { ...params, scheduledAt });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={isWF ? '#333' : colors.charcoalInk} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          When do you need it?
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Mode toggle */}
        <View style={styles.modeRow}>
          {(['now', 'schedule'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: deliveryMode === mode
                    ? isWF ? '#4A4A4A' : colors.petrolDeep
                    : isWF ? '#FFFFFF' : colors.white,
                  borderColor: isWF ? '#CCCCCC' : colors.divider,
                  borderRadius: isWF ? Radius.sm : Radius.lg,
                },
              ]}
              onPress={() => setDeliveryMode(mode)}
            >
              <Feather
                name={mode === 'now' ? 'zap' : 'calendar'}
                size={20}
                color={deliveryMode === mode ? '#FFFFFF' : isWF ? '#888' : colors.inkLight}
              />
              <Text style={[styles.modeBtnText, { color: deliveryMode === mode ? '#FFFFFF' : isWF ? '#444' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                {mode === 'now' ? 'Deliver Now' : 'Schedule'}
              </Text>
              {mode === 'now' && (
                <Text style={[styles.modeEta, { color: deliveryMode === 'now' ? 'rgba(255,255,255,0.75)' : isWF ? '#888' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  ~20–35 min
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {deliveryMode === 'now' ? (
          <Card style={styles.nowCard}>
            <View style={[styles.nowIconRow]}>
              {!isWF && (
                <View style={[styles.nowIcon, { backgroundColor: colors.petrolLight }]}>
                  <Feather name="zap" size={28} color={colors.petrolDeep} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.md }]}>
                  On-demand delivery
                </Text>
                <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm, marginTop: 4 }]}>
                  A driver will be dispatched as soon as your order is confirmed. Average ETA is 25 minutes.
                </Text>
              </View>
            </View>

            <View style={[styles.etaBox, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight, borderRadius: isWF ? Radius.sm : Radius.lg }]}>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.petrolDeep, fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes['2xl'] }]}>
                20–35
              </Text>
              <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                minutes estimated
              </Text>
            </View>
          </Card>
        ) : (
          <>
            {/* Day picker */}
            <Text style={[styles.sectionTitle, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
              Select date
            </Text>
            <View style={styles.dayRow}>
              {SCHEDULE_SLOTS.map((slot, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayBtn,
                    {
                      backgroundColor: selectedDay === i
                        ? isWF ? '#4A4A4A' : colors.petrolDeep
                        : isWF ? '#FFFFFF' : colors.white,
                      borderColor: isWF ? '#CCCCCC' : colors.divider,
                      borderRadius: isWF ? Radius.sm : Radius.lg,
                    },
                  ]}
                  onPress={() => { setSelectedDay(i); setSelectedTime(null); }}
                >
                  <Text style={[{ color: selectedDay === i ? '#FFFFFF' : isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.xs, textAlign: 'center' }]}>
                    {slot.label}
                  </Text>
                  <Text style={[{ color: selectedDay === i ? 'rgba(255,255,255,0.75)' : isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: 10, textAlign: 'center' }]}>
                    {slot.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time slots */}
            <Text style={[styles.sectionTitle, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm, marginTop: Spacing.lg }]}>
              Select time
            </Text>
            <View style={styles.timeGrid}>
              {SCHEDULE_SLOTS[selectedDay].times.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeBtn,
                    {
                      backgroundColor: selectedTime === time
                        ? isWF ? '#888' : colors.ignitionAmber
                        : isWF ? '#FFFFFF' : colors.white,
                      borderColor: selectedTime === time
                        ? isWF ? '#555' : colors.ignitionAmber
                        : isWF ? '#CCCCCC' : colors.divider,
                      borderRadius: isWF ? Radius.sm : Radius.full,
                    },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[{ color: selectedTime === time ? '#FFFFFF' : isWF ? '#333' : colors.charcoalInk, fontFamily: isWF ? undefined : 'Inter_500Medium', fontSize: FontSizes.sm }]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button
          label="Continue"
          onPress={handleContinue}
          size="lg"
          style={{ marginTop: Spacing.xl }}
          disabled={deliveryMode === 'schedule' && !selectedTime}
        />
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
  modeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  modeBtn: { flex: 1, padding: Spacing.md, borderWidth: 1, alignItems: 'center', gap: Spacing.xs },
  modeBtnText: {},
  modeEta: {},
  nowCard: { gap: Spacing.md },
  nowIconRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  nowIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  etaBox: { padding: Spacing.lg, alignItems: 'center', gap: 4 },
  sectionTitle: { marginBottom: Spacing.sm },
  dayRow: { flexDirection: 'row', gap: Spacing.sm },
  dayBtn: { flex: 1, padding: Spacing.sm, borderWidth: 1, alignItems: 'center', gap: 2 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderWidth: 1 },
});
