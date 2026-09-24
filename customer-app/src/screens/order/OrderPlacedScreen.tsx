import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";
import {
  orderRepository,
  OrderModel,
} from "../../repositories/OrderRepository";

interface Props {
  navigation: any;
  route?: any;
}

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

const STATUS_PROGRESS: Record<string, number> = {
  PENDING_PAYMENT: 0,
  PAID: 0,
  FINDING_DRIVER: 0,
  ACCEPTED: 1,
  NAVIGATING: 2,
  ARRIVED: 2,
  DISPENSING: 2,
  DELIVERED: 3,
  COMPLETED: 3,
  CANCELLED: 0,
};

function getProgressForStatus(status?: string): number {
  if (!status) {
    return 0;
  }

  return STATUS_PROGRESS[status] ?? 0;
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "Payment pending";

    case "PAID":
      return "Order paid";

    case "FINDING_DRIVER":
      return "Finding your driver";

    case "ACCEPTED":
      return "Driver assigned";

    case "NAVIGATING":
      return "Driver is en route";

    case "ARRIVED":
      return "Driver has arrived";

    case "DISPENSING":
      return "Fuel is being dispensed";

    case "DELIVERED":
      return "Fuel delivered";

    case "COMPLETED":
      return "Order completed";

    case "CANCELLED":
      return "Order cancelled";

    default:
      return "Order placed";
  }
}

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

