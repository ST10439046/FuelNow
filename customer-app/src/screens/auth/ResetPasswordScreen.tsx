import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { supabase } from "../../services/supabase";

export default function ResetPasswordScreen({ navigation }: any) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;
  const cardBg = isWF ? "#FFFFFF" : colors.white;
  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;
  const subColor = isWF ? "#555555" : colors.inkLight;

  const handleResetPassword = async () => {
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setDone(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(
        err?.message ||
          "Unable to reset your password. Please request a new reset link.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {done ? (
            /* ─── Success state ─── */
            <View style={styles.successContainer}>
              {!isWF && (
                <View
                  style={[
                    styles.successIcon,
                    { backgroundColor: colors.greenLight },
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={40}
                    color={colors.dieselGreen}
                  />
                </View>
              )}

              <Text
                style={{
                  color: headingColor,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes["2xl"],
                  textAlign: "center",
                  marginBottom: Spacing.sm,
                }}
              >
                Password updated!
              </Text>

              <Text
                style={{
                  color: subColor,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  textAlign: "center",
                  lineHeight: 24,
                  marginBottom: Spacing["2xl"],
                }}
              >
                Your password has been successfully changed. You can now sign in
                with your new password.
              </Text>

              <Button
                label="Back to Sign In"
                onPress={() => navigation.replace("Login")}
                variant="primary"
                size="lg"
              />
            </View>
          ) : (
            /* ─── Form state ─── */
            <>
              {!isWF && (
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: colors.petrolLight },
                  ]}
                >
                  <Feather name="lock" size={32} color={colors.petrolDeep} />
                </View>
              )}

              <Text
                style={{
                  color: headingColor,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes["2xl"],
                  marginBottom: Spacing.sm,
                }}
              >
                Set new password
              </Text>

              <Text
                style={{
                  color: subColor,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  lineHeight: 24,
                  marginBottom: Spacing.xl,
                }}
              >
                Choose a strong password of at least 6 characters.
              </Text>

              <Input
                label="New password"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoCapitalize="none"
                placeholder="Minimum 6 characters"
                leftIcon={
                  <Feather
                    name="lock"
                    size={18}
                    color={isWF ? "#888" : colors.inkLight}
                  />
                }
              />

              <Input
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                autoCapitalize="none"
                placeholder="Re-enter password"
                leftIcon={
                  <Feather
                    name="lock"
                    size={18}
                    color={isWF ? "#888" : colors.inkLight}
                  />
                }
              />

              {error ? (
                <Text
                  style={{
                    color: isWF ? "#555" : colors.signalRed,
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                    marginBottom: Spacing.md,
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <Button
                label={loading ? "Updating..." : "Update Password"}
                onPress={handleResetPassword}
                loading={loading}
                variant="primary"
                size="lg"
                style={{ marginTop: Spacing.sm }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing["2xl"],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["4xl"],
    gap: Spacing.lg,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
