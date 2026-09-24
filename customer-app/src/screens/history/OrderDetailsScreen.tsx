import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useDesignMode } from "../../context/DesignModeContext";
import {
  FontSizes,
  Spacing,
  Radius,
  Shadow,
} from "../../theme/tokens";

import Card from "../../components/Card";
import Button from "../../components/Button";
import TrackingMap from "../../components/TrackingMap";

import {
  orderRepository,
  OrderModel,
} from "../../repositories/OrderRepository";

interface Props {
  navigation: any;
  route?: any;
}

interface Coordinates {
  lat: number;
  lng: number;
}

function formatDate(iso?: string): string {
  if (!iso) {
    return "Not available";
  }

  const date = new Date(iso);

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso?: string): string {
  if (!iso) {
    return "Not available";
  }

  const date = new Date(iso);

  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hasValidCoordinates(
  coordinates?: Coordinates | null,
): boolean {
  if (!coordinates) {
    return false;
  }

  const lat = Number(coordinates.lat);
  const lng = Number(coordinates.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
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
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Feather
          key={star}
          name="star"
          size={13}
          color={
            star <= Math.round(rating)
              ? isWireframe
                ? "#555555"
                : colors.ignitionAmber
              : isWireframe
                ? "#CCCCCC"
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
          color: isWireframe
            ? "#666666"
            : colors.inkLight,
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
          color: isWireframe
            ? "#1A1A1A"
            : colors.charcoalInk,
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
              backgroundColor:
                completed || active
                  ? isWireframe
                    ? "#555555"
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
              backgroundColor: completed
                ? isWireframe
                  ? "#555555"
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
              ? "#777777"
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

function isWaitingForDriver(
  status: string,
  hasDriver: boolean,
): boolean {
  if (hasDriver) {
    return false;
  }

  return [
    "PAID",
    "FINDING_DRIVER",
  ].includes(status);
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

  const orderId =
    route?.params?.orderId;

  const [order, setOrder] =
    useState<OrderModel | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    const loadOrder = async () => {
      if (!orderId) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const result =
          await orderRepository.getOrderById(
            orderId,
          );

        if (mounted && result) {
          setOrder(result);
        }
      } catch (error) {
        console.error(
          "OrderDetailsScreen: failed to load order:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    const interval =
      setInterval(
        loadOrder,
        5 * 60 * 1000,
      );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

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
                ? "#777777"
                : colors.petrolDeep
            }
          />

          <Text
            style={{
              marginTop: Spacing.md,
              color: isWF
                ? "#666666"
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
                ? "#666666"
                : colors.signalRed
            }
          />

          <Text
            style={{
              marginTop: Spacing.md,
              color: isWF
                ? "#333333"
                : colors.charcoalInk,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.lg,
            }}
          >
            Order not found
          </Text>

          <Button
            label="Go Back"
            onPress={() =>
              navigation.goBack()
            }
            variant="outline"
            style={{
              marginTop: Spacing.lg,
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted =
    order.status === "COMPLETED";

  const isDelivered =
    order.status === "DELIVERED";

  const isCancelled =
    order.status === "CANCELLED";

  const hasDriver =
    !!order.driver;

  const driver =
    order.driver;

  const canShowTracking =
    !isDelivered &&
    !isCompleted &&
    !isCancelled &&
    hasDriver &&
    hasValidCoordinates(
      driver?.coordinates,
    ) &&
    hasValidCoordinates(
      order.deliveryAddress?.coordinates,
    );

  const customerAddress = [
    order.deliveryAddress.street,
    order.deliveryAddress.suburb,
    order.deliveryAddress.city,
    order.deliveryAddress.province,
    order.deliveryAddress.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  /*
   * The repository has already determined the final order amount from
   * orders.rand_amount.
   *
   * When pointsUsed is true, rand_amount has already had the R49 delivery
   * fee removed by claim_free_delivery().
   */

  const deliveryFee =
    order.pointsUsed
      ? 0
      : Number(
          order.deliveryFee ?? 49
        );

  const totalAmount =
    Number(
      order.totalAmount ?? 0
    );

  const fuelCost =
    order.pointsUsed
      ? totalAmount
      : Math.max(
          0,
          totalAmount -
            deliveryFee,
        );

  const handleCallDriver = () => {
    if (!driver?.phone) {
      return;
    }

    Linking.openURL(
      `tel:${driver.phone.replace(
        /\s/g,
        "",
      )}`,
    );
  };

  const handleConfirmDelivery = () => {
    navigation.navigate(
      "DeliveryPin",
      {
        orderId:
          order.id,
      },
    );
  };

  const handleReorder = () => {
    navigation.navigate(
      "FuelSelection",
      {
        reorder:
          order,
      },
    );
  };

  const getTimelineState = (
    step:
      | "placed"
      | "driver"
      | "enroute"
      | "delivery"
      | "completed",
  ) => {
    const progress: Record<
      string,
      number
    > = {
      PENDING_PAYMENT: 0,
      PAID: 1,
      FINDING_DRIVER: 1,
      ACCEPTED: 2,
      NAVIGATING: 3,
      ARRIVED: 4,
      DISPENSING: 4,
      DELIVERED: 4,
      COMPLETED: 5,
      CANCELLED: 0,
    };

    const indexes = {
      placed: 1,
      driver: 2,
      enroute: 3,
      delivery: 4,
      completed: 5,
    };

    const current =
      progress[order.status] ?? 0;

    const index =
      indexes[step];

    return {
      completed:
        current > index,

      active:
        current === index,
    };
  };

  const statusHeroTitle =
    isCompleted
      ? "Delivery completed"
      : isDelivered
        ? "Delivery received"
        : isCancelled
          ? "Order cancelled"
          : "Your order is on its way";

  const statusHeroSubtitle =
    isCompleted
      ? "Your fuel delivery has been confirmed."
      : isDelivered
        ? "Enter the PIN provided by your driver to complete the order."
        : isCancelled
          ? "This order has been cancelled."
          : "We're keeping an eye on your fuel.";

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
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={styles.backBtn}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={
              isWF
                ? "#333333"
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>

        <View
          style={{
            alignItems:
              "center",
          }}
        >
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.md,
            }}
          >
            Order Details
          </Text>

          <Text
            style={{
              color: isWF
                ? "#777777"
                : colors.inkFaint,
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.xs,
              marginTop: 1,
            }}
          >
            {order.orderNumber ||
              order.id}
          </Text>
        </View>

        <TouchableOpacity
          onPress={
            handleReorder
          }
          style={
            styles.backBtn
          }
        >
          <Feather
            name="refresh-cw"
            size={20}
            color={
              isWF
                ? "#333333"
                : colors.charcoalInk
            }
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={
          styles.scroll
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.statusHero,
            {
              backgroundColor:
                isWF
                  ? "#4A4A4A"
                  : isCompleted
                    ? colors.dieselGreen
                    : isDelivered
                      ? colors.petrolMid
                      : isCancelled
                        ? colors.signalRed
                        : colors.petrolDeep,

              borderRadius:
                isWF
                  ? Radius.sm
                  : Radius.xl,
            },
          ]}
        >
          {!isWF &&
            !isCompleted &&
            !isCancelled && (
              <LinearGradient
                colors={
                  isDelivered
                    ? [
                        colors.petrolMid,
                        colors.petrolDeep,
                      ]
                    : [
                        colors.petrolDeep,
                        colors.petrolMid,
                      ]
                }
                style={
                  StyleSheet.absoluteFill
                }
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
              />
            )}

          <View
            style={
              styles.heroIcon
            }
          >
            <Feather
              name={
                isCompleted
                  ? "check-circle"
                  : isDelivered
                    ? "key"
                    : isCancelled
                      ? "x-circle"
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
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.sm,
              textAlign:
                "center",
            }}
          >
            {statusHeroSubtitle}
          </Text>

          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: isWF
                ? undefined
                : "Inter_700Bold",
              fontSize:
                FontSizes["3xl"],
              marginTop: 2,
            }}
          >
            R{totalAmount.toFixed(2)}
          </Text>

          {order.pointsUsed && (
            <View
              style={[
                styles.rewardPill,
                {
                  backgroundColor:
                    isWF
                      ? "#666666"
                      : "rgba(255,255,255,0.16)",
                },
              ]}
            >
              <Feather
                name="award"
                size={14}
                color={
                  isWF
                    ? "#FFFFFF"
                    : colors.ignitionAmber
                }
              />

              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                500 FuelPoints redeemed
              </Text>
            </View>
          )}

          <Text
            style={{
              color: isWF
                ? "#CCCCCC"
                : "rgba(255,255,255,0.75)",
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.xs,
              marginTop: 4,
            }}
          >
            {statusHeroTitle}
          </Text>

          <Text
            style={{
              color: isWF
                ? "#CCCCCC"
                : "rgba(255,255,255,0.75)",
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.xs,
              marginTop: 1,
            }}
          >
            Placed{" "}
            {formatDateTime(
              order.createdAt,
            )}
          </Text>
        </View>

        {canShowTracking && (
          <>
            <View
              style={[
                styles.sectionHeading,
                {
                  marginTop:
                    Spacing.sm,
                },
              ]}
            >
              <View>
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily:
                      font("display"),
                    fontSize:
                      FontSizes.lg,
                  }}
                >
                  Live delivery
                </Text>

                <Text
                  style={{
                    color: isWF
                      ? "#666666"
                      : colors.inkLight,
                    fontFamily:
                      font("body"),
                    fontSize:
                      FontSizes.xs,
                    marginTop: 2,
                  }}
                >
                  Current driver location compared
                  with your delivery address.
                </Text>
              </View>

              <View
                style={[
                  styles.livePill,
                  {
                    backgroundColor:
                      isWF
                        ? "#D0D0D0"
                        : colors.greenLight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.liveDot,
                    {
                      backgroundColor:
                        isWF
                          ? "#555555"
                          : colors.dieselGreen,
                    },
                  ]}
                />

                <Text
                  style={{
                    color: isWF
                      ? "#444444"
                      : colors.dieselGreen,
                    fontFamily:
                      font("bodyMedium"),
                    fontSize:
                      FontSizes.xs,
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
                  backgroundColor:
                    isWF
                      ? "#FFFFFF"
                      : colors.white,

                  ...(isWF
                    ? {
                        borderWidth: 1,
                        borderColor:
                          "#D0D0D0",
                      }
                    : Shadow.sm),
                },
              ]}
            >
              <TrackingMap
                driverCoordinates={
                  driver!.coordinates!
                }
                customerCoordinates={
                  order.deliveryAddress
                    .coordinates!
                }
                driverLabel="Driver"
                customerLabel="Your delivery address"
                driverColor={
                  isWF
                    ? "#555555"
                    : colors.petrolDeep
                }
                customerColor={
                  isWF
                    ? "#777777"
                    : colors.ignitionAmber
                }
              />

              <View
                style={
                  styles.locationInfo
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: isWF
                        ? "#1A1A1A"
                        : colors.charcoalInk,
                      fontFamily:
                        font("bodyMedium"),
                      fontSize:
                        FontSizes.sm,
                    }}
                  >
                    Driver location
                  </Text>

                  <Text
                    style={{
                      color: isWF
                        ? "#666666"
                        : colors.inkLight,
                      fontFamily:
                        font("body"),
                      fontSize:
                        FontSizes.xs,
                      marginTop: 2,
                    }}
                  >
                    Updating from the driver's
                    current location every 5 minutes.
                  </Text>
                </View>

                <Feather
                  name="navigation"
                  size={20}
                  color={
                    isWF
                      ? "#555555"
                      : colors.petrolDeep
                  }
                />
              </View>
            </View>
          </>
        )}

        {isWaitingForDriver(
          order.status,
          hasDriver,
        ) && (
          <Card
            style={
              styles.waitingCard
            }
          >
            <Feather
              name="clock"
              size={20}
              color={
                isWF
                  ? "#666666"
                  : colors.ignitionAmber
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: isWF
                    ? "#222222"
                    : colors.charcoalInk,
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.sm,
                }}
              >
                Waiting for driver assignment
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#666666"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                  marginTop: 2,
                }}
              >
                Live tracking will appear once a
                driver has been assigned and
                location data is available.
              </Text>
            </View>
          </Card>
        )}

        <Card
          style={
            styles.section
          }
        >
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.base,
              marginBottom:
                Spacing.sm,
            }}
          >
            Delivery progress
          </Text>

          <TimelineStep
            title="Order placed"
            subtitle={formatDateTime(
              order.createdAt,
            )}
            {...getTimelineState(
              "placed",
            )}
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
            {...getTimelineState(
              "driver",
            )}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Driver en route"
            subtitle={
              hasDriver
                ? `${driver?.vehicleColor ?? ""} ${
                    driver?.vehicleModel ?? ""
                  }`
                : "We'll notify you when your driver is on the way"
            }
            {...getTimelineState(
              "enroute",
            )}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Delivery"
            subtitle={
              isCompleted
                ? `Delivered ${formatDateTime(
                    order.deliveredAt,
                  )}`
                : isDelivered
                  ? "Driver has delivered your fuel. PIN confirmation required."
                  : "Your driver will arrive at your delivery address"
            }
            {...getTimelineState(
              "delivery",
            )}
            isWireframe={isWF}
            colors={colors}
            font={font}
          />

          <TimelineStep
            title="Completed"
            subtitle={
              isCompleted
                ? "Fuel successfully delivered and confirmed"
                : isDelivered
                  ? "Enter the delivery PIN to complete this order"
                  : "Waiting for delivery confirmation"
            }
            {...getTimelineState(
              "completed",
            )}
            isLast
            isWireframe={isWF}
            colors={colors}
            font={font}
          />
        </Card>

        {hasDriver && (
          <Card
            style={
              styles.section
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily:
                    font("display"),
                  fontSize:
                    FontSizes.base,
                }}
              >
                Your driver
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#777777"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                {driver?.stationName}
              </Text>
            </View>

            <View
              style={
                styles.driverRow
              }
            >
              <View
                style={[
                  styles.driverAvatar,
                  {
                    backgroundColor:
                      isWF
                        ? "#D0D0D0"
                        : colors.petrolDeep,
                  },
                ]}
              >
                <Feather
                  name="user"
                  size={24}
                  color={
                    isWF
                      ? "#555555"
                      : "#FFFFFF"
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily:
                      font("bodyMedium"),
                    fontSize:
                      FontSizes.base,
                  }}
                >
                  {driver?.name}
                </Text>

                <StarRating
                  rating={
                    driver?.rating ?? 0
                  }
                  isWireframe={isWF}
                  colors={colors}
                />

                <Text
                  style={{
                    color: isWF
                      ? "#666666"
                      : colors.inkLight,
                    fontFamily:
                      font("body"),
                    fontSize:
                      FontSizes.xs,
                    marginTop: 3,
                  }}
                >
                  {driver?.rating ?? 0} stars
                </Text>
              </View>

              {!isCompleted &&
                !isDelivered && (
                  <TouchableOpacity
                    onPress={
                      handleCallDriver
                    }
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor:
                          isWF
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
                          ? "#555555"
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
                  borderTopColor:
                    isWF
                      ? "#DDDDDD"
                      : colors.divider,
                },
              ]}
            >
              <Feather
                name="truck"
                size={15}
                color={
                  isWF
                    ? "#777777"
                    : colors.inkLight
                }
              />

              <Text
                style={{
                  flex: 1,
                  color: isWF
                    ? "#555555"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                {driver?.vehicleColor}{" "}
                {driver?.vehicleModel} ·{" "}
                {driver?.vehicleReg}
              </Text>
            </View>
          </Card>
        )}

        <Card
          style={
            styles.section
          }
        >
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.base,
            }}
          >
            Fuel order
          </Text>

          <View
            style={[
              styles.fuelBadge,
              {
                backgroundColor:
                  isWF
                    ? "#E0E0E0"
                    : colors.petrolLight,
                borderRadius:
                  isWF
                    ? Radius.sm
                    : Radius.lg,
              },
            ]}
          >
            <Feather
              name="droplet"
              size={26}
              color={
                isWF
                  ? "#555555"
                  : colors.petrolDeep
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  color: isWF
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily:
                    font("displayBold"),
                  fontSize:
                    FontSizes.xl,
                }}
              >
                {order.item.litres}L
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#555555"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.sm,
                  marginTop: 2,
                }}
              >
                {order.item.fuelType}
              </Text>
            </View>

            <View
              style={{
                alignItems:
                  "flex-end",
              }}
            >
              <Text
                style={{
                  color: isWF
                    ? "#333333"
                    : colors.charcoalInk,
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.sm,
                }}
              >
                R
                {order.item.pricePerLitre.toFixed(
                  2,
                )}
                /L
              </Text>

              <Text
                style={{
                  color: isWF
                    ? "#666666"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                  marginTop: 2,
                }}
              >
                R{fuelCost.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        <Card
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={{
                color: isWF
                  ? "#1A1A1A"
                  : colors.charcoalInk,
                fontFamily:
                  font("display"),
                fontSize:
                  FontSizes.base,
              }}
            >
              Delivery address
            </Text>

            <Feather
              name="map-pin"
              size={17}
              color={
                isWF
                  ? "#666666"
                  : colors.petrolDeep
              }
            />
          </View>

          <Text
            style={{
              color: isWF
                ? "#333333"
                : colors.charcoalInk,
              fontFamily:
                font("bodyMedium"),
              fontSize:
                FontSizes.sm,
              lineHeight: 21,
            }}
          >
            {customerAddress}
          </Text>

          {order.deliveryAddress
            .instructions && (
            <View
              style={[
                styles.instructions,
                {
                  backgroundColor:
                    isWF
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
                    ? "#666666"
                    : colors.inkLight
                }
              />

              <Text
                style={{
                  flex: 1,
                  color: isWF
                    ? "#555555"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                {
                  order
                    .deliveryAddress
                    .instructions
                }
              </Text>
            </View>
          )}
        </Card>

        {isDelivered && (
          <>
            <View
              style={[
                styles.pinCard,
                {
                  backgroundColor:
                    isWF
                      ? "#4A4A4A"
                      : colors.petrolDeep,
                  borderRadius:
                    isWF
                      ? Radius.sm
                      : Radius.xl,
                },
              ]}
            >
              <View
                style={[
                  styles.pinIcon,
                  {
                    backgroundColor:
                      isWF
                        ? "#666666"
                        : colors.petrolMid,
                  },
                ]}
              >
                <Feather
                  name="lock"
                  size={22}
                  color={
                    isWF
                      ? "#DDDDDD"
                      : colors.ignitionAmber
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily:
                      font("display"),
                    fontSize:
                      FontSizes.base,
                  }}
                >
                  Delivery PIN required
                </Text>

                <Text
                  style={{
                    color: isWF
                      ? "#CCCCCC"
                      : "rgba(255,255,255,0.72)",
                    fontFamily:
                      font("body"),
                    fontSize:
                      FontSizes.xs,
                    lineHeight: 18,
                    marginTop: 3,
                  }}
                >
                  Your driver has delivered the
                  fuel. Ask the driver for the 4-digit
                  PIN and enter it to complete your
                  order.
                </Text>
              </View>
            </View>

            <Button
              label="Enter Delivery PIN"
              onPress={
                handleConfirmDelivery
              }
              size="lg"
              style={{
                marginTop:
                  -Spacing.xs,
              }}
            />
          </>
        )}

        <Card
          style={
            styles.section
          }
        >
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.base,
              marginBottom:
                Spacing.sm,
            }}
          >
            Payment summary
          </Text>

          <View
            style={{
              gap: 8,
            }}
          >
            <DetailRow
              label={`Fuel (${order.item.litres}L × R${order.item.pricePerLitre.toFixed(
                2,
              )})`}
              value={`R${fuelCost.toFixed(
                2,
              )}`}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Delivery fee"
              value={`R${deliveryFee.toFixed(
                2,
              )}`}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            {order.pointsUsed && (
              <DetailRow
                label="Reward"
                value="500 FuelPoints redeemed"
                isWireframe={isWF}
                colors={colors}
                font={font}
              />
            )}

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    isWF
                      ? "#DDDDDD"
                      : colors.divider,
                },
              ]}
            />

            <View
              style={
                styles.totalRow
              }
            >
              <Text
                style={{
                  color: isWF
                    ? "#333333"
                    : colors.charcoalInk,
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.base,
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
                  fontSize:
                    FontSizes.lg,
                }}
              >
                R{totalAmount.toFixed(
                  2,
                )}
              </Text>
            </View>
          </View>
        </Card>

        <Card
          style={
            styles.section
          }
        >
          <Text
            style={{
              color: isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.base,
              marginBottom:
                Spacing.sm,
            }}
          >
            Order details
          </Text>

          <View
            style={{
              gap: 9,
            }}
          >
            <DetailRow
              label="Order number"
              value={
                order.orderNumber ||
                order.id
              }
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Payment"
              value={
                order.paymentMethod.label
              }
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            <DetailRow
              label="Order date"
              value={formatDate(
                order.createdAt,
              )}
              isWireframe={isWF}
              colors={colors}
              font={font}
            />

            {order.deliveredAt && (
              <DetailRow
                label="Delivered"
                value={formatDateTime(
                  order.deliveredAt,
                )}
                isWireframe={isWF}
                colors={colors}
                font={font}
              />
            )}
          </View>
        </Card>

        {isCompleted && (
          <>
            {!isWF && (
              <View
                style={[
                  styles.loyaltyBanner,
                  {
                    backgroundColor:
                      colors.amberLight,
                    borderRadius:
                      Radius.lg,
                  },
                ]}
              >
                <Feather
                  name="award"
                  size={21}
                  color={
                    colors.ignitionAmber
                  }
                />

                <Text
                  style={{
                    flex: 1,
                    color:
                      colors.amberDark,
                    fontFamily:
                      font("bodyMedium"),
                    fontSize:
                      FontSizes.sm,
                  }}
                >
                  You earned{" "}
                  <Text
                    style={{
                      fontFamily:
                        "Inter_700Bold",
                    }}
                  >
                    +{order.item.litres} FuelPoints
                  </Text>{" "}
                  on this completed order!
                </Text>
              </View>
            )}

            {order.rating != null && (
              <Card
                style={
                  styles.section
                }
              >
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily:
                      font("display"),
                    fontSize:
                      FontSizes.base,
                  }}
                >
                  Your rating
                </Text>

                <StarRating
                  rating={
                    order.rating
                  }
                  isWireframe={isWF}
                  colors={colors}
                />

                {order.ratingComment && (
                  <Text
                    style={{
                      color: isWF
                        ? "#555555"
                        : colors.inkLight,
                      fontFamily:
                        font("body"),
                      fontSize:
                        FontSizes.sm,
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

        {isCompleted &&
          order.podPhotoUrl && (
            <Card
              style={
                styles.section
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={{
                    color: isWF
                      ? "#1A1A1A"
                      : colors.charcoalInk,
                    fontFamily:
                      font("display"),
                    fontSize:
                      FontSizes.base,
                  }}
                >
                  Proof of delivery
                </Text>

                <Feather
                  name="check-circle"
                  size={17}
                  color={
                    isWF
                      ? "#555555"
                      : colors.dieselGreen
                  }
                />
              </View>

              <Text
                style={{
                  color: isWF
                    ? "#666666"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                Your delivery was confirmed
                successfully.
              </Text>
            </Card>
          )}

        <View
          style={
            styles.bottomActions
          }
        >
          <Button
            label="Reorder"
            onPress={
              handleReorder
            }
            variant="outline"
            size="lg"
          />

          {isCompleted && (
            <Button
              label="Back to Order History"
              onPress={() =>
                navigation.goBack()
              }
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
    backgroundColor:
      "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: 4,
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

  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },

  waitingCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
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

  starRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 3,
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