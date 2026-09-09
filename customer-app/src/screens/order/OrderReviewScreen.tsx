import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";
import { orderRepository } from "../../repositories/OrderRepository";
import { userRepository } from "../../repositories/UserRepository";
import { supabase } from "../../services/supabase";
import { createPayFastPayment } from "../../services/payfast";
interface Props {
  navigation: any;
  route?: any;
}

export default function OrderReviewScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();
  const insets = useSafeAreaInsets();

  // Pull order params — fall back to sensible defaults so screen always renders
  const fuelType = route?.params?.fuelType ?? "Petrol 95";
  const litres = route?.params?.litres ?? 40;
  const pricePerLitre = route?.params?.pricePerLitre ?? 23.45;
  const deliveryAddressId = route?.params?.deliveryAddressId ?? "addr_001";
  const scheduledAt = route?.params?.scheduledAt ?? null;
  const paymentMethodId = route?.params?.paymentMethodId ?? "pm_001";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userState, setUserState] = useState(userRepository);

  const address = route?.params?.deliveryAddress || {
    id: deliveryAddressId,
    label: "Home",
    street: "18 Kenneth Kaunda Road",
    suburb: "Durban North",
    city: "Durban",
    province: "KwaZulu-Natal",
    postalCode: "4051",
    coordinates: { lat: -29.8, lng: 31.0333 },
  };

  const pm = {
    id: paymentMethodId,
    type: "card" as const,
    label: "FNB Corporate Cheque ••• 4821",
    last4: "4821",
    brand: "visa" as const,
    isDefault: true,
  };

  const deliveryFee = 49.0;
  const subtotal = parseFloat((litres * pricePerLitre).toFixed(2));
  const total = subtotal + deliveryFee;

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      // --------------------------------------------------
      // 1. Get the logged-in FuelNow application user
      // --------------------------------------------------

      const userId = await userRepository.getCurrentUserId();

      // --------------------------------------------------
      // 2. Get the actual Auth user
      // --------------------------------------------------

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Your session has expired. Please log in again.");
      }

      // --------------------------------------------------
      // 3. Find the customer's actual address UUID
      // --------------------------------------------------

      const addressId = deliveryAddressId;

      if (!addressId || addressId === "addr_001") {
        throw new Error("Please select a valid delivery address.");
      }

      // --------------------------------------------------
      // 4. Create REAL order in Supabase
      // --------------------------------------------------

      const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));

      /*
       * rand_amount is currently the field
       * used by your database schema for the
       * order's amount.
       */
      const { data: createdOrder, error } = await supabase.rpc("create_order", {
        p_customer_id: userId,

        p_driver_id: null,

        p_address_id: addressId,

        p_fuel_type_id: route?.params?.fuelTypeId ?? null,

        p_order_method: "CUSTOMER_APP",

        p_volume_litres: litres,

        p_rand_amount: total,

        p_delivery_type: scheduledAt ? "Scheduled" : "Deliver Now",

        p_scheduled_date_time: scheduledAt,

        p_status: "PENDING_PAYMENT",

        p_delivery_pin: deliveryPin,
      });

      if (error) {
        throw error;
      }

      if (!createdOrder) {
        throw new Error("The order could not be created.");
      }

      // --------------------------------------------------
      // 5. Ask Supabase to create the PayFast request
      // --------------------------------------------------

      const payment = await createPayFastPayment(createdOrder.order_id);

      // --------------------------------------------------
      // 6. Open PayFast Sandbox
      // --------------------------------------------------

      navigation.navigate("PayFastCheckout", {
        paymentUrl: payment.paymentUrl,

        paymentData: payment.paymentData,

        orderId: createdOrder.order_id,
      });
    } catch (e: any) {
      console.error("Order/payment error:", e);

      setError(e?.message ?? "Unable to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Shared colours ─────────────────────────────────────────────────────────
  const bg = isWF ? "#F0F0F0" : colors.warmAsh;
  const cardBg = isWF ? "#FFFFFF" : colors.white;
  const border = isWF ? "#DDDDDD" : colors.divider;
  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;
  const subColor = isWF ? "#555555" : colors.inkLight;

  // ── Sub-component: label / value row ──────────────────────────────────────
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
          fontFamily: font("body"),
          fontSize: FontSizes.sm,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: large ? (isWF ? "#1A1A1A" : colors.petrolDeep) : headingColor,
          fontFamily: mono
            ? isWF
              ? undefined
              : "Inter_600SemiBold"
            : font("bodyMedium"),
          fontSize: large ? FontSizes.lg : FontSizes.base,
        }}
      >
        {value}
      </Text>
    </View>
  );

  // ── Sub-component: section card ───────────────────────────────────────────
  const Section = ({
    icon,
    emoji,
    title,
    children,
  }: {
    icon?: string;
    emoji?: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: cardBg,
          borderColor: border,
          borderRadius: isWF ? Radius.sm : Radius.lg,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        {!isWF && (
          <View
            style={[styles.iconCircle, { backgroundColor: colors.petrolLight }]}
          >
            {emoji ? (
              <Text style={{ fontSize: 16 }}>{emoji}</Text>
            ) : (
              <Feather name={icon as any} size={16} color={colors.petrolDeep} />
            )}
          </View>
        )}
        <Text
          style={{
            color: headingColor,
            fontFamily: font("display"),
            fontSize: FontSizes.base,
          }}
        >
          {title}
        </Text>
      </View>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={headingColor} />
        </TouchableOpacity>
        <Text
          style={{
            color: headingColor,
            fontFamily: font("display"),
            fontSize: FontSizes.md,
          }}
        >
          Order Review
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Fuel card */}
        <Section emoji="⛽" title="Fuel Order">
          <Row label="Fuel type" value={fuelType} />
          <Row label="Volume" value={`${litres.toFixed(1)} litres`} mono />
          <Row
            label="Unit price"
            value={`R${pricePerLitre.toFixed(2)}/L`}
            mono
          />
          <View style={[styles.divider, { backgroundColor: border }]} />
          <Row label="Fuel subtotal" value={`R${subtotal.toFixed(2)}`} mono />
        </Section>

        {/* Delivery card */}
        <Section icon="map-pin" title="Delivery">
          <Row label="Address" value={`${address.street}`} />
          <Row label="Suburb" value={`${address.suburb}, ${address.city}`} />
          <Row label="Timing" value={scheduledAt ?? "As soon as possible"} />
          <Row label="Est. arrival" value="20–35 minutes" />
        </Section>

        {/* Payment card */}
        <Section icon="credit-card" title="Payment">
          <Row label="Method" value={pm.label} />
          <Row label="Billing" value="Charged on delivery" />
        </Section>

        {/* Cost breakdown */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: cardBg,
              borderColor: isWF ? "#AAAAAA" : colors.petrolDeep,
              borderRadius: isWF ? Radius.sm : Radius.lg,
              borderWidth: 1.5,
            },
          ]}
        >
          {!isWF && (
            <View
              style={[
                styles.accentStripe,
                { backgroundColor: colors.petrolDeep },
              ]}
            />
          )}
          <Text
            style={{
              color: headingColor,
              fontFamily: font("display"),
              fontSize: FontSizes.base,
              marginBottom: Spacing.md,
            }}
          >
            Cost Breakdown
          </Text>
          <View style={{ gap: 6 }}>
            <Row
              label={`Fuel (${litres}L × R${pricePerLitre.toFixed(2)})`}
              value={`R${subtotal.toFixed(2)}`}
              mono
            />
            <Row
              label="Delivery fee"
              value={`R${deliveryFee.toFixed(2)}`}
              mono
            />
            <Row label="Service fee" value="R0.00" mono />
            <View style={[styles.divider, { backgroundColor: border }]} />
            <Row
              label="Total (incl. VAT)"
              value={`R${total.toFixed(2)}`}
              mono
              large
            />
          </View>
        </View>

        {/* T&C */}
        <Text
          style={{
            color: isWF ? "#AAAAAA" : colors.inkFaint,
            fontFamily: font("body"),
            fontSize: FontSizes.xs,
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          By confirming you agree to FuelNow&apos;s Terms of Service. Delivery
          fee may vary based on your exact location.
        </Text>

        {error ? (
          <Text
            style={{
              color: isWF ? "#555" : colors.signalRed,
              fontFamily: font("body"),
              fontSize: FontSizes.sm,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        ) : null}
      </ScrollView>

      {/* ── Sticky confirm button at bottom ───────────────────────────────── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: cardBg,
            borderTopColor: border,
            paddingBottom:
              Platform.OS === "web"
                ? Spacing.lg
                : Math.max(insets.bottom, Spacing.base),
          },
        ]}
      >
        <View style={styles.totalPreview}>
          <Text
            style={{
              color: subColor,
              fontFamily: font("body"),
              fontSize: FontSizes.xs,
            }}
          >
            Total due
          </Text>
          <Text
            style={{
              color: headingColor,
              fontFamily: isWF ? undefined : "Inter_700Bold",
              fontSize: FontSizes.xl,
            }}
          >
            R{total.toFixed(2)}
          </Text>
        </View>
        <Button
          label={loading ? "Placing order..." : "Confirm Order →"}
          onPress={handleConfirm}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth={false}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === "web" ? ("100vh" as any) : "100%",
    maxHeight: Platform.OS === "web" ? ("100vh" as any) : "100%",
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing["3xl"],
    gap: Spacing.md,
  },
  sectionCard: {
    padding: Spacing.base,
    borderWidth: 1,
    gap: Spacing.md,
    position: "relative",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: { height: 1, marginVertical: Spacing.xs },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.base,
    borderTopWidth: 1,
  },
  totalPreview: { alignItems: "flex-start" },
});
