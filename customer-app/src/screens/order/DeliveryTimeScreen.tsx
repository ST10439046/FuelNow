import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";

import Card from "../../components/Card";
import Button from "../../components/Button";

interface ScheduleDay {
  label: string;
  dateStr: string;
  dateObj: Date;
  times: string[];
}

const ALL_TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

function generateScheduleSlots(): ScheduleDay[] {
  const slots: ScheduleDay[] = [];

  const now = new Date();
  const currentHour = now.getHours();

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(now);

    dayDate.setDate(now.getDate() + i);

    const weekday = dayDate.toLocaleDateString("en-ZA", {
      weekday: "short",
    });

    const dayNum = dayDate.getDate();

    const month = dayDate.toLocaleDateString("en-ZA", {
      month: "short",
    });

    const dateStr = `${weekday}, ${dayNum} ${month}`;

    let label = dateStr;

    if (i === 0) {
      label = "Today";
    } else if (i === 1) {
      label = "Tomorrow";
    }

    let times: string[] = [];

    if (i === 0) {
      times = ALL_TIME_SLOTS.filter((time) => {
        const hour = parseInt(time.split(":")[0], 10);

        return hour > currentHour + 1;
      });
    } else {
      times = [...ALL_TIME_SLOTS];
    }

    slots.push({
      label,
      dateStr,
      dateObj: dayDate,
      times,
    });
  }

  return slots;
}

interface Props {
  navigation: any;
  route?: any;
}

