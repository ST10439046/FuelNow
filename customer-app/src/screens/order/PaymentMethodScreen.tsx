import React from "react";

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

import Button from "../../components/Button";

interface Props {
  navigation: any;
  route?: any;
}

export default function PaymentMethodScreen({ navigation, route }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const params = route?.params ?? {};

  const handleContinue = () => {
    console.log("PaymentMethod forwarding params:", params);

    navigation.navigate("OrderReview", {
      ...params,
      paymentMethod: "payfast",
    });
  };

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;

  const cardBg = isWF ? "#FFFFFF" : colors.white;

  const heading = isWF ? "#1A1A1A" : colors.charcoalInk;

  const sub = isWF ? "#666666" : colors.inkLight;

  const border = isWF ? "#CCCCCC" : colors.divider;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: bg,
        },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={heading} />
        </TouchableOpacity>

        <Text
          style={[
            styles.screenTitle,
            {
              color: heading,
              fontFamily: font("display"),
              fontSize: FontSizes.md,
            },
          ]}
        >
          Payment Method
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: heading,
              fontFamily: font("bodyMedium"),
              fontSize: FontSizes.sm,
            },
          ]}
        >
          Choose payment method
        </Text>

        <View
          style={[
            styles.paymentCard,
            {
              backgroundColor: cardBg,

              borderColor: isWF ? "#555" : colors.petrolDeep,

              borderRadius: isWF ? Radius.sm : Radius.lg,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
              },
            ]}
          >
            <Feather
              name="credit-card"
              size={24}
              color={isWF ? "#555" : colors.petrolDeep}
            />
          </View>

          <View style={styles.paymentInfo}>
            <Text
              style={[
                styles.paymentTitle,
                {
                  color: heading,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              PayFast
            </Text>

            <Text
              style={{
                color: sub,
                fontFamily: font("body"),
                fontSize: FontSizes.xs,
              }}
            >
              Debit or credit card
            </Text>

            <View
              style={[
                styles.selectedBadge,
                {
                  backgroundColor: isWF ? "#D8D8D8" : colors.petrolLight,
                },
              ]}
            >
              <Text
                style={{
                  color: isWF ? "#444" : colors.petrolMid,

                  fontFamily: font("bodyMedium"),

                  fontSize: 10,
                }}
              >
                Selected
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.radioOuter,
              {
                borderColor: isWF ? "#555" : colors.petrolDeep,
              },
            ]}
          >
            <View
              style={[
                styles.radioInner,
                {
                  backgroundColor: isWF ? "#555" : colors.petrolDeep,
                },
              ]}
            />
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: cardBg,

              borderColor: border,

              borderRadius: isWF ? Radius.sm : Radius.md,
            },
          ]}
        >
          <Feather
            name="external-link"
            size={20}
            color={isWF ? "#555" : colors.petrolDeep}
          />

          <View style={styles.infoContent}>
            <Text
              style={{
                color: heading,
                fontFamily: font("bodyMedium"),
                fontSize: FontSizes.sm,
                marginBottom: 6,
              }}
            >
              Secure PayFast checkout
            </Text>

            <Text
              style={{
                color: sub,
                fontFamily: font("body"),
                fontSize: FontSizes.xs,
                lineHeight: 18,
              }}
            >
              You'll be redirected to PayFast to complete your payment. FuelNow
              does not receive or store your card details.
            </Text>
          </View>
        </View>

        {!isWF && (
          <View
            style={[
              styles.securityNote,
              {
                backgroundColor: colors.greenLight,

                borderRadius: Radius.md,
              },
            ]}
          >
            <Feather name="shield" size={16} color={colors.dieselGreen} />

            <Text
              style={{
                flex: 1,
                marginLeft: Spacing.sm,

                color: colors.dieselGreen,

                fontFamily: font("body"),

                fontSize: FontSizes.xs,

                lineHeight: 17,
              }}
            >
              Your card information is handled directly by PayFast.
            </Text>
          </View>
        )}

        <Button
          label="Continue to Order Review →"
          onPress={handleContinue}
          size="lg"
          style={{
            marginTop: Spacing.xl,
          }}
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

  sectionTitle: {
    marginBottom: Spacing.md,
  },

  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1.5,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  paymentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  paymentTitle: {
    marginBottom: 3,
  },

  selectedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 6,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  infoCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },

  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
});