export default function OrderPlacedScreen({
  navigation,
  route,
}: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const orderCreated =
    route?.params?.orderCreated === true;

  const orderId =
    route?.params?.orderId ?? null;

  const errorMessage =
    route?.params?.errorMessage ??
    "Something went wrong while placing your order.";

  const [order, setOrder] =
    useState<OrderModel | null>(null);

  const [loadingOrder, setLoadingOrder] =
    useState(Boolean(orderId));

  const [currentStep, setCurrentStep] =
    useState(0);

  useEffect(() => {
    if (!orderId || !orderCreated) {
      setLoadingOrder(false);
      return;
    }

    let mounted = true;

    const loadOrder = async () => {
      try {
        const result =
          await orderRepository.getOrderById(orderId);

        if (!mounted) {
          return;
        }

        if (result) {
          setOrder(result);
          setCurrentStep(
            getProgressForStatus(result.status),
          );
        }
      } catch (error) {
        console.error(
          "OrderPlacedScreen: failed to load order:",
          error,
        );
      } finally {
        if (mounted) {
          setLoadingOrder(false);
        }
      }
    };

    loadOrder();

    const interval = setInterval(
      loadOrder,
      5000,
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orderId, orderCreated]);

  const bg =
    isWF
      ? "#F0F0F0"
      : colors.warmAsh;

  const headingColor =
    isWF
      ? "#1A1A1A"
      : colors.charcoalInk;

  const subColor =
    isWF
      ? "#555"
      : colors.inkLight;

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
                backgroundColor:
                  isWF
                    ? "#D0D0D0"
                    : "#FEE2E2",
              },
            ]}
          >
            <Feather
              name="x-circle"
              size={52}
              color={
                isWF
                  ? "#555"
                  : "#DC2626"
              }
            />
          </View>

          <Text
            style={[
              styles.failureTitle,
              {
                color: headingColor,
                fontFamily:
                  font("displayBold"),
                fontSize:
                  FontSizes["2xl"],
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
                fontFamily:
                  font("body"),
                fontSize:
                  FontSizes.base,
              },
            ]}
          >
            {errorMessage}
          </Text>

          <View
            style={styles.failureButtons}
          >
            <Button
              label="Try Again"
              onPress={() =>
                navigation.goBack()
              }
              variant="primary"
              size="lg"
            />

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                {
                  borderColor:
                    isWF
                      ? "#AAAAAA"
                      : colors.divider,
                  borderRadius:
                    isWF
                      ? Radius.sm
                      : Radius.lg,
                },
              ]}
              onPress={() =>
                navigation.navigate(
                  "MainTabs",
                )
              }
            >
              <Feather
                name="home"
                size={16}
                color={
                  isWF
                    ? "#555"
                    : colors.inkLight
                }
              />

              <Text
                style={{
                  color:
                    isWF
                      ? "#555"
                      : colors.inkLight,
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.base,
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

  const actualStatus =
    order?.status ??
    "PENDING_PAYMENT";

  const statusLabel =
    getStatusLabel(actualStatus);

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: bg,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.orderIdBadge,
            {
              backgroundColor:
                isWF
                  ? "#E0E0E0"
                  : colors.petrolLight,
              borderRadius:
                Radius.full,
            },
          ]}
        >
          <Feather
            name="hash"
            size={12}
            color={
              isWF
                ? "#555"
                : colors.petrolDeep
            }
          />

          <Text
            style={{
              color:
                isWF
                  ? "#333"
                  : colors.petrolDeep,
              fontFamily:
                isWF
                  ? undefined
                  : "Inter_500Medium",
              fontSize:
                FontSizes.xs,
            }}
          >
            {orderId ?? "Order"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={
          styles.scroll
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.successContainer
          }
        >
          <View
            style={[
              styles.successIcon,
              {
                backgroundColor:
                  isWF
                    ? "#D0D0D0"
                    : "#DCFCE7",
              },
            ]}
          >
            <Feather
              name="check"
              size={48}
              color={
                isWF
                  ? "#555"
                  : "#16A34A"
              }
            />
          </View>

          <Text
            style={{
              color: headingColor,
              fontFamily:
                font("displayBold"),
              fontSize:
                FontSizes["2xl"],
              textAlign: "center",
              marginTop:
                Spacing.md,
            }}
          >
            Order placed successfully!
          </Text>

          <Text
            style={{
              color: subColor,
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.base,
              textAlign: "center",
              maxWidth: 320,
              lineHeight: 22,
              marginTop:
                Spacing.sm,
            }}
          >
            Your fuel order has been
            created successfully. We
            will keep you updated as
            your order progresses.
          </Text>

          {loadingOrder ? (
            <View
              style={
                styles.statusLoading
              }
            >
              <ActivityIndicator
                size="small"
                color={
                  isWF
                    ? "#555"
                    : colors.petrolDeep
                }
              />

              <Text
                style={{
                  color: subColor,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                Loading current order
                status...
              </Text>
            </View>
          ) : (
            <Text
              style={{
                color:
                  isWF
                    ? "#555"
                    : colors.petrolDeep,
                fontFamily:
                  font("bodyMedium"),
                fontSize:
                  FontSizes.sm,
                marginTop:
                  Spacing.md,
              }}
            >
              {statusLabel}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.driverCard,
            {
              backgroundColor:
                isWF
                  ? "#FFFFFF"
                  : colors.white,
              borderRadius:
                isWF
                  ? Radius.sm
                  : Radius.xl,
              borderColor:
                isWF
                  ? "#DDD"
                  : colors.divider,
            },
          ]}
        >
          <View
            style={[
              styles.truckStrip,
              {
                backgroundColor:
                  isWF
                    ? "#F0F0F0"
                    : colors.petrolLight,
              },
            ]}
          >
            {!isWF && (
              <MovingTruck />
            )}

            {isWF && (
              <Text
                style={{
                  color: "#888",
                  fontSize:
                    FontSizes.sm,
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
                    backgroundColor:
                      colors.petrolDeep,
                  },
                ]}
              />
            )}
          </View>

          <View
            style={styles.orderInfo}
          >
            <View
              style={[
                styles.orderIcon,
                {
                  backgroundColor:
                    isWF
                      ? "#D0D0D0"
                      : colors.petrolDeep,
                },
              ]}
            >
              <Feather
                name="package"
                size={26}
                color={
                  isWF
                    ? "#555"
                    : "#FFFFFF"
                }
              />
            </View>

            <View
              style={{ flex: 1 }}
            >
              <Text
                style={{
                  color: headingColor,
                  fontFamily:
                    font("displayBold"),
                  fontSize:
                    FontSizes.lg,
                }}
              >
                {statusLabel}
              </Text>

              <Text
                style={{
                  color: subColor,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                  marginTop: 3,
                }}
              >
                Order status is
                automatically loaded
                from FuelNow.
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.stepsCard,
            {
              backgroundColor:
                isWF
                  ? "#FFFFFF"
                  : colors.white,
              borderColor:
                isWF
                  ? "#DDD"
                  : colors.divider,
              borderRadius:
                isWF
                  ? Radius.sm
                  : Radius.lg,
            },
          ]}
        >
          {STEPS.map(
            (step, i) => {
              const isDone =
                i < currentStep;

              const isCurrent =
                i === currentStep;

              const isCancelled =
                actualStatus ===
                "CANCELLED";

              return (
                <View
                  key={step.label}
                  style={
                    styles.stepRow
                  }
                >
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor:
                          isCancelled
                            ? isWF
                              ? "#CCCCCC"
                              : colors.divider
                            : isDone
                              ? isWF
                                ? "#4A4A4A"
                                : step.color
                              : isCurrent
                                ? isWF
                                  ? "#4A4A4A"
                                  : step.color
                                : isWF
                                  ? "#E8E8E8"
                                  : "#F3F4F6",

                        borderWidth:
                          isCurrent
                            ? 2
                            : 0,

                        borderColor:
                          isWF
                            ? "#888"
                            : colors.petrolDeep,
                      },
                    ]}
                  >
                    {isDone && (
                      <Feather
                        name="check"
                        size={11}
                        color="#FFFFFF"
                      />
                    )}

                    {isCurrent &&
                      !isDone && (
                        <View
                          style={[
                            styles.currentDot,
                            {
                              backgroundColor:
                                "#FFFFFF",
                            },
                          ]}
                        />
                      )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          isDone ||
                          isCurrent
                            ? isWF
                              ? "#1A1A1A"
                              : colors.charcoalInk
                            : isWF
                              ? "#AAAAAA"
                              : colors.inkFaint,

                        fontFamily:
                          font(
                            isDone ||
                              isCurrent
                              ? "bodyMedium"
                              : "body",
                          ),

                        fontSize:
                          FontSizes.sm,
                      }}
                    >
                      {step.label}
                    </Text>

                    {isCurrent && (
                      <Text
                        style={{
                          color:
                            isWF
                              ? "#777"
                              : colors.inkLight,
                          fontFamily:
                            font("body"),
                          fontSize:
                            FontSizes.xs,
                          marginTop: 2,
                        }}
                      >
                        Current status
                      </Text>
                    )}
                  </View>
                </View>
              );
            },
          )}
        </View>

        <View
          style={styles.buttons}
        >
          <Button
            label="View Order Details →"
            onPress={() =>
              navigation.navigate(
                "OrderDetails",
                {
                  orderId,
                },
              )
            }
            variant="primary"
            size="lg"
          />

          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                borderColor:
                  isWF
                    ? "#AAAAAA"
                    : colors.divider,
                borderRadius:
                  isWF
                    ? Radius.sm
                    : Radius.lg,
              },
            ]}
            onPress={() =>
              navigation.navigate(
                "MainTabs",
              )
            }
          >
            <Feather
              name="home"
              size={16}
              color={
                isWF
                  ? "#555"
                  : colors.inkLight
              }
            />

            <Text
              style={{
                color:
                  isWF
                    ? "#555"
                    : colors.inkLight,
                fontFamily:
                  font("bodyMedium"),
                fontSize:
                  FontSizes.base,
              }}
            >
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal:
      Spacing.base,
    paddingBottom:
      Spacing["4xl"],
    gap: Spacing.lg,
  },

  header: {
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom:
      Spacing.sm,
  },

  orderIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal:
      Spacing.md,
    paddingVertical:
      Spacing.xs,
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

  statusLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
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

  currentDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  buttons: {
    gap: Spacing.sm,
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical:
      Spacing.md,
    borderWidth: 1,
  },

  failureContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal:
      Spacing.xl,
  },

  failureIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom:
      Spacing.lg,
  },

  failureTitle: {
    textAlign: "center",
    marginBottom:
      Spacing.sm,
  },

  failureText: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 340,
  },

  failureButtons: {
    width: "100%",
    gap: Spacing.sm,
    marginTop:
      Spacing.xl,
  },
});