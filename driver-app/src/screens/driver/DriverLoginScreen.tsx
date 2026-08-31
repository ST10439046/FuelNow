// ─────────────────────────────────────────────────────────────────────────────
// DriverLoginScreen.tsx — Premium driver login screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius, Shadow } from "../../theme/tokens";
import Input from "../../components/Input";

interface Props { navigation: any; }

export default function DriverLoginScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const [email, setEmail] = useState("france.sizwe@fuelnow.co.za");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setLoading(true);
    await new Promise<void>((res) => setTimeout(res, 1200));
    setLoading(false);
    navigation.replace("DriverTabs");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isWireframe ? "#F0F0F0" : colors.warmAsh }]} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* ── Header ── */}
          {isWireframe ? (
            <View style={styles.headerWF}>
              <View style={styles.wfIconBox}><Feather name="truck" size={40} color="#555" /></View>
              <Text style={[styles.heroTitle, { color: "#1A1A1A", fontFamily: font("displayBold") }]}>FuelNow Driver</Text>
              <Text style={[styles.heroSubtitle, { color: "#666", fontFamily: font("body") }]}>Delivery Partner Portal</Text>
            </View>
          ) : (
            <LinearGradient colors={["#F97316", "#EA580C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
              <View style={styles.headerContent}>
                <View style={styles.truckIconBg}><Feather name="truck" size={40} color="#FFFFFF" /></View>
                <Text style={[styles.heroTitle, { color: "#FFFFFF", fontFamily: font("displayBold") }]}>FuelNow Driver</Text>
                <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.75)", fontFamily: font("body") }]}>Delivery Partner Portal</Text>
              </View>
            </LinearGradient>
          )}

          {/* ── Form ── */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, {
              backgroundColor: isWireframe ? "#FFFFFF" : colors.white,
              borderRadius: isWireframe ? Radius.sm : Radius.xl,
              borderWidth: isWireframe ? 1.5 : 0,
              borderColor: "#CCCCCC",
              ...(isWireframe ? {} : Shadow.lg),
            }]}>
              <Text style={[styles.cardTitle, { color: isWireframe ? "#1A1A1A" : colors.charcoalInk, fontFamily: font("displayBold"), fontSize: FontSizes.xl }]}>
                Driver Sign In
              </Text>
              <Text style={[styles.cardSubtitle, { color: isWireframe ? "#666" : colors.inkLight, fontFamily: font("body"), fontSize: FontSizes.sm }]}>
                Sign in to start accepting deliveries
              </Text>

              <View style={{ marginTop: Spacing.xl }}>
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="driver@fuelnow.co.za"
                  leftIcon={<Feather name="mail" size={18} color={isWireframe ? "#888" : colors.inkLight} />}
                />
                <View style={{ marginTop: Spacing.md }}>
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    placeholder="Enter your password"
                    leftIcon={<Feather name="lock" size={18} color={isWireframe ? "#888" : colors.inkLight} />}
                  />
                </View>
              </View>

              {error ? (
                <Text style={[styles.errorText, { color: isWireframe ? "#555" : colors.signalRed, fontFamily: font("body"), fontSize: FontSizes.sm }]}>{error}</Text>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.82}
                style={[styles.loginBtn, {
                  backgroundColor: isWireframe ? "#B0B0B0" : colors.petrolDeep,
                  borderRadius: isWireframe ? Radius.sm : Radius.md,
                  borderWidth: isWireframe ? 1.5 : 0,
                  borderColor: "#666666",
                  opacity: loading ? 0.7 : 1,
                }]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Feather name="truck" size={18} color="#FFFFFF" />
                    <Text style={[styles.loginBtnText, { fontFamily: font("bodySemiBold"), fontSize: FontSizes.md }]}>Sign In as Driver</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 295, justifyContent: "flex-end", overflow: "hidden" },
  headerContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["2xl"], alignItems: "center" },
  truckIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  heroTitle: { fontSize: FontSizes["2xl"], letterSpacing: -0.5 },
  heroSubtitle: { fontSize: FontSizes.sm, marginTop: Spacing.xs },
  decorCircle1: { position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.08)" },
  decorCircle2: { position: "absolute", top: 20, left: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.06)" },
  headerWF: { height: 295, backgroundColor: "#D0D0D0", borderWidth: 1.5, borderColor: "#BBBBBB", alignItems: "center", justifyContent: "flex-end", paddingBottom: Spacing["2xl"], gap: Spacing.xs },
  wfIconBox: { width: 72, height: 72, borderWidth: 1.5, borderColor: "#888", borderRadius: Radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: "#E0E0E0", marginBottom: Spacing.xs },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing["2xl"] },
  card: { padding: Spacing.xl },
  cardTitle: { letterSpacing: -0.3 },
  cardSubtitle: { marginTop: Spacing.xs },
  errorText: { marginTop: Spacing.md },
  loginBtn: { marginTop: Spacing.xl, paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  loginBtnText: { color: "#FFFFFF", letterSpacing: 0.2 },
  switchLink: { alignSelf: "center", marginTop: Spacing.lg, paddingVertical: Spacing.xs },
  switchLinkText: { textDecorationLine: "underline" },
});
