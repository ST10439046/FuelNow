import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { orderRepository } from '../../repositories/OrderRepository';
import { driverRepository } from '../../repositories/DriverRepository';

interface Props { navigation: any; route?: any }

function StarPicker({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange(s)}>
          <Feather
            name={s <= value ? 'star' : 'star'}
            size={34}
            color={s <= value ? color : '#D8D8D8'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RateReviewScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const orderId = route?.params?.orderId ?? 'ord_8821';
  const [driverRating, setDriverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const QUICK_COMMENTS = [
    'Super fast delivery!', 'Driver was professional', 'Fuel quality excellent',
    'On time', 'Would order again',
  ];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await orderRepository.rateOrder(orderId, driverRating, comment);
      setDone(true);
      setTimeout(() => navigation.navigate('DigitalReceipt', { orderId }), 1500);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
        <View style={styles.doneContainer}>
          <View style={[styles.doneIcon, { backgroundColor: isWF ? '#D0D0D0' : colors.greenLight }]}>
            <Feather name="heart" size={44} color={isWF ? '#555' : colors.dieselGreen} />
          </View>
          <Text style={[styles.doneTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes['2xl'] }]}>
            Thanks for the review!
          </Text>
          <Text style={[styles.doneSub, { color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.base }]}>
            Your feedback helps us improve FuelNow for all South Africans. 🇿🇦
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={[styles.screenTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.md }]}>
          Rate & Review
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('DigitalReceipt', { orderId })} style={styles.skipBtn}>
          <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.sm }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Driver rating */}
        <Card style={styles.section}>
          <View style={styles.driverRow}>
            <View style={[styles.avatar, { backgroundColor: isWF ? '#D0D0D0' : colors.petrolDeep }]}>
              {isWF ? (
                <Feather name="user" size={20} color="#555" />
              ) : (
                <Text style={{ fontSize: 28 }}>👤</Text>
              )}
            </View>
            <View>
              <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
                {'Sibusiso Dlamini'}
              </Text>
              <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                Your driver
              </Text>
            </View>
          </View>
          <Text style={[styles.sectionLabel, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
            Rate your driver
          </Text>
          <StarPicker value={driverRating} onChange={setDriverRating} color={isWF ? '#888' : colors.ignitionAmber} />
          <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs, marginTop: 6 }]}>
            {['', 'Very poor', 'Poor', 'Average', 'Good', 'Excellent'][driverRating]}
          </Text>
        </Card>


        {/* Comment */}
        <Card style={styles.section}>
          <Text style={[styles.sectionLabel, { color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm, marginBottom: Spacing.md }]}>
            Leave a comment (optional)
          </Text>
          {/* Quick tags */}
          <View style={styles.tagsRow}>
            {QUICK_COMMENTS.map((q) => (
              <TouchableOpacity
                key={q}
                style={[
                  styles.tag,
                  {
                    backgroundColor: comment === q
                      ? isWF ? '#D0D0D0' : colors.petrolLight
                      : isWF ? '#F0F0F0' : colors.warmAsh,
                    borderColor: comment === q ? (isWF ? '#555' : colors.petrolDeep) : (isWF ? '#CCCCCC' : colors.divider),
                    borderRadius: isWF ? Radius.sm : Radius.full,
                  },
                ]}
                onPress={() => setComment((prev) => (prev === q ? '' : q))}
              >
                <Text style={[{ color: isWF ? '#333' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[
              styles.commentBox,
              {
                backgroundColor: isWF ? '#F8F8F8' : colors.warmAsh,
                color: isWF ? '#1A1A1A' : colors.charcoalInk,
                fontFamily: font('body'),
                fontSize: FontSizes.sm,
                borderColor: isWF ? '#CCCCCC' : colors.divider,
                borderRadius: isWF ? Radius.sm : Radius.md,
              },
            ]}
            placeholder="Tell us about your experience..."
            placeholderTextColor={isWF ? '#AAAAAA' : colors.inkFaint}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Card>

        <Button label="Submit Review" onPress={handleSubmit} loading={loading} size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.base, paddingTop: Spacing.md },
  screenTitle: {},
  skipBtn: { padding: Spacing.sm },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  section: { gap: Spacing.sm },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {},
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  tag: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  commentBox: { padding: Spacing.md, borderWidth: 1, minHeight: 80 },
  doneContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing['2xl'] },
  doneIcon: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { textAlign: 'center' },
  doneSub: { textAlign: 'center', lineHeight: 24 },
});
