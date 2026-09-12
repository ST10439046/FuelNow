import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing } from "../../theme/tokens";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { supabase } from "../../services/supabase";

// Deep-link URL for the password reset callback.
// On web we use the browser origin; on native we use the app scheme.
const RESET_REDIRECT_URL =
  Platform.OS === "web"
    ? `${typeof window !== "undefined" ? window.location.origin : "http://localhost:8081"}/reset-password`
    : "fuelnow://reset-password";

interface Props {
  navigation: any;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // =====================================================
      // SEND PASSWORD RESET EMAIL THROUGH SUPABASE AUTH
      // =====================================================

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: RESET_REDIRECT_URL,
        },
      );

      if (resetError) {
        throw resetError;
      }

      setEmail(trimmedEmail);
      setSent(true);
    } catch (e: any) {
      console.error("Password reset error:", e);

      setError(
        e?.message ??
          "Failed to send the password reset email. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={isWF ? "#333" : colors.charcoalInk}
          />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successContainer}>
            {!isWF && (
              <View
                style={[
                  styles.successIcon,
                  {
                    backgroundColor: colors.greenLight,
                  },
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
              style={[
                styles.title,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes["2xl"],
                },
              ]}
            >
              Check your email
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              We've sent a password reset link to{"\n"}
              <Text
                style={{
                  fontFamily: font("bodySemiBold"),
                  color: isWF ? "#333" : colors.charcoalInk,
                }}
              >
                {email}
              </Text>
            </Text>

            <Text
              style={[
                styles.hint,
                {
                  color: isWF ? "#666" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Check your spam folder if you don't see it within a few minutes.
            </Text>

            <Button
              label="Back to Sign In"
              onPress={() => navigation.navigate("Login")}
              variant="outline"
              size="lg"
              style={{
                marginTop: Spacing.xl,
              }}
            />
          </View>
        ) : (
          <>
            {!isWF && (
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.amberLight,
                  },
                ]}
              >
                <Feather name="key" size={32} color={colors.ignitionAmber} />
              </View>
            )}

            <Text
              style={[
                styles.title,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes["2xl"],
                },
              ]}
            >
              Forgot password?
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  marginBottom: Spacing.xl,
                },
              ]}
            >
              No worries. We'll send you a reset link to your registered email
              address.
            </Text>

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="you@example.co.za"
              leftIcon={
                <Feather
                  name="mail"
                  size={18}
                  color={isWF ? "#888" : colors.inkLight}
                />
              }
            />

            {error ? (
              <Text
                style={[
                  styles.error,
                  {
                    color: isWF ? "#555" : colors.signalRed,
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <Button
              label="Send Reset Link"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
            />

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
            >
              <Feather
                name="arrow-left"
                size={14}
                color={isWF ? "#444" : colors.petrolDeep}
              />

              <Text
                style={[
                  styles.backLinkText,
                  {
                    color: isWF ? "#444" : colors.petrolDeep,
                    fontFamily: font("bodyMedium"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    paddingTop: Spacing.lg,
  },

  backBtn: {
    marginBottom: Spacing.xl,
    alignSelf: "flex-start",
    padding: Spacing.xs,
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },

  title: {
    marginBottom: Spacing.sm,
  },

  subtitle: {
    lineHeight: 24,
  },

  error: {
    marginBottom: Spacing.md,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    justifyContent: "center",
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },

  backLinkText: {},

  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    paddingTop: Spacing["4xl"],
  },

  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  hint: {
    textAlign: "center",
    lineHeight: 22,
  },
});
