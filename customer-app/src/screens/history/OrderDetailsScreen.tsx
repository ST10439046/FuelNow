import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius, Shadow } from "../../theme/tokens";

import Card from "../../components/Card";
import Button from "../../components/Button";
import StatusBadge from "../../components/StatusBadge";
import FuelGaugeArc from "../../components/FuelGaugeArc";

import {
  orderRepository,
  OrderModel,
} from "../../repositories/OrderRepository";

const { width: W } = Dimensions.get("window");

interface Props {
  navigation: any;
  route?: any;
}

function formatDate(iso?: string): string {
  if (!iso) return "Not available";

  const d = new Date(iso);

  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso?: string): string {
  if (!iso) return "Not available";

  const d = new Date(iso);

  return d.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Simple visual tracking map.
 *
 * This uses the same visual approach as your existing LiveTrackingScreen.
 * Later this can be replaced with Google Maps / Mapbox without changing
 * the rest of the order-details experience.
 */
function TrackingMap({
  isWireframe,
  colors,
  driverCoordinates,
  customerCoordinates,
}: {
  isWireframe: boolean;
  colors: any;
  driverCoordinates?: { lat: number; lng: number };
  customerCoordinates?: { lat: number; lng: number };
}) {
  const truckX = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(truckX, {
          toValue: Math.max(30, W - 120),
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(truckX, {
          toValue: 30,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [truckX]);

  return (
    <View
      style={[
        styles.map,
        {
          backgroundColor: isWireframe ? "#D8D8D8" : "#EAF0EE",
        },
      ]}
    >
      {!isWireframe && (
        <>
          <View
            style={{
              position: "absolute",
              top: 18,
              left: 25,
              width: 100,
              height: 45,
              backgroundColor: "#DDDAD4",
              borderRadius: 6,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: 15,
              right: 25,
              width: 70,
              height: 55,
              backgroundColor: "#DDDAD4",
              borderRadius: 6,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: 95,
              left: 0,
              right: 0,
              height: 2,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: colors.ignitionAmber,
            }}
          />

          <View
            style={{
              position: "absolute",
              top: 80,
              right: 35,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: colors.petrolDeep,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather
                name="home"
                size={16}
                color="#FFFFFF"
              />
            </View>

            <Text
              style={{
                marginTop: 4,
                fontSize: 10,
                color: colors.charcoalInk,
              }}
            >
              You
            </Text>
          </View>

          <Animated.View
            style={{
              position: "absolute",
              top: 80,
              transform: [{ translateX: truckX }],
            }}
          >
            <Text style={{ fontSize: 28 }}>🚛</Text>
          </Animated.View>
        </>
      )}

      {isWireframe && (
        <Text
          style={{
            color: "#888",
            textAlign: "center",
            marginTop: 95,
            fontSize: 13,
          }}
        >
          [ Live Delivery Tracking ]
        </Text>
      )}
    </View>
  );
}

function StarRating({
  rating,
  isWireframe,
  colors,
}: {
  rating: number;
  isWireframe: boolean;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 2,
      }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Feather
          key={star}
          name="star"
          size={13}
          color={
            star <= Math.round(rating)
              ? isWireframe
                ? "#555"
                : colors.ignitionAmber
              : isWireframe
                ? "#CCC"
                : colors.divider
          }
        />
      ))}
    </View>
  );
}

function DetailRow({
  label,
  value,
  isWireframe,
  colors,
  font,
}: {
  label: string;
  value: string;
  isWireframe: boolean;
  colors: any;
  font: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Text
        style={{
          flex: 1,
          color: isWireframe ? "#666" : colors.inkLight,
          fontFamily: font("body"),
          fontSize: FontSizes.sm,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          flex: 2,
          textAlign: "right",
          color: isWireframe ? "#1A1A1A" : colors.charcoalInk,
          fontFamily: font("bodyMedium"),
          fontSize: FontSizes.sm,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function TimelineStep({
  title,
  subtitle,
  completed,
  active,
  isLast,
  isWireframe,
  colors,
  font,
}: {
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
  isLast?: boolean;
  isWireframe: boolean;
  colors: any;
  font: any;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineIndicatorColumn}>
        <View
          style={[
            styles.timelineDot,
            {
              backgroundColor: completed || active
                ? isWireframe
                  ? "#555"
                  : colors.petrolDeep
                : isWireframe
                  ? "#D0D0D0"
                  : colors.divider,
              borderColor: isWireframe
                ? "#FFFFFF"
                : colors.white,
            },
          ]}
        >
          {completed && (
            <Feather
              name="check"
              size={10}
              color="#FFFFFF"
            />
          )}
        </View>

        {!isLast && (
          <View
            style={{
              flex: 1,
              width: 2,
              backgroundColor:
                completed
                  ? isWireframe
                    ? "#555"
                    : colors.petrolDeep
                  : isWireframe
                    ? "#D0D0D0"
                    : colors.divider,
            }}
          />
        )}
      </View>

      <View style={styles.timelineContent}>
        <Text
          style={{
            color: isWireframe
              ? "#1A1A1A"
              : colors.charcoalInk,
            fontFamily: active
              ? font("bodyMedium")
              : font("body"),
            fontSize: FontSizes.sm,
          }}
        >
          {title}
        </Text>

        <Text
          style={{
            color: isWireframe
              ? "#777"
              : colors.inkLight,
            fontFamily: font("body"),
            fontSize: FontSizes.xs,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function OrderDetailsScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const orderId = route?.params?.orderId;

  const [order, setOrder] = useState<OrderModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState(0);

  const loadOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const result = await orderRepository.getOrderById(orderId);

      if (result) {
        setOrder(result);
        setEtaMinutes(result.estimatedArrivalMinutes ?? 0);
      }
    } catch (error) {
      console.error(
        "OrderDetailsScreen: failed to load order:",
        error,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();

    /**
     * Polling keeps this screen feeling live while using the
     * current repository implementation.
     *
     * Later this can be replaced by the realtime observer
     * without changing the UI.
     */
    const interval = setInterval(() => {
      loadOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status === "COMPLETED") {
      return;
    }

    const timer = setInterval(() => {
      setEtaMinutes((previous) =>
        Math.max(1, previous - 1),
      );
    }, 30000);

    return () => clearInterval(timer);
  }, [order?.status]);

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWF
              ? "#F0F0F0"
              : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={
              isWF
                ? "#777"
                : colors.petrolDeep
            }
          />

          <Text
            style={{
              marginTop: Spacing.md,
              color: isWF
                ? "#666"
                : colors.inkLight,
              fontFamily: font("body"),
              fontSize: FontSizes.sm,
            }}
          >
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWF
              ? "#F0F0F0"
              : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Feather
            name="alert-circle"
            size={42}
            color={
              isWF
                ? "#666"
                : colors.signalRed
            }
          />

          <Text
            style={{
              marginTop: Spacing.md,
              color: isWF
                ? "#333"
                : colors.charcoalInk,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.lg,
            }}
          >
            Order not found
          </Text>

          <Button
            label="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = order.status === "COMPLETED";

  const isActive =
    !isCompleted &&
    [
      "FINDING_DRIVER",
      "DRIVER_ASSIGNED",
      "EN_ROUTE",
      "ARRIVED",
      "DELIVERING",
    ].includes(order.status);

  const hasDriver = !!order.driver;

  const customerAddress = [
    order.deliveryAddress.street,
    order.deliveryAddress.suburb,
    order.deliveryAddress.city,
    order.deliveryAddress.province,
    order.deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const driver = order.driver;

  const handleCallDriver = () => {
    if (!driver?.phone) return;

    Linking.openURL(
      `tel:${driver.phone.replace(/\s/g, "")}`,
    );
  };

  const handleConfirmDelivery = () => {
    navigation.navigate("DeliveryPin", {
      orderId: order.id,
    });
  };

  const handleReorder = () => {
    navigation.navigate("FuelSelection", {
      reorder: order,
    });
  };

  const getTimelineState = (
    step:
      | "placed"
      | "driver"
      | "enroute"
      | "delivery"
      | "completed",
  ) => {
    const status = order.status;

    const progress: Record<string, number> = {
      FINDING_DRIVER: 1,
      DRIVER_ASSIGNED: 2,
      EN_ROUTE: 3,
      ARRIVED: 4,
      DELIVERING: 4,
      COMPLETED: 5,
    };

    const current = progress[status] ?? 1;

    const indexes = {
      placed: 1,
      driver: 2,
      enroute: 3,
      delivery: 4,
      completed: 5,
    };

    const index = indexes[step];

    return {
      completed: current > index,
      active: current === index,
    };
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF
            ? "#F0F0F0"
            : colors.warmAsh,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={
              isWF
                ? "#333"
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.md,
            }}
          >
            Order Details
          </Text>

          <Text
            style={{
              color: isWF
                ? "#777"
                : colors.inkFaint,
              fontFamily: font("body"),
              fontSize: FontSizes.xs,
              marginTop: 1,
            }}
          >
            {order.orderNumber || order.id}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleReorder}
          style={styles.backBtn}
        >
          <Feather
            name="refresh-cw"
            size={20}
            color={
              isWF
                ? "#333"
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero */}
        <View
          style={[
            styles.statusHero,
            {
              backgroundColor: isWF
                ? "#4A4A4A"
                : isCompleted
                  ? colors.dieselGreen
                  : colors.petrolDeep,
              borderRadius: isWF
                ? Radius.sm
                : Radius.xl,
            },
          ]}
        >
          {!isWF && !isCompleted && (
            <LinearGradient
              colors={[
                colors.petrolDeep,
                colors.petrolMid,
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          <View style={styles.heroIcon}>
            <Feather
              name={
                isCompleted
                  ? "check-circle"
                  : "truck"
              }
              size={28}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={{
              color: isWF
                ? "#CCCCCC"
                : "rgba(255,255,255,0.75)",
              fontFamily: font("body"),
              fontSize: FontSizes.sm,
            }}
          >
            {isCompleted
              ? "Delivery completed"
              : "Your order is on its way"}
          </Text>

          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: isWF
                ? undefined
                : "Inter_700Bold",
              fontSize: FontSizes["3xl"],
              marginTop: 2,
            }}
          >
            R{order.totalAmount.toFixed(2)}
          </Text>

          <StatusBadge
            status={order.status as any}
            size="sm"
          />

          <Text
            style={{
              color: isWF
                ? "#CCCCCC"
                : "rgba(255,255,255,0.75)",
              fontFamily: font("body"),
              fontSize: FontSizes.xs,
              marginTop: 4,
            }}
          >
            Placed {formatDateTime(order.createdAt)}
          </Text>
        </View>

        {/* Live tracking */}
        {isActive && (
          <>
            <View
              style={[
                styles.sectionHeading,
                { marginTop: Spacing.sm },
              ]}
            >
              <View>
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily: font("display"),
                    fontSize: FontSizes.lg,
                  }}
                >
                  Live delivery
                </Text>

                <Text
                  style={{
                    color: isWF
                      ? "#666"
                      : colors.inkLight,
                    fontFamily: font("body"),
                    fontSize: FontSizes.xs,
                    marginTop: 2,
                  }}
                >
                  We're keeping an eye on your fuel.
                </Text>
              </View>

              <View
                style={[
                  styles.livePill,
                  {
                    backgroundColor: isWF
                      ? "#D0D0D0"
                      : colors.greenLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor: isWF
                        ? "#555"
                        : colors.dieselGreen,
                    },
                  ]}
                />

                <Text
                  style={{
                    color: isWF
                      ? "#444"
                      : colors.dieselGreen,
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.xs,
                  }}
                >
                  LIVE
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.trackingCard,
                {
                  backgroundColor: isWF
                    ? "#FFFFFF"
                    : colors.white,
                  ...(isWF
                    ? {
                        borderWidth: 1,
                        borderColor: "#D0D0D0",
                      }
                    : Shadow.sm),
                },
              ]}
            >
              <TrackingMap
                isWireframe={isWF}
                colors={colors}
                driverCoordinates={
                  driver?.coordinates
                }
                customerCoordinates={
                  order.deliveryAddress.coordinates
                }
              />

              <View style={styles.etaSection}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: isWF
                        ? "#666"
                        : colors.inkLight,
                      fontFamily: font("body"),
                      fontSize: FontSizes.sm,
                    }}
                  >
                    Estimated arrival
                  </Text>

                  <Text
                    style={{
                      color: isWF
                        ? "#1A1A1A"
                        : colors.charcoalInk,
                      fontFamily: isWF
                        ? undefined
                        : "Inter_700Bold",
                      fontSize: FontSizes["3xl"],
                      marginTop: 2,
                    }}
                  >
                    {etaMinutes || order.estimatedArrivalMinutes} min
                  </Text>

                  <Text
                    style={{
                      color: isWF
                        ? "#777"
                        : colors.inkLight,
                      fontFamily: font("body"),
                      fontSize: FontSizes.xs,
                      marginTop: 2,
                    }}
                  >
                    {order.distanceKm} km away
                  </Text>
                </View>

                <FuelGaugeArc
                  value={
                    etaMinutes ||
                    order.estimatedArrivalMinutes
                  }
                  max={35}
                  label="ETA"
                  unit="min"
                  size={100}
                  color={
                    isWF
                      ? "#888"
                      : colors.ignitionAmber
                  }
                />
              </View>
            </View>
          </>
        )}

        {/* Delivery timeline */}
        <Card style={styles.section}>
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.base,
              marginBottom: Spacing.sm,
            }}
          >
            Delivery progress
          </Text>

          <TimelineStep
            title="Order placed"
            subtitle={formatDateTime(order.createdAt)}
            {...getTimelineState("placed")}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Driver assigned"
            subtitle={
              hasDriver
                ? `${driver?.name} is handling your delivery`
                : "Finding the best available driver"
            }
            {...getTimelineState("driver")}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Driver en route"
            subtitle={
              hasDriver
                ? `${driver?.vehicleColor ?? ""} ${driver?.vehicleModel ?? ""}`
                : "We'll notify you when your driver is on the way"
            }
            {...getTimelineState("enroute")}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Delivery"
            subtitle={
              isCompleted
                ? `Delivered ${formatDateTime(order.deliveredAt)}`
                : "Your driver will arrive at your delivery address"
            }
            {...getTimelineState("delivery")}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Completed"
            subtitle={
              isCompleted
                ? "Fuel successfully delivered"
                : "Waiting for delivery confirmation"
            }
            {...getTimelineState("completed")}
            isLast
            isWireframe={isWF}
            colors={colors}
            font={font}
          />
        </Card>

        {/* Driver */}
        {hasDriver && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily: font("display"),
                  fontSize: FontSizes.base,
                }}
              >
                Your driver
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#777"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                }}
              >
                {driver?.stationName}
              </Text>
            </View>

            <View style={styles.driverRow}>
              <View
                style={[
                  styles.driverAvatar,
                  {
                    backgroundColor: isWF
                      ? "#D0D0D0"
                      : colors.petrolDeep,
                  },
                ]}
              >
                {isWF ? (
                  <Feather
                    name="user"
                    size={24}
                    color="#555"
                  />
                ) : (
                  <Text style={{ fontSize: 28 }}>
                    👤
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.base,
                  }}
                >
                  {driver?.name}
                </Text>

                <StarRating
                  rating={driver?.rating ?? 0}
                  isWireframe={isWF}
                  colors={colors}
                />

                <Text
                  style={{
                    color: isWF
                      ? "#666"
                      : colors.inkLight,
                    fontFamily: font("body"),
                    fontSize: FontSizes.xs,
                    marginTop: 3,
                  }}
                >
                  {driver?.rating} ·{" "}
                  {driver?.totalDeliveries?.toLocaleString() ??
                    "1,000+"}{" "}
                  deliveries
                </Text>
              </View>

              {!isCompleted && (
                <TouchableOpacity
                  onPress={handleCallDriver}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isWF
                        ? "#D0D0D0"
                        : colors.petrolLight,
                    },
                  ]}
                >
                  <Feather
                    name="phone"
                    size={18}
                    color={
                      isWF
                        ? "#555"
                        : colors.petrolDeep
                    }
                  />
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.vehicleRow,
                {
                  borderTopColor: isWF
                    ? "#DDD"
                    : colors.divider,
                },
              ]}
            >
              <Feather
                name="truck"
                size={15}
                color={
                  isWF
                    ? "#777"
                    : colors.inkLight
                }
              />

              <Text
                style={{
                  flex: 1,
                  color: isWF
                    ? "#555"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                }}
              >
                {driver?.vehicleColor}{" "}
                {driver?.vehicleModel} ·{" "}
                {driver?.vehicleReg}
              </Text>
            </View>
          </Card>
        )}

        {/* Fuel delivered */}
        <Card style={styles.section}>
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.base,
            }}
          >
            Fuel order
          </Text>

          <View
            style={[
              styles.fuelBadge,
              {
                backgroundColor: isWF
                  ? "#E0E0E0"
                  : colors.petrolLight,
                borderRadius: isWF
                  ? Radius.sm
                  : Radius.lg,
              },
            ]}
          >
            {isWF ? (
              <Feather
                name="droplet"
                size={26}
                color="#555"
              />
            ) : (
              <Text style={{ fontSize: 30 }}>
                ⛽
              </Text>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes.xl,
                }}
              >
                {order.item.litres}L
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#555"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                  marginTop: 2,
                }}
              >
                {order.item.fuelType}
              </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  color: isWF
                    ? "#333"
                    : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.sm,
                }}
              >
                R{order.item.pricePerLitre.toFixed(2)}/L
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#666"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                  marginTop: 2,
                }}
              >
                R{order.item.subtotal.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Delivery address */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={{
                color: isWF
                  ? "#1A1A1A"
                  : colors.charcoalInk,
                fontFamily: font("display"),
                fontSize: FontSizes.base,
              }}
            >
              Delivery address
            </Text>

            <Feather
              name="map-pin"
              size={17}
              color={
                isWF
                  ? "#666"
                  : colors.petrolDeep
              }
            />
          </View>

          <Text
            style={{
              color: isWF
                ? "#333"
                : colors.charcoalInk,
              fontFamily: font("bodyMedium"),
              fontSize: FontSizes.sm,
              lineHeight: 21,
            }}
          >
            {customerAddress}
          </Text>

          {order.deliveryAddress.instructions && (
            <View
              style={[
                styles.instructions,
                {
                  backgroundColor: isWF
                    ? "#F0F0F0"
                    : colors.warmAsh,
                },
              ]}
            >
              <Feather
                name="info"
                size={14}
                color={
                  isWF
                    ? "#666"
                    : colors.inkLight
                }
              />

              <Text
                style={{
                  flex: 1,
                  color: isWF
                    ? "#555"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                }}
              >
                {order.deliveryAddress.instructions}
              </Text>
            </View>
          )}
        </Card>

        {/* Delivery PIN */}
        {!isCompleted && (
          <View
            style={[
              styles.pinCard,
              {
                backgroundColor: isWF
                  ? "#4A4A4A"
                  : colors.petrolDeep,
                borderRadius: isWF
                  ? Radius.sm
                  : Radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.pinIcon,
                {
                  backgroundColor: isWF
                    ? "#666"
                    : colors.petrolMid,
                },
              ]}
            >
              <Feather
                name="lock"
                size={22}
                color={
                  isWF
                    ? "#DDD"
                    : colors.ignitionAmber
                }
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: font("display"),
                  fontSize: FontSizes.base,
                }}
              >
                Delivery PIN
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#CCCCCC"
                    : "rgba(255,255,255,0.72)",
                  fontFamily: font("body"),
                  fontSize: FontSizes.xs,
                  lineHeight: 18,
                  marginTop: 3,
                }}
              >
                Only enter your PIN after your fuel
                has arrived.
              </Text>
            </View>
          </View>
        )}

        {!isCompleted && (
          <Button
            label="Enter Delivery PIN"
            onPress={handleConfirmDelivery}
            size="lg"
            style={{
              marginTop: -Spacing.xs,
            }}
          />
        )}

        {/* Receipt */}
        <Card style={styles.section}>
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.base,
              marginBottom: Spacing.sm,
            }}
          >
            Payment summary
          </Text>

          <View style={{ gap: 8 }}>
            <DetailRow
              label={`Fuel (${order.item.litres}L × R${order.item.pricePerLitre.toFixed(2)})`}
              value={`R${order.item.subtotal.toFixed(2)}`}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Delivery fee"
              value={`R${order.deliveryFee.toFixed(2)}`}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: isWF
                    ? "#DDD"
                    : colors.divider,
                },
              ]}
            />

            <View style={styles.totalRow}>
              <Text
                style={{
                  color: isWF
                    ? "#333"
                    : colors.charcoalInk,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                }}
              >
                Total
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.ignitionAmber,
                  fontFamily: isWF
                    ? undefined
                    : "Inter_700Bold",
                  fontSize: FontSizes.lg,
                }}
              >
                R{order.totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment / delivery details */}
        <Card style={styles.section}>
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily: font("display"),
              fontSize: FontSizes.base,
              marginBottom: Spacing.sm,
            }}
          >
            Order details
          </Text>

          <View style={{ gap: 9 }}>
            <DetailRow
              label="Order number"
              value={order.orderNumber || order.id}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Payment"
              value={order.paymentMethod.label}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Order date"
              value={formatDate(order.createdAt)}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            {order.deliveredAt && (
              <DetailRow
                label="Delivered"
                value={formatDateTime(order.deliveredAt)}
                isWireframe={isWF}
                colors={colors}
                font={font}
              />
            )}
          </View>
        </Card>

        {/* Completed receipt */}
        {isCompleted && (
          <>
            {!isWF && (
              <View
                style={[
                  styles.loyaltyBanner,
                  {
                    backgroundColor: colors.amberLight,
                    borderRadius: Radius.lg,
                  },
                ]}
              >
                <Feather
                  name="award"
                  size={21}
                  color={colors.ignitionAmber}
                />

                <Text
                  style={{
                    flex: 1,
                    color: colors.amberDark,
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.sm,
                  }}
                >
                  You earned{" "}
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                    }}
                  >
                    +{order.item.litres} FuelPoints
                  </Text>{" "}
                  on this completed order!
                </Text>
              </View>
            )}

            {order.rating != null && (
              <Card style={styles.section}>
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily: font("display"),
                    fontSize: FontSizes.base,
                  }}
                >
                  Your rating
                </Text>

                <StarRating
                  rating={order.rating}
                  isWireframe={isWF}
                  colors={colors}
                />

                {order.ratingComment && (
                  <Text
                    style={{
                      color: isWF
                        ? "#555"
                        : colors.inkLight,
                      fontFamily: font("body"),
                      fontSize: FontSizes.sm,
                      lineHeight: 20,
                      marginTop: 4,
                    }}
                  >
                    "{order.ratingComment}"
                  </Text>
                )}
              </Card>
            )}
          </>
        )}

        {/* POD */}
        {isCompleted && order.podPhotoUrl && (
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily: font("display"),
                  fontSize: FontSizes.base,
                }}
              >
                Proof of delivery
              </Text>

              <Feather
                name="check-circle"
                size={17}
                color={
                  isWF
                    ? "#555"
                    : colors.dieselGreen
                }
              />
            </View>

            <Text
              style={{
                color: isWF
                  ? "#666"
                  : colors.inkLight,
                fontFamily: font("body"),
                fontSize: FontSizes.xs,
              }}
            >
              Your delivery was confirmed successfully.
            </Text>
          </Card>
        )}

        {/* Bottom actions */}
        <View style={styles.bottomActions}>
          <Button
            label="Reorder"
            onPress={handleReorder}
            variant="outline"
            size="lg"
          />

          {isCompleted && (
            <Button
              label="Back to Order History"
              onPress={() => navigation.goBack()}
              size="lg"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
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

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["5xl"],
    gap: Spacing.md,
  },

  statusHero: {
    overflow: "hidden",
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },

  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  section: {
    gap: Spacing.sm,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  trackingCard: {
    overflow: "hidden",
    borderRadius: Radius.xl,
  },

  map: {
    height: 210,
    position: "relative",
    overflow: "hidden",
  },

  etaSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  driverAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },

  fuelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  divider: {
    height: 1,
    marginVertical: 4,
  },

  instructions: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },

  pinCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },

  pinIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  loyaltyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },

  bottomActions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  timelineRow: {
    flexDirection: "row",
    minHeight: 54,
  },

  timelineIndicatorColumn: {
    width: 28,
    alignItems: "center",
  },

  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  timelineContent: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.md,
  },
});