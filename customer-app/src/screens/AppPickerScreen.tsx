import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../context/DesignModeContext";
import { FontSizes, Spacing, Radius, Shadow } from "../theme/tokens";

const { width: W } = Dimensions.get("window");

interface Props {
  navigation: any;
}

export default function AppPickerScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const isWF = isWireframe;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isWF ? "#F0F0F0" : "#0F172A" },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            styles.logo,
            {
              color: isWF ? "#1A1A1A" : "#FFFFFF",
              fontFamily: font("displayBold"),
              fontSize: FontSizes["2xl"],
            },
          ]}
        >
          ⛽ FuelNow
        </Text>
        <Text
          style={[
            styles.logoSub,
            {
              color: isWF ? "#555" : "rgba(255,255,255,0.6)",
              fontFamily: font("body"),
              fontSize: FontSizes.sm,
            },
          ]}
        >
          Select your portal to continue
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>
        {/* Customer App Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Onboarding")}
        >
          {isWF ? (
            <View style={[styles.card, styles.wfCard, { borderColor: "#999" }]}>
              <View style={styles.wfIcon}>
                <Feather name="user" size={28} color="#444" />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: "#1A1A1A",
                    fontFamily: font("displayBold"),
                    fontSize: FontSizes.lg,
                  },
                ]}
              >
                Customer App
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  {
                    color: "#555",
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Order fuel delivery
              </Text>
              <View style={[styles.wfBtn, { borderColor: "#888" }]}>
                <Text
                  style={{
                    color: "#444",
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.sm,
                  }}
                >
                  Open →
                </Text>
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={["#1E3A5F", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, styles.gradCard]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
              >
                <Feather name="user" size={32} color="#FFFFFF" />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: "#FFFFFF",
                    fontFamily: font("displayBold"),
                    fontSize: FontSizes.xl,
                  },
                ]}
              >
                Customer App
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  {
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Order fuel delivered{"\n"}to your location
              </Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>

        {/* Driver App Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("DriverLogin")}
        >
          {isWF ? (
            <View style={[styles.card, styles.wfCard, { borderColor: "#999" }]}>
              <View style={styles.wfIcon}>
                <Feather name="truck" size={28} color="#444" />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: "#1A1A1A",
                    fontFamily: font("displayBold"),
                    fontSize: FontSizes.lg,
                  },
                ]}
              >
                Driver App
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  {
                    color: "#555",
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Manage deliveries
              </Text>
              <View style={[styles.wfBtn, { borderColor: "#888" }]}>
                <Text
                  style={{
                    color: "#444",
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.sm,
                  }}
                >
                  Open →
                </Text>
              </View>
            </View>
          ) : (
            <LinearGradient
              colors={["#7C2D12", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, styles.gradCard]}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
              >
                <Feather name="truck" size={32} color="#FFFFFF" />
              </View>
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: "#FFFFFF",
                    fontFamily: font("displayBold"),
                    fontSize: FontSizes.xl,
                  },
                ]}
              >
                Driver App
              </Text>
              <Text
                style={[
                  styles.cardSub,
                  {
                    color: "rgba(255,255,255,0.75)",
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Accept orders &{"\n"}manage deliveries
              </Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={18} color="#FFFFFF" />
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text
        style={[
          styles.footer,
          {
            color: isWF ? "#888" : "rgba(255,255,255,0.35)",
            fontFamily: font("body"),
            fontSize: FontSizes.xs,
          },
        ]}
      >
        FuelNow · South Africa · KwaZulu-Natal
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Platform.OS === "web" ? ("100vh" as any) : "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"] ?? 48,
  },
  logo: { letterSpacing: -0.5 },
  logoSub: { marginTop: Spacing.xs, textAlign: "center" },
  cardsRow: {
    width: "100%",
    gap: Spacing.lg,
  },
  cardWrapper: { width: "100%" },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    minHeight: 160,
    justifyContent: "space-between",
  },
  gradCard: {
    ...Shadow.lg,
  },
  wfCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    alignItems: "flex-start",
  },
  wfIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  cardTitle: { marginBottom: 4 },
  cardSub: { lineHeight: 20, marginBottom: Spacing.md },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  wfBtn: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: "flex-end",
  },
  footer: {
    marginTop: Spacing["2xl"] ?? 48,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
