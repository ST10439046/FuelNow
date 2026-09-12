import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Card from "../../components/Card";
import FuelGaugeArc from "../../components/FuelGaugeArc";

import { orderRepository } from "../../repositories/OrderRepository";

interface Props {
  navigation: any;
}

interface RewardHistoryItem {
  date: string;
  description: string;
  points: number;
  litres: number;
}

interface RewardsData {
  points: number;
  pointsToNextReward: number;
  nextRewardValue: number;
  tier: string;
  history: RewardHistoryItem[];
  totalLitres: number;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: "#CD7F32",
  Silver: "#A8A9AD",
  Gold: "#FFD700",
  Platinum: "#E5E4E2",
};

function calculateTier(points: number): string {
  if (points >= 1000) {
    return "Platinum";
  }

  if (points >= 500) {
    return "Gold";
  }

  if (points >= 200) {
    return "Silver";
  }

  return "Bronze";
}

export default function RewardsScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      /*
       * getOrders() now uses the single
       * get_customer_orders() RPC.
       *
       * Therefore this entire rewards calculation
       * only requires ONE Supabase request.
       */
      const orders = await orderRepository.getOrders();

      /*
       * 1 FuelPoint = 1 litre ordered.
       *
       * Cancelled orders do not earn points.
       */
      const validOrders = orders.filter(
        (order) => order.status !== "CANCELLED",
      );

      const totalLitres = validOrders.reduce(
        (sum, order) => sum + Number(order.item.litres || 0),
        0,
      );

      const points = Math.floor(totalLitres);

      const tier = calculateTier(points);

      const pointsToNextReward = Math.max(0, 500 - points);

      const history: RewardHistoryItem[] = validOrders.map((order) => ({
        date: order.createdAt,
        description: `Order ${order.orderNumber}`,
        points: Math.floor(Number(order.item.litres || 0)),
        litres: Number(order.item.litres || 0),
      }));

      setData({
        points,
        pointsToNextReward,
        nextRewardValue: 49.0,
        tier,
        history,
        totalLitres,
      });
    } catch (err: any) {
      console.error("RewardsScreen: failed to load rewards:", err);

      setError(
        err?.message ?? "Unable to load your FuelPoints. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Runs every time the Rewards tab/screen becomes active.
   *
   * This means:
   *
   * Place order
   *      ↓
   * Navigate back to Rewards
   *      ↓
   * get_customer_orders()
   *      ↓
   * points recalculate
   */
  useFocusEffect(
    useCallback(() => {
      loadRewards();
    }, [loadRewards]),
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
          },
        ]}
      >
        <ActivityIndicator
          color={isWF ? "#888" : colors.petrolDeep}
          style={{ marginTop: 80 }}
        />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.errorContainer}>
          <Feather
            name="alert-circle"
            size={36}
            color={isWF ? "#666" : colors.signalRed}
          />

          <Text
            style={[
              styles.errorTitle,
              {
                color: isWF ? "#1A1A1A" : colors.charcoalInk,
                fontFamily: font("display"),
              },
            ]}
          >
            Unable to load FuelPoints
          </Text>

          <Text
            style={[
              styles.errorText,
              {
                color: isWF ? "#666" : colors.inkLight,
                fontFamily: font("body"),
              },
            ]}
          >
            {error || "Please try again later."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tierColor = isWF
    ? "#888"
    : (TIER_COLORS[data.tier] ?? colors.ignitionAmber);

  const progressPercentage = Math.min(100, (data.points / 500) * 100);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Text
          style={[
            styles.title,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.xl,
            },
          ]}
        >
          FuelPoints
        </Text>

        <View
          style={[
            styles.tierBadge,
            {
              backgroundColor: isWF ? "#D0D0D0" : `${tierColor}22`,
              borderColor: tierColor,
              borderRadius: isWF ? Radius.sm : Radius.full,
            },
          ]}
        >
          <Feather name="award" size={14} color={tierColor} />

          <Text
            style={[
              {
                color: tierColor,
                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.xs,
              },
            ]}
          >
            {data.tier}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Main gauge card */}
        <Card
          style={StyleSheet.flatten([
            styles.gaugeCard,
            {
              backgroundColor: isWF ? "#FFFFFF" : colors.white,
            },
          ])}
          elevated={!isWF}
        >
          <View style={styles.gaugeInner}>
            <FuelGaugeArc
              value={data.points}
              max={500}
              label="FuelPoints"
              unit="pts"
              size={200}
              color={isWF ? "#888888" : colors.ignitionAmber}
            />
          </View>

          <View
            style={{
              alignItems: "center",
              gap: Spacing.xs,
              marginTop: Spacing.sm,
            }}
          >
            <Text
              style={[
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              {data.pointsToNextReward} pts to free delivery
            </Text>

            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: isWF ? "#D0D0D0" : colors.ashDark,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isWF ? "#888" : colors.petrolDeep,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                {
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                },
              ]}
            >
              {data.points} / 500 pts for a free delivery (worth R
              {data.nextRewardValue})
            </Text>

            <Text
              style={[
                {
                  color: isWF ? "#777" : colors.inkFaint,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                },
              ]}
            >
              {data.totalLitres.toFixed(2)} litres ordered
            </Text>
          </View>
        </Card>

        {/* How it works */}
        <Card style={styles.howCard}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? "#1A1A1A" : colors.charcoalInk,
                fontFamily: font("display"),
                fontSize: FontSizes.base,
              },
            ]}
          >
            How it works
          </Text>

          {[
            {
              icon: "zap",
              title: "Earn",
              desc: "Get 1 FuelPoint for every litre ordered",
            },
            {
              icon: "gift",
              title: "Redeem",
              desc: "500 pts = 1 free delivery (R49 value)",
            },
            {
              icon: "trending-up",
              title: "Level up",
              desc: "Reach higher tiers as you earn more points",
            },
          ].map((item) => (
            <View key={item.icon} style={styles.howRow}>
              <View
                style={[
                  styles.howIcon,
                  {
                    backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                  },
                ]}
              >
                <Feather
                  name={item.icon as any}
                  size={18}
                  color={isWF ? "#555" : colors.petrolDeep}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    {
                      color: isWF ? "#1A1A1A" : colors.charcoalInk,
                      fontFamily: font("bodyMedium"),
                      fontSize: FontSizes.sm,
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    {
                      color: isWF ? "#666" : colors.inkLight,
                      fontFamily: font("body"),
                      fontSize: FontSizes.xs,
                    },
                  ]}
                >
                  {item.desc}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Tier ladder */}
        <Card style={styles.tierCard}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? "#1A1A1A" : colors.charcoalInk,
                fontFamily: font("display"),
                fontSize: FontSizes.base,
              },
            ]}
          >
            Tier Benefits
          </Text>

          {["Bronze", "Silver", "Gold", "Platinum"].map((tier) => {
            const tc = isWF ? "#888" : TIER_COLORS[tier];

            const isCurrentTier = tier === data.tier;

            return (
              <View
                key={tier}
                style={[
                  styles.tierRow,
                  {
                    backgroundColor: isCurrentTier
                      ? isWF
                        ? "#E0E0E0"
                        : `${tc}15`
                      : "transparent",

                    borderRadius: isWF ? Radius.sm : Radius.md,

                    borderLeftWidth: isCurrentTier ? 3 : 0,

                    borderLeftColor: isCurrentTier ? tc : "transparent",
                  },
                ]}
              >
                <Feather name="award" size={16} color={tc} />

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      {
                        color: isWF ? "#1A1A1A" : colors.charcoalInk,
                        fontFamily: font(isCurrentTier ? "bodyMedium" : "body"),
                        fontSize: FontSizes.sm,
                      },
                    ]}
                  >
                    {tier} {isCurrentTier ? "← You are here" : ""}
                  </Text>

                  <Text
                    style={[
                      {
                        color: isWF ? "#666" : colors.inkLight,
                        fontFamily: font("body"),
                        fontSize: FontSizes.xs,
                      },
                    ]}
                  >
                    {tier === "Bronze"
                      ? "0–199 pts · 1 pt/L"
                      : tier === "Silver"
                        ? "200–499 pts · 1 pt/L"
                        : tier === "Gold"
                          ? "500–999 pts · 1 pt/L"
                          : "1000+ pts · 1 pt/L + priority dispatch"}
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Points history */}
        <Card>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isWF ? "#1A1A1A" : colors.charcoalInk,
                fontFamily: font("display"),
                fontSize: FontSizes.base,
              },
            ]}
          >
            Points History
          </Text>

          {data.history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather
                name="droplet"
                size={28}
                color={isWF ? "#888" : colors.inkFaint}
              />

              <Text
                style={[
                  {
                    color: isWF ? "#666" : colors.inkLight,
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                No orders yet
              </Text>

              <Text
                style={[
                  {
                    color: isWF ? "#888" : colors.inkFaint,
                    fontFamily: font("body"),
                    fontSize: FontSizes.xs,
                    textAlign: "center",
                  },
                ]}
              >
                Place your first fuel order to start earning FuelPoints.
              </Text>
            </View>
          ) : (
            data.history.map((h, i) => (
              <View
                key={`${h.description}-${i}`}
                style={[
                  styles.histRow,
                  {
                    borderBottomColor: isWF ? "#EEE" : colors.divider,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      {
                        color: isWF ? "#1A1A1A" : colors.charcoalInk,
                        fontFamily: font("body"),
                        fontSize: FontSizes.sm,
                      },
                    ]}
                  >
                    {h.description}
                  </Text>

                  <Text
                    style={[
                      {
                        color: isWF ? "#888" : colors.inkFaint,
                        fontFamily: font("body"),
                        fontSize: FontSizes.xs,
                      },
                    ]}
                  >
                    {new Date(h.date).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {h.litres.toFixed(2)} L
                  </Text>
                </View>

                <Text
                  style={[
                    {
                      color: isWF ? "#333" : colors.dieselGreen,
                      fontFamily: isWF ? undefined : "Inter_600SemiBold",
                      fontSize: FontSizes.sm,
                    },
                  ]}
                >
                  +{h.points} pts
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },

  title: {},

  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.md,
  },

  gaugeCard: {},

  gaugeInner: {
    alignItems: "center",
  },

  progressBar: {
    width: "80%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  howCard: {
    gap: Spacing.sm,
  },

  howRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  howIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  tierCard: {
    gap: Spacing.xs,
  },

  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.sm,
  },

  sectionTitle: {
    marginBottom: Spacing.md,
  },

  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },

  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },

  errorTitle: {
    fontSize: FontSizes.base,
    textAlign: "center",
  },

  errorText: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
});