export default function DeliveryTimeScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const params = route?.params ?? {};

  const [deliveryMode, setDeliveryMode] = useState<"now" | "schedule">("now");

  const scheduleSlots = useMemo(() => generateScheduleSlots(), []);

  const initialDayIndex = scheduleSlots[0].times.length === 0 ? 1 : 0;

  const [selectedDay, setSelectedDay] = useState(initialDayIndex);

  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const handleContinue = () => {
    let scheduledAt: string | null = null;

    let scheduledDateTime: string | null = null;

    if (deliveryMode === "schedule" && selectedTime) {
      const selectedSlot = scheduleSlots[selectedDay];

      scheduledAt = `${selectedSlot.dateStr} at ${selectedTime}`;

      const [h, m] = selectedTime.split(":").map((n) => parseInt(n, 10));

      const scheduledDate = new Date(selectedSlot.dateObj);

      scheduledDate.setHours(h, m, 0, 0);

      scheduledDateTime = scheduledDate.toISOString();
    }

    console.log("DeliveryTime forwarding params:", {
      ...params,
      scheduledAt,
      scheduledDateTime,
    });

    navigation.navigate("PaymentMethod", {
      ...params,
      scheduledAt,
      scheduledDateTime,
    });
  };

  const currentSlot = scheduleSlots[selectedDay] || scheduleSlots[0];

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={isWF ? "#333" : colors.charcoalInk}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.screenTitle,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,

              fontFamily: font("display"),

              fontSize: FontSizes.md,
            },
          ]}
        >
          When do you need it?
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeRow}>
          {(["now", "schedule"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeBtn,
                {
                  backgroundColor:
                    deliveryMode === mode
                      ? isWF
                        ? "#4A4A4A"
                        : colors.petrolDeep
                      : isWF
                        ? "#FFFFFF"
                        : colors.white,

                  borderColor: isWF ? "#CCCCCC" : colors.divider,

                  borderRadius: isWF ? Radius.sm : Radius.lg,
                },
              ]}
              onPress={() => setDeliveryMode(mode)}
            >
              <Feather
                name={mode === "now" ? "zap" : "calendar"}
                size={20}
                color={
                  deliveryMode === mode
                    ? "#FFFFFF"
                    : isWF
                      ? "#888"
                      : colors.inkLight
                }
              />

              <Text
                style={[
                  styles.modeBtnText,
                  {
                    color:
                      deliveryMode === mode
                        ? "#FFFFFF"
                        : isWF
                          ? "#444"
                          : colors.charcoalInk,

                    fontFamily: font("bodyMedium"),

                    fontSize: FontSizes.base,
                  },
                ]}
              >
                {mode === "now" ? "Deliver Now" : "Schedule"}
              </Text>

              {mode === "now" && (
                <Text
                  style={[
                    styles.modeEta,
                    {
                      color:
                        deliveryMode === "now"
                          ? "rgba(255,255,255,0.75)"
                          : isWF
                            ? "#888"
                            : colors.inkLight,

                      fontFamily: font("body"),

                      fontSize: FontSizes.xs,
                    },
                  ]}
                >
                  ~20–35 min
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {deliveryMode === "now" ? (
          <Card style={styles.nowCard}>
            <View style={styles.nowIconRow}>
              {!isWF && (
                <View
                  style={[
                    styles.nowIcon,
                    {
                      backgroundColor: colors.petrolLight,
                    },
                  ]}
                >
                  <Feather name="zap" size={28} color={colors.petrolDeep} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isWF ? "#1A1A1A" : colors.charcoalInk,

                    fontFamily: font("bodyMedium"),

                    fontSize: FontSizes.md,
                  }}
                >
                  On-demand delivery
                </Text>

                <Text
                  style={{
                    color: isWF ? "#555" : colors.inkLight,

                    fontFamily: font("body"),

                    fontSize: FontSizes.sm,

                    marginTop: 4,
                  }}
                >
                  A driver will be dispatched as soon as your order is
                  confirmed. Average ETA is 25 minutes.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.etaBox,
                {
                  backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,

                  borderRadius: isWF ? Radius.sm : Radius.lg,
                },
              ]}
            >
              <Text
                style={{
                  color: isWF ? "#1A1A1A" : colors.petrolDeep,

                  fontFamily: isWF ? undefined : "Inter_600SemiBold",

                  fontSize: FontSizes["2xl"],
                }}
              >
                20–35
              </Text>

              <Text
                style={{
                  color: isWF ? "#555" : colors.inkLight,

                  fontFamily: font("body"),

                  fontSize: FontSizes.sm,
                }}
              >
                minutes estimated
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: font("bodyMedium"),

                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Select date
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScrollContainer}
            >
              {scheduleSlots.map((slot, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayBtn,
                    {
                      backgroundColor:
                        selectedDay === i
                          ? isWF
                            ? "#4A4A4A"
                            : colors.petrolDeep
                          : isWF
                            ? "#FFFFFF"
                            : colors.white,

                      borderColor: isWF ? "#CCCCCC" : colors.divider,

                      borderRadius: isWF ? Radius.sm : Radius.lg,
                    },
                  ]}
                  onPress={() => {
                    setSelectedDay(i);

                    setSelectedTime(null);
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedDay === i
                          ? "#FFFFFF"
                          : isWF
                            ? "#333"
                            : colors.charcoalInk,

                      fontFamily: font("bodyMedium"),

                      fontSize: FontSizes.xs,

                      textAlign: "center",
                    }}
                  >
                    {slot.label}
                  </Text>

                  <Text
                    style={{
                      color:
                        selectedDay === i
                          ? "rgba(255,255,255,0.75)"
                          : isWF
                            ? "#666"
                            : colors.inkLight,

                      fontFamily: font("body"),

                      fontSize: 10,

                      textAlign: "center",

                      marginTop: 2,
                    }}
                  >
                    {slot.dateStr}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: isWF ? "#333" : colors.charcoalInk,

                  fontFamily: font("bodyMedium"),

                  fontSize: FontSizes.sm,

                  marginTop: Spacing.lg,
                },
              ]}
            >
              Select time slot ({currentSlot.dateStr})
            </Text>

            {currentSlot.times.length === 0 ? (
              <View
                style={[
                  styles.noSlotsBox,
                  {
                    backgroundColor: isWF ? "#FFFFFF" : colors.white,

                    borderColor: isWF ? "#CCCCCC" : colors.divider,
                  },
                ]}
              >
                <Feather
                  name="clock"
                  size={24}
                  color={isWF ? "#888" : colors.inkLight}
                />

                <Text
                  style={{
                    color: isWF ? "#666" : colors.inkLight,

                    fontFamily: font("body"),

                    fontSize: FontSizes.sm,

                    textAlign: "center",
                  }}
                >
                  No more delivery slots available for today. Please select
                  tomorrow or another date.
                </Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {currentSlot.times.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeBtn,
                      {
                        backgroundColor:
                          selectedTime === time
                            ? isWF
                              ? "#888"
                              : colors.ignitionAmber
                            : isWF
                              ? "#FFFFFF"
                              : colors.white,

                        borderColor:
                          selectedTime === time
                            ? isWF
                              ? "#555"
                              : colors.ignitionAmber
                            : isWF
                              ? "#CCCCCC"
                              : colors.divider,

                        borderRadius: isWF ? Radius.sm : Radius.full,
                      },
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={{
                        color:
                          selectedTime === time
                            ? "#FFFFFF"
                            : isWF
                              ? "#333"
                              : colors.charcoalInk,

                        fontFamily: isWF ? undefined : "Inter_500Medium",

                        fontSize: FontSizes.sm,
                      }}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <Button
          label="Continue"
          onPress={handleContinue}
          size="lg"
          style={{
            marginTop: Spacing.xl,
          }}
          disabled={deliveryMode === "schedule" && !selectedTime}
        />
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    paddingTop: Spacing.md,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  screenTitle: {},

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },

  modeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  modeBtn: {
    flex: 1,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },

  modeBtnText: {},

  modeEta: {},

  nowCard: {
    gap: Spacing.md,
  },

  nowIconRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },

  nowIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  etaBox: {
    padding: Spacing.lg,
    alignItems: "center",
    gap: 4,
  },

  sectionTitle: {
    marginBottom: Spacing.sm,
  },

  dayScrollContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: 4,
  },

  dayBtn: {
    minWidth: 90,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  timeBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },

  noSlotsBox: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
