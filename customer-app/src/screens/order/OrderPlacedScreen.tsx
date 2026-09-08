import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";

interface Props {
  navigation: any;
  route?: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Order progress
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: "check-circle" as const,
    label: "Order placed",
    color: "#22C55E",
  },
  {
    icon: "user" as const,
    label: "Driver assigned",
    color: "#F97316",
  },
  {
    icon: "truck" as const,
    label: "Driver en route",
    color: "#F97316",
  },
  {
    icon: "package" as const,
    label: "Fuel delivered",
    color: "#9CA3AF",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated truck
// ─────────────────────────────────────────────────────────────────────────────

function MovingTruck() {
  const pos = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pos, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(pos, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pos]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            translateX: pos.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 240],
            }),
          },
        ],
      }}
    >
      <Text style={{ fontSize: 36 }}>🚛</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderPlacedScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const orderCreated = route?.params?.orderCreated === true;
  const orderId = route?.params?.orderId ?? null;
  const errorMessage =
    route?.params?.errorMessage ??
    "Something went wrong while placing your order.";

  const [currentStep, setCurrentStep] = useState(orderCreated ? 0 : -1);

  // Only simulate progress AFTER an order has actually been created.
  useEffect(() => {
    if (!orderCreated) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderCreated]);

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;

  const accentColor = isWF ? "#4A4A4A" : colors.petrolDeep;

  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;

  const subColor = isWF ? "#555" : colors.inkLight;

  // ───────────────────────────────────────────────────────────────────────────
  // FAILURE
  // ───────────────────────────────────────────────────────────────────────────

  if (!orderCreated) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: bg,
          },
        ]}
      >
        <View style={styles.failureContainer}>
          <View
            style={[
              styles.failureIcon,
              {
                backgroundColor: isWF ? "#D0D0D0" : "#FEE2E2",
              },
            ]}
          >
            <Feather
              name="x-circle"
              size={52}
              color={isWF ? "#555" : "#DC2626"}
            />
          </View>

          <Text
            style={[
              styles.failureTitle,
              {
                color: headingColor,
                fontFamily: font("displayBold"),
                fontSize: FontSizes["2xl"],
              },
            ]}
          >
            Order could not be placed
          </Text>

          <Text
            style={[
              styles.failureText,
              {
                color: subColor,
                fontFamily: font("body"),
                fontSize: FontSizes.base,
              },
            ]}
          >
            {errorMessage}
          </Text>

          <View style={styles.failureButtons}>
            <Button
              label="Try Again"
              onPress={() => navigation.goBack()}
              variant="primary"
              size="lg"
            />

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor: isWF ? "#AAAAAA" : colors.divider,
                  borderRadius: isWF ? Radius.sm : Radius.lg,
                },
              ]}
              onPress={() => navigation.navigate("MainTabs")}
            >
              <Feather
                name="home"
                size={16}
                color={isWF ? "#555" : colors.inkLight}
              />

              <Text
                style={{
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                }}
              >
                Back to Home
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUCCESS
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: bg,
        },
      ]}
    >
      {/* Order ID */}
      <View style={styles.header}>
        <View
          style={[
            styles.orderIdBadge,
            {
              backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
              borderRadius: Radius.full,
            },
          ]}
        >
          <Feather
            name="hash"
            size={12}
            color={isWF ? "#555" : colors.petrolDeep}
          />

          <Text
            style={{
              color: isWF ? "#333" : colors.petrolDeep,
              fontFamily: isWF ? undefined : "Inter_500Medium",
              fontSize: FontSizes.xs,
            }}
          >
            {orderId ?? "Order"}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Success icon */}
        <View style={styles.successContainer}>
          <View
            style={[
              styles.successIcon,
              {
                backgroundColor: isWF ? "#D0D0D0" : "#DCFCE7",
              },
            ]}
          >
            <Feather name="check" size={48} color={isWF ? "#555" : "#16A34A"} />
          </View>

          <Text
            style={{
              color: headingColor,
              fontFamily: font("displayBold"),
              fontSize: FontSizes["2xl"],
              textAlign: "center",
              marginTop: Spacing.md,
            }}
          >
            Order placed successfully! 🎉
          </Text>

          <Text
            style={{
              color: subColor,
              fontFamily: font("body"),
              fontSize: FontSizes.base,
              textAlign: "center",
              maxWidth: 320,
              lineHeight: 22,
              marginTop: Spacing.sm,
            }}
          >
            Your fuel order has been created successfully. We will keep you
            updated as your order progresses.
          </Text>
        </View>

        {/* Truck */}
        <View
          style={[
            styles.driverCard,
            {
              backgroundColor: isWF ? "#FFFFFF" : colors.white,
              borderRadius: isWF ? Radius.sm : Radius.xl,
              borderColor: isWF ? "#DDD" : colors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.truckStrip,
              {
                backgroundColor: isWF ? "#F0F0F0" : colors.petrolLight,
              },
            ]}
          >
            {!isWF && <MovingTruck />}

            {isWF && (
              <Text
                style={{
                  color: "#888",
                  fontSize: FontSizes.sm,
                }}
              >
                [ Delivery vehicle ]
              </Text>
            )}

            {!isWF && (
              <View
                style={[
                  styles.roadLine,
                  {
                    backgroundColor: colors.petrolDeep,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.orderInfo}>
            <View
              style={[
                styles.orderIcon,
                {
                  backgroundColor: isWF ? "#D0D0D0" : colors.petrolDeep,
                },
              ]}
            >
              <Feather
                name="package"
                size={26}
                color={isWF ? "#555" : "#FFFFFF"}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: headingColor,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes.lg,
                }}
              >
                Order confirmed
              </Text>

              <Text
                style={{
                  color: subColor,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                  marginTop: 3,
                }}
              >
                Your order has been received by FuelNow.
              </Text>
            </View>
          </View>
        </View>

        {/* Progress */}
        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor: isWF ? "#FFFFFF" : colors.white,
              borderColor: isWF ? "#DDD" : colors.divider,
              borderRadius: isWF ? Radius.sm : Radius.lg,
            },
          ]}
        >
          {STEPS.map((step, i) => {
            const isDone = i <= currentStep;
            const isActive = i === currentStep + 1;

            return (
              <View key={i} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isDone
                        ? isWF
                          ? "#4A4A4A"
                          : step.color
                        : isActive
                          ? isWF
                            ? "#CCCCCC"
                            : "#E2E8F0"
                          : isWF
                            ? "#E8E8E8"
                            : "#F3F4F6",

                      borderWidth: isActive ? 2 : 0,

                      borderColor: isWF ? "#888" : colors.petrolDeep,
                    },
                  ]}
                >
                  {isDone && <Feather name="check" size={11} color="#FFFFFF" />}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: isDone
                        ? isWF
                          ? "#1A1A1A"
                          : colors.charcoalInk
                        : isWF
                          ? "#AAAAAA"
                          : colors.inkFaint,

                      fontFamily: font(isDone ? "bodyMedium" : "body"),

                      fontSize: FontSizes.sm,
                    }}
                  >
                    {step.label}
                  </Text>
                </View>

                {isDone && i === 0 && (
                  <Text
                    style={{
                      color: isWF ? "#888" : colors.dieselGreen,
                      fontFamily: font("body"),
                      fontSize: FontSizes.xs,
                    }}
                  >
                    ✓ Done
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            label="Track Order →"
            onPress={() =>
              navigation.navigate("LiveTracking", {
                orderId,
              })
            }
            variant="primary"
            size="lg"
          />

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor: isWF ? "#AAAAAA" : colors.divider,
                borderRadius: isWF ? Radius.sm : Radius.lg,
              },
            ]}
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Feather
              name="home"
              size={16}
              color={isWF ? "#555" : colors.inkLight}
            />

            <Text
              style={{
                color: isWF ? "#555" : colors.inkLight,
                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.base,
              }}
            >
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  orderIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    justifyContent: "center",
  },

  successContainer: {
    alignItems: "center",
  },

  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  failureContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },

  failureIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },

  failureTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  failureText: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 340,
  },

  failureButtons: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  driverCard: {
    borderWidth: 1,
    overflow: "hidden",
  },

  truckStrip: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },

  roadLine: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.2,
  },

  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.base,
  },

  orderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  stepsCard: {
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.md,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  buttons: {
    gap: Spacing.sm,
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },
});
