import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius } from '../../theme/tokens';
import Card from '../../components/Card';
import FuelGaugeArc from '../../components/FuelGaugeArc';
import { getRewardsBalance } from '../../services/mockApi';

interface Props { navigation: any }

const TIER_COLORS: Record<string, string> = {
  Bronze: '#CD7F32',
  Silver: '#A8A9AD',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
};

export default function RewardsScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRewardsBalance().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
        <ActivityIndicator color={isWF ? '#888' : colors.petrolDeep} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const tierColor = isWF ? '#888' : TIER_COLORS[data.tier] ?? colors.ignitionAmber;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWF ? '#F0F0F0' : colors.warmAsh }]}>
      <View style={styles.topBar}>
        <Text style={[styles.title, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('displayBold'), fontSize: FontSizes.xl }]}>
          FuelPoints
        </Text>
        <View style={[styles.tierBadge, { backgroundColor: isWF ? '#D0D0D0' : `${tierColor}22`, borderColor: tierColor, borderRadius: isWF ? Radius.sm : Radius.full }]}>
          <Feather name="award" size={14} color={tierColor} />
          <Text style={[{ color: tierColor, fontFamily: font('bodyMedium'), fontSize: FontSizes.xs }]}>
            {data.tier}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Main gauge card */}
        <Card style={[styles.gaugeCard, { backgroundColor: isWF ? '#FFFFFF' : colors.white }]} elevated={!isWF}>
          <View style={styles.gaugeInner}>
            <FuelGaugeArc
              value={data.points}
              max={500}
              label="FuelPoints"
              unit="pts"
              size={200}
              color={isWF ? '#888888' : colors.ignitionAmber}
            />
          </View>
          <View style={{ alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm }}>
            <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.base }]}>
              {data.pointsToNextReward} pts to free delivery
            </Text>
            <View style={[styles.progressBar, { backgroundColor: isWF ? '#D0D0D0' : colors.ashDark }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(data.points / 500) * 100}%`,
                    backgroundColor: isWF ? '#888' : colors.petrolDeep,
                  },
                ]}
              />
            </View>
            <Text style={[{ color: isWF ? '#555' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
              {data.points} / 500 pts for a free delivery (worth R{data.nextRewardValue})
            </Text>
          </View>
        </Card>

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            How it works
          </Text>
          {[
            { icon: 'zap', title: 'Earn', desc: 'Get 2 FuelPoints per litre ordered' },
            { icon: 'gift', title: 'Redeem', desc: '500 pts = 1 free delivery (R49 value)' },
            { icon: 'trending-up', title: 'Level up', desc: 'Reach Gold for 3× points per litre' },
          ].map((item) => (
            <View key={item.icon} style={styles.howRow}>
              <View style={[styles.howIcon, { backgroundColor: isWF ? '#E0E0E0' : colors.petrolLight }]}>
                <Feather name={item.icon as any} size={18} color={isWF ? '#555' : colors.petrolDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
                  {item.title}
                </Text>
                <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Tier ladder */}
        <Card style={styles.tierCard}>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            Tier Benefits
          </Text>
          {['Bronze', 'Silver', 'Gold', 'Platinum'].map((tier) => {
            const tc = isWF ? '#888' : TIER_COLORS[tier];
            const isCurrentTier = tier === data.tier;
            return (
              <View
                key={tier}
                style={[
                  styles.tierRow,
                  {
                    backgroundColor: isCurrentTier ? (isWF ? '#E0E0E0' : `${tc}15`) : 'transparent',
                    borderRadius: isWF ? Radius.sm : Radius.md,
                    borderLeftWidth: isCurrentTier ? 3 : 0,
                    borderLeftColor: isCurrentTier ? tc : 'transparent',
                  },
                ]}
              >
                <Feather name="award" size={16} color={tc} />
                <View style={{ flex: 1 }}>
                  <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font(isCurrentTier ? 'bodyMedium' : 'body'), fontSize: FontSizes.sm }]}>
                    {tier} {isCurrentTier ? '← You are here' : ''}
                  </Text>
                  <Text style={[{ color: isWF ? '#666' : colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                    {tier === 'Bronze' ? '0–199 pts · 2 pts/L'
                      : tier === 'Silver' ? '200–499 pts · 2.5 pts/L'
                      : tier === 'Gold' ? '500–999 pts · 3 pts/L'
                      : '1000+ pts · 4 pts/L + priority dispatch'}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Points history */}
        <Card>
          <Text style={[styles.sectionTitle, { color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('display'), fontSize: FontSizes.base }]}>
            Points History
          </Text>
          {data.history.map((h: any, i: number) => (
            <View key={i} style={[styles.histRow, { borderBottomColor: isWF ? '#EEE' : colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[{ color: isWF ? '#1A1A1A' : colors.charcoalInk, fontFamily: font('body'), fontSize: FontSizes.sm }]}>
                  {h.description}
                </Text>
                <Text style={[{ color: isWF ? '#888' : colors.inkFaint, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
                  {new Date(h.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <Text style={[{ color: h.points > 0 ? (isWF ? '#333' : colors.dieselGreen) : (isWF ? '#888' : colors.signalRed), fontFamily: isWF ? undefined : 'Inter_600SemiBold', fontSize: FontSizes.sm }]}>
                {h.points > 0 ? '+' : ''}{h.points} pts
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base, paddingTop: Spacing.md },
  title: {},
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1 },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['4xl'], gap: Spacing.md },
  gaugeCard: {},
  gaugeInner: { alignItems: 'center' },
  progressBar: { width: '80%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  howCard: { gap: Spacing.sm },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  howIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tierCard: { gap: Spacing.xs },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
  sectionTitle: { marginBottom: Spacing.md },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1 },
});
