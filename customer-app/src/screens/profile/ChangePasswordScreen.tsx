import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { supabase } from "../../services/supabase";

interface Props {
  navigation: any;
}

export default function ChangePasswordScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasMinLength = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleChangePassword = async () => {
    if (!password) {
      Alert.alert("Missing Password", "Please enter your new password.");
      return;
    }

    if (!hasMinLength) {
      Alert.alert(
        "Password Too Short",
        "Your password must contain at least 6 characters.",
      );
      return;
    }

    if (!passwordsMatch) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both password fields match exactly.",
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("No active session found. Please log in again.");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password Updated",
        "Your password has been changed successfully. You can now use your new password next time you log in.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      console.error("ChangePasswordScreen error:", error);
      Alert.alert(
        "Password Change Failed",
        error?.message ?? "We could not change your password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;
  const cardBg = isWF ? "#FFFFFF" : colors.white;
  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;
  const subColor = isWF ? "#666666" : colors.inkLight;
  const border = isWF ? "#DDDDDD" : colors.divider;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={headingColor} />
        </TouchableOpacity>

        <Text
          style={[
            styles.screenTitle,
            { color: headingColor, fontFamily: font("displayBold") },
          ]}
        >
          Change Password
        </Text>

        <View style={{ width: 40 }} />
      </View>

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
          {/* Hero Banner */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: cardBg,
                borderColor: border,
                borderRadius: Radius.xl,
              },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isWF ? "#D8D8D8" : colors.petrolLight,
                },
              ]}
            >
              <Feather
                name="lock"
                size={28}
                color={isWF ? "#555555" : colors.petrolDeep}
              />
            </View>
            <View style={styles.heroTextContainer}>
              <Text
                style={[
                  styles.heroTitle,
                  { color: headingColor, fontFamily: font("displayBold") },
                ]}
              >
                Account Security
              </Text>
              <Text
                style={[
                  styles.heroSub,
                  { color: subColor, fontFamily: font("body") },
                ]}
              >
                Set a strong, unique password to keep your fuel orders and payment methods safe.
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: cardBg,
                borderColor: border,
                borderRadius: Radius.xl,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionHeading,
                { color: headingColor, fontFamily: font("bodyMedium") },
              ]}
            >
              New Password
            </Text>

            <View style={styles.fieldsContainer}>
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: headingColor, fontFamily: font("bodyMedium") },
                  ]}
                >
                  New Password
                </Text>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter at least 6 characters"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  leftIcon={
                    <Feather
                      name="key"
                      size={18}
                      color={isWF ? "#666" : colors.inkLight}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        size={18}
                        color={isWF ? "#666" : colors.inkLight}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: headingColor, fontFamily: font("bodyMedium") },
                  ]}
                >
                  Confirm New Password
                </Text>
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your new password"
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  leftIcon={
                    <Feather
                      name="check-circle"
                      size={18}
                      color={isWF ? "#666" : colors.inkLight}
                    />
                  }
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowConfirm(!showConfirm)}
                    >
                      <Feather
                        name={showConfirm ? "eye-off" : "eye"}
                        size={18}
                        color={isWF ? "#666" : colors.inkLight}
                      />
                    </TouchableOpacity>
                  }
                />
              </View>
            </View>

            {/* Password Requirements Guide */}
            <View style={styles.rulesContainer}>
              <View style={styles.ruleItem}>
                <Feather
                  name={hasMinLength ? "check" : "circle"}
                  size={14}
                  color={
                    hasMinLength
                      ? colors.dieselGreen
                      : isWF
                        ? "#888888"
                        : colors.inkLight
                  }
                />
                <Text
                  style={[
                    styles.ruleText,
                    {
                      color: hasMinLength
                        ? colors.dieselGreen
                        : isWF
                          ? "#666666"
                          : colors.inkLight,
                      fontFamily: font("body"),
                    },
                  ]}
                >
                  At least 6 characters
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Feather
                  name={passwordsMatch ? "check" : "circle"}
                  size={14}
                  color={
                    passwordsMatch
                      ? colors.dieselGreen
                      : isWF
                        ? "#888888"
                        : colors.inkLight
                  }
                />
                <Text
                  style={[
                    styles.ruleText,
                    {
                      color: passwordsMatch
                        ? colors.dieselGreen
                        : isWF
                          ? "#666666"
                          : colors.inkLight,
                      fontFamily: font("body"),
                    },
                  ]}
                >
                  Passwords match
                </Text>
              </View>
            </View>

            <Button
              label={saving ? "Updating..." : "Update Password"}
              onPress={handleChangePassword}
              disabled={saving || !hasMinLength || !passwordsMatch}
              loading={saving}
              variant="primary"
              size="lg"
              style={{ marginTop: Spacing.md }}
              icon={
                !saving ? (
                  <Feather name="shield" size={18} color="#FFFFFF" />
                ) : undefined
              }
            />
          </View>

          {/* Security Best Practices Tip */}
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isWF ? "#EFEFEF" : colors.petrolLight,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Feather
              name="info"
              size={18}
              color={isWF ? "#555555" : colors.petrolDeep}
            />
            <Text
              style={[
                styles.tipText,
                {
                  color: isWF ? "#444444" : colors.petrolDeep,
                  fontFamily: font("body"),
                },
              ]}
            >
              Tip: Avoid using names, birthdates, or common dictionary words in your password.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: FontSizes.md,
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.base,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContainer: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontSize: FontSizes.base,
  },
  heroSub: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  formCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xs,
  },
  fieldsContainer: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSizes.xs,
  },
  rulesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
    flexWrap: "wrap",
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
});
