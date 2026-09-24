import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import {
  FontSizes,
  Spacing,
  Radius,
} from "../../theme/tokens";

import Button from "../../components/Button";

import { userRepository } from "../../repositories/UserRepository";
import { supabase } from "../../services/supabase";
import { createPayFastPaymentData } from "../../services/payfast";

interface Props {
  navigation: any;
  route?: any;
}

export default function OrderReviewScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const insets =
    useSafeAreaInsets();

  const fuelType =
    route?.params?.fuelType ??
    "Petrol 95";

  const fuelTypeId =
    route?.params?.fuelTypeId ??
    null;

  const litres =
    Number(
      route?.params?.litres ??
        40,
    );

  const pricePerLitre =
    Number(
      route?.params?.pricePerLitre ??
        23.45,
    );

  const deliveryAddressId =
    route?.params?.deliveryAddressId ??
    "addr_001";

  const scheduledAt =
    route?.params?.scheduledAt ??
    null;

  const deliveryFee = 49;

  const subtotal =
    Number(
      (
        litres *
        pricePerLitre
      ).toFixed(2),
    );

  const normalTotal =
    Number(
      (
        subtotal +
        deliveryFee
      ).toFixed(2),
    );

  const [loading, setLoading] =
    useState(false);

  const [loadingPoints, setLoadingPoints] =
    useState(true);

  const [error, setError] =
    useState("");

  const [availablePoints, setAvailablePoints] =
    useState(0);

  const [useFreeDelivery, setUseFreeDelivery] =
    useState(false);

  const [claimApplied, setClaimApplied] =
    useState(false);

  const [claimedOrderId, setClaimedOrderId] =
    useState<string | null>(null);

  const address =
    route?.params?.deliveryAddress || {
      id: deliveryAddressId,
      label: "Home",
      street:
        "18 Kenneth Kaunda Road",
      suburb: "Durban North",
      city: "Durban",
      province:
        "KwaZulu-Natal",
      postalCode: "4051",
      coordinates: {
        lat: -29.8,
        lng: 31.0333,
      },
    };

  const loadPoints =
    useCallback(async () => {
      try {
        setLoadingPoints(true);

        const {
          data,
          error: rewardError,
        } = await supabase.rpc(
          "get_customer_rewards",
        );

        if (rewardError) {
          throw rewardError;
        }

        const row =
          Array.isArray(data)
            ? data[0]
            : data;

        setAvailablePoints(
          Number(
            row?.points ?? 0,
          ),
        );
      } catch (err) {
        console.error(
          "OrderReviewScreen: failed to load FuelPoints:",
          err,
        );

        setAvailablePoints(0);
      } finally {
        setLoadingPoints(false);
      }
    }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const canUseFreeDelivery =
    availablePoints >= 500;

  const deliveryFeeAfterReward =
    useFreeDelivery &&
    canUseFreeDelivery
      ? 0
      : deliveryFee;

  const total =
    Number(
      (
        subtotal +
        deliveryFeeAfterReward
      ).toFixed(2),
    );

  const handleConfirm =
    async () => {
      setLoading(true);
      setError("");

      try {
        const userId =
          await userRepository.getCurrentUserId();

        const {
          data: authData,
          error: authError,
        } =
          await supabase.auth.getUser();

        if (
          authError ||
          !authData.user
        ) {
          throw new Error(
            "Your session has expired. Please log in again.",
          );
        }

        const addressId =
          deliveryAddressId;

        if (
          !addressId ||
          addressId === "addr_001"
        ) {
          throw new Error(
            "Please select a valid delivery address.",
          );
        }

        if (
          !fuelTypeId
        ) {
          throw new Error(
            "Please select a valid fuel type.",
          );
        }

        if (
          useFreeDelivery &&
          !canUseFreeDelivery
        ) {
          throw new Error(
            "You need 500 FuelPoints to claim free delivery.",
          );
        }

        const deliveryPin =
          String(
            Math.floor(
              1000 +
                Math.random() *
                  9000,
            ),
          );

        const {
          data: createdOrder,
          error: orderError,
        } =
          await supabase.rpc(
            "create_order",
            {
              p_customer_id:
                userId,

              p_driver_id:
                null,

              p_address_id:
                addressId,

              p_fuel_type_id:
                fuelTypeId,

              p_order_method:
                "CUSTOMER_APP",

              p_volume_litres:
                litres,

              p_rand_amount:
                normalTotal,

              p_delivery_type:
                scheduledAt
                  ? "Scheduled"
                  : "Deliver Now",

              p_scheduled_date_time:
                route?.params
                  ?.scheduledDateTime ??
                (
                  scheduledAt
                    ? new Date().toISOString()
                    : null
                ),

              p_status:
                "PENDING_PAYMENT",

              p_delivery_pin:
                deliveryPin,
            },
          );

        if (orderError) {
          throw orderError;
        }

        if (!createdOrder) {
          throw new Error(
            "The order could not be created. Please try again.",
          );
        }

        const orderId =
          (createdOrder as any)
            ?.order_id ||
          (createdOrder as any)
            ?.id ||
          (
            Array.isArray(
              createdOrder,
            )
              ? (
                  createdOrder[0] as any
                )?.order_id ||
                (
                  createdOrder[0] as any
                )?.id
              : null
          );

        if (!orderId) {
          console.error(
            "Unexpected createdOrder response:",
            createdOrder,
          );

          throw new Error(
            "Could not extract the order ID.",
          );
        }

        let finalTotal =
          Number(
            (
              createdOrder as any
            )?.rand_amount ??
              normalTotal,
          );

        /*
         * Claim the reward only after
         * the order exists and before
         * payment starts.
         *
         * The RPC verifies the actual
         * points balance and changes
         * the order total in the database.
         */
        if (
          useFreeDelivery
        ) {
          const {
            data: claimResult,
            error: claimError,
          } =
            await supabase.rpc(
              "claim_free_delivery",
              {
                p_order_id:
                  orderId,
              },
            );

          if (claimError) {
            throw claimError;
          }

          const claim =
            Array.isArray(
              claimResult,
            )
              ? claimResult[0]
              : claimResult;

          if (
            !claim?.success
          ) {
            throw new Error(
              "Free delivery could not be claimed.",
            );
          }

          finalTotal =
            Number(
              claim.total_amount ??
                0,
            );

          setClaimApplied(
            true,
          );

          setClaimedOrderId(
            orderId,
          );
        }

        console.log(
          "Created order:",
          orderId,
        );

        console.log(
          "Final payment total:",
          finalTotal,
        );

        if (
          !authData.user.email
        ) {
          throw new Error(
            "No email address is associated with this account.",
          );
        }

        const {
          paymentUrl,
          paymentData,
        } =
          await createPayFastPaymentData({
            orderId,
          });

        navigation.navigate(
          "PayFastCheckout",
          {
            paymentUrl,
            paymentData,
            orderId,
          },
        );
      } catch (e: any) {
        console.error(
          "Order/payment error:",
          e,
        );

        setError(
          e?.message ??
            "Unable to start payment. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

  const bg =
    isWF
      ? "#F0F0F0"
      : colors.warmAsh;

  const cardBg =
    isWF
      ? "#FFFFFF"
      : colors.white;

  const border =
    isWF
      ? "#DDDDDD"
      : colors.divider;

  const headingColor =
    isWF
      ? "#1A1A1A"
      : colors.charcoalInk;

  const subColor =
    isWF
      ? "#555555"
      : colors.inkLight;

  const Row = ({
    label,
    value,
    mono = false,
    large = false,
  }: {
    label: string;
    value: string;
    mono?: boolean;
    large?: boolean;
  }) => (
    <View style={styles.row}>
      <Text
        style={{
          color: subColor,
          fontFamily:
            font("body"),
          fontSize:
            FontSizes.sm,
          flex: 1,
          paddingRight:
            Spacing.sm,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: large
            ? isWF
              ? "#1A1A1A"
              : colors.petrolDeep
            : headingColor,
          fontFamily: mono
            ? isWF
              ? undefined
              : "Inter_600SemiBold"
            : font("bodyMedium"),
          fontSize: large
            ? FontSizes.lg
            : FontSizes.base,
          textAlign:
            "right",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );

  const Section = ({
    icon,
    emoji,
    title,
    children,
  }: {
    icon?: string;
    emoji?: string;
    title: string;
    children:
      React.ReactNode;
  }) => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor:
            cardBg,
          borderColor:
            border,
          borderRadius:
            isWF
              ? Radius.sm
              : Radius.lg,
        },
      ]}
    >
      <View
        style={
          styles.sectionHeader
        }
      >
        {!isWF && (
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor:
                  colors.petrolLight,
              },
            ]}
          >
            {emoji ? (
              <Text
                style={{
                  fontSize: 16,
                }}
              >
                {emoji}
              </Text>
            ) : (
              <Feather
                name={
                  icon as any
                }
                size={16}
                color={
                  colors.petrolDeep
                }
              />
            )}
          </View>
        )}

        <Text
          style={{
            color:
              headingColor,
            fontFamily:
              font("display"),
            fontSize:
              FontSizes.base,
          }}
        >
          {title}
        </Text>
      </View>

      <View
        style={
          styles.sectionContent
        }
      >
        {children}
      </View>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            bg,
          paddingTop:
            insets.top,
        },
      ]}
    >
      <View
        style={styles.topBar}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
          style={
            styles.backBtn
          }
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={
              headingColor
            }
          />
        </TouchableOpacity>

        <Text
          style={{
            color:
              headingColor,
            fontFamily:
              font("display"),
            fontSize:
              FontSizes.md,
          }}
        >
          Order Review
        </Text>

        <View
          style={{
            width: 40,
          }}
        />
      </View>

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.scroll
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        bounces={true}
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        <Section
          emoji="⛽"
          title="Fuel Order"
        >
          <Row
            label="Fuel type"
            value={fuelType}
          />

          <Row
            label="Volume"
            value={`${litres.toFixed(
              1,
            )} litres`}
            mono
          />

          <Row
            label="Unit price"
            value={`R${pricePerLitre.toFixed(
              2,
            )}/L`}
            mono
          />

          <View
            style={[
              styles.divider,
              {
                backgroundColor:
                  border,
              },
            ]}
          />

          <Row
            label="Fuel subtotal"
            value={`R${subtotal.toFixed(
              2,
            )}`}
            mono
          />
        </Section>

        <Section
          icon="map-pin"
          title="Delivery"
        >
          <Row
            label="Address"
            value={
              address.street
            }
          />

          <Row
            label="Suburb"
            value={`${address.suburb}, ${address.city}`}
          />

          <Row
            label="Timing"
            value={
              scheduledAt ??
              "As soon as possible"
            }
          />

          <Row
            label="Est. arrival"
            value="20–35 minutes"
          />
        </Section>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor:
                cardBg,
              borderColor:
                canUseFreeDelivery
                  ? isWF
                    ? "#888888"
                    : colors.petrolDeep
                  : border,
              borderRadius:
                isWF
                  ? Radius.sm
                  : Radius.lg,
              borderWidth: 1.5,
            },
          ]}
        >
          <View
            style={
              styles.rewardHeader
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={{
                  color:
                    headingColor,
                  fontFamily:
                    font("display"),
                  fontSize:
                    FontSizes.base,
                }}
              >
                Free Delivery
              </Text>

              <Text
                style={{
                  color:
                    subColor,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.xs,
                  marginTop:
                    4,
                }}
              >
                Use 500 FuelPoints to
                waive the R49 delivery
                fee.
              </Text>
            </View>

            <Switch
              value={
                useFreeDelivery
              }
              onValueChange={
                setUseFreeDelivery
              }
              disabled={
                loading ||
                loadingPoints ||
                !canUseFreeDelivery
              }
              trackColor={{
                false:
                  isWF
                    ? "#CCCCCC"
                    : colors.ashDark,
                true:
                  isWF
                    ? "#888888"
                    : colors.petrolDeep,
              }}
              thumbColor={
                isWF
                  ? "#FFFFFF"
                  : colors.white
              }
            />
          </View>

          <View
            style={
              styles.rewardBalance
            }
          >
            <Feather
              name={
                canUseFreeDelivery
                  ? "check-circle"
                  : "lock"
              }
              size={16}
              color={
                canUseFreeDelivery
                  ? isWF
                    ? "#555"
                    : colors.dieselGreen
                  : isWF
                    ? "#888"
                    : colors.inkFaint
              }
            />

            <Text
              style={{
                flex: 1,
                color:
                  subColor,
                fontFamily:
                  font("body"),
                fontSize:
                  FontSizes.xs,
              }}
            >
              {loadingPoints
                ? "Checking your FuelPoints..."
                : canUseFreeDelivery
                  ? `${availablePoints} FuelPoints available`
                  : `${availablePoints} FuelPoints available. You need ${500 - availablePoints} more.`}
            </Text>
          </View>

          {useFreeDelivery &&
            canUseFreeDelivery ? (
            <View
              style={[
                styles.rewardApplied,
                {
                  backgroundColor:
                    isWF
                      ? "#E5E5E5"
                      : `${colors.dieselGreen}18`,
                  borderColor:
                    isWF
                      ? "#888"
                      : colors.dieselGreen,
                },
              ]}
            >
              <Feather
                name="gift"
                size={16}
                color={
                  isWF
                    ? "#555"
                    : colors.dieselGreen
                }
              />

              <Text
                style={{
                  flex: 1,
                  color:
                    isWF
                      ? "#333"
                      : colors.charcoalInk,
                  fontFamily:
                    font("bodyMedium"),
                  fontSize:
                    FontSizes.xs,
                }}
              >
                500 points will be redeemed
                and your R49 delivery fee
                will be waived.
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor:
                cardBg,
              borderColor:
                isWF
                  ? "#AAAAAA"
                  : colors.petrolDeep,
              borderRadius:
                isWF
                  ? Radius.sm
                  : Radius.lg,
              borderWidth: 1.5,
            },
          ]}
        >
          {!isWF && (
            <View
              style={[
                styles.accentStripe,
                {
                  backgroundColor:
                    colors.petrolDeep,
                },
              ]}
            />
          )}

          <Text
            style={{
              color:
                headingColor,
              fontFamily:
                font("display"),
              fontSize:
                FontSizes.base,
              marginBottom:
                Spacing.md,
            }}
          >
            Cost Breakdown
          </Text>

          <View
            style={
              styles.sectionContent
            }
          >
            <Row
              label={`Fuel (${litres}L × R${pricePerLitre.toFixed(
                2,
              )})`}
              value={`R${subtotal.toFixed(
                2,
              )}`}
              mono
            />

            <Row
              label="Delivery fee"
              value={`R${deliveryFeeAfterReward.toFixed(
                2,
              )}`}
              mono
            />

            {useFreeDelivery &&
            canUseFreeDelivery ? (
              <Row
                label="FuelPoints discount"
                value="-R49.00"
                mono
              />
            ) : null}

            <Row
              label="Service fee"
              value="R0.00"
              mono
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor:
                    border,
                },
              ]}
            />

            <Row
              label="Total (incl. VAT)"
              value={`R${total.toFixed(
                2,
              )}`}
              mono
              large
            />
          </View>
        </View>

        <Text
          style={{
            color:
              isWF
                ? "#AAAAAA"
                : colors.inkFaint,
            fontFamily:
              font("body"),
            fontSize:
              FontSizes.xs,
            textAlign:
              "center",
            lineHeight: 18,
          }}
        >
          By confirming you agree to
          FuelNow&apos;s Terms of
          Service. Delivery fee may
          vary based on your exact
          location.
        </Text>

        {error ? (
          <Text
            style={{
              color:
                isWF
                  ? "#555"
                  : colors.signalRed,
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.sm,
              textAlign:
                "center",
            }}
          >
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor:
              cardBg,
            borderTopColor:
              border,
            justifyContent:
              "space-between",
            paddingBottom:
              Platform.OS ===
              "web"
                ? Spacing.base
                : Math.max(
                    insets.bottom,
                    Spacing.base,
                  ),
          },
        ]}
      >
        <View
          style={
            styles.totalPreview
          }
        >
          <Text
            style={{
              color: subColor,
              fontFamily:
                font("body"),
              fontSize:
                FontSizes.xs,
            }}
          >
            Total due
          </Text>

          <Text
            style={{
              color:
                headingColor,
              fontFamily:
                isWF
                  ? undefined
                  : "Inter_700Bold",
              fontSize:
                FontSizes.xl,
            }}
          >
            R{total.toFixed(2)}
          </Text>
        </View>

        <Button
          label={
            loading
              ? "Starting payment..."
              : "Confirm Order →"
          }
          onPress={
            handleConfirm
          }
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth={false}
          style={{
            minWidth: 160,
          }}
        />
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 0,
    },

    topBar: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal:
        Spacing.base,
      paddingVertical:
        Spacing.md,
      flexShrink: 0,
    },

    backBtn: {
      width: 40,
      height: 40,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    scrollView: {
      flex: 1,
      minHeight: 0,
    },

    scroll: {
      paddingHorizontal:
        Spacing.base,
      paddingTop:
        Spacing.sm,
      paddingBottom:
        Spacing["4xl"] +
        40,
      gap: Spacing.md,
    },

    sectionCard: {
      padding:
        Spacing.base,
      borderWidth: 1,
      gap: Spacing.md,
      position:
        "relative",
    },

    sectionHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: Spacing.sm,
    },

    sectionContent: {
      gap: 6,
    },

    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    accentStripe: {
      position:
        "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius:
        Radius.lg,
      borderBottomLeftRadius:
        Radius.lg,
    },

    row: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      minHeight: 28,
    },

    divider: {
      height: 1,
      marginVertical:
        Spacing.xs,
    },

    rewardHeader: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: Spacing.md,
    },

    rewardBalance: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: Spacing.sm,
      marginTop:
        Spacing.sm,
    },

    rewardApplied: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: Spacing.sm,
      padding:
        Spacing.sm,
      borderWidth: 1,
      borderRadius:
        Radius.md,
      marginTop:
        Spacing.sm,
    },

    footer: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: Spacing.md,
      paddingHorizontal:
        Spacing.base,
      paddingTop:
        Spacing.base,
      borderTopWidth: 1,
      flexShrink: 0,
      minHeight: 90,
    },

    totalPreview: {
      alignItems:
        "flex-start",
    },
  });