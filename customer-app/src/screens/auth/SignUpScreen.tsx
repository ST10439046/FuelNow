import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { CustomerApiClient } from "../../services/apiClient";
import { userRepository } from "../../repositories/UserRepository";
import { supabase } from "../../services/supabase";

type Step = "form" | "otp";

interface Props {
  navigation: any;
}

export default function SignUpScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // =====================================================
      // CREATE SUPABASE AUTH ACCOUNT
      // =====================================================

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            phone_number: trimmedPhone,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error(
          "Account creation failed. No authenticated user was returned.",
        );
      }

      console.log("SUPABASE AUTH USER CREATED:", data.user.id);

      // =====================================================
      // SUPABASE DATABASE TRIGGER
      // =====================================================
      //
      // The database trigger creates:
      //
      // auth.users
      //      ↓
      // public.users
      //      ↓
      // public.customers
      //
      // So the app does not need to manually insert those rows.
      //
      // =====================================================

      // If email confirmation is enabled, the user won't have
      // an active session yet. They must confirm their email.

      if (!data.session) {
        setStep("otp");
        return;
      }

      // If email confirmation is disabled, the user is
      // immediately authenticated.

      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("user_id, auth_id, status")
        .eq("auth_id", data.user.id)
        .single();

      if (appUserError || !appUser) {
        throw new Error(
          "Your account was created, but your FuelNow profile could not be found.",
        );
      }

      if (appUser.status !== "active") {
        await supabase.auth.signOut();

        throw new Error(
          "Your FuelNow account is not active. Please contact support.",
        );
      }

      await userRepository.setAuthenticatedUserId(appUser.user_id);

      navigation.replace("MainTabs");
    } catch (e: any) {
      console.error("Sign up error:", e);

      const message = e?.message?.toLowerCase?.() ?? "";

      if (message.includes("already registered")) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (message.includes("password")) {
        setError(e.message);
      } else if (message.includes("email")) {
        setError(e.message);
      } else {
        setError(e?.message ?? "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val[val.length - 1];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (!val && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // Verify the email OTP sent by Supabase on sign-up
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpStr,
        type: "email",
      });

      if (verifyError) throw verifyError;
      if (!data.user) throw new Error("Verification failed. No user returned.");

      // Look up the application user created by the DB trigger
      const { data: appUser, error: appUserError } = await supabase
        .from("users")
        .select("user_id, auth_id, status")
        .eq("auth_id", data.user.id)
        .single();

      if (appUserError || !appUser) {
        throw new Error(
          "Your account was verified, but your FuelNow profile could not be found.",
        );
      }

      if (appUser.status !== "active") {
        await supabase.auth.signOut();
        throw new Error(
          "Your FuelNow account is not active. Please contact support.",
        );
      }

      await userRepository.setAuthenticatedUserId(appUser.user_id);
      navigation.replace("MainTabs");
    } catch (e: any) {
      setError(e.message ?? "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
      });
    } catch {
      // Silently ignore — Supabase rate-limits resend automatically
    }
  };

  const isWF = isWireframe;

  if (step === "otp") {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh },
        ]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setStep("form")}
          >
            <Feather
              name="arrow-left"
              size={22}
              color={isWF ? "#333" : colors.charcoalInk}
            />
          </TouchableOpacity>

          <View style={styles.otpHeader}>
            {!isWF && (
              <View
                style={[
                  styles.otpIcon,
                  { backgroundColor: colors.petrolLight },
                ]}
              >
                <Feather
                  name="message-circle"
                  size={32}
                  color={colors.petrolDeep}
                />
              </View>
            )}
            <Text
              style={[
                styles.otpTitle,
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("displayBold"),
                  fontSize: FontSizes["2xl"],
                },
              ]}
            >
              Enter OTP
            </Text>
            <Text
              style={[
                styles.otpSubtitle,
                {
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              We've sent a 6-digit code to{"\n"}
              <Text
                style={{
                  fontFamily: font("bodySemiBold"),
                  color: isWF ? "#333" : colors.charcoalInk,
                }}
              >
                {phone || "+2782 456 7890"}
              </Text>
            </Text>
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  otpRefs.current[i] = r;
                }}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: isWF ? "#FFFFFF" : colors.white,
                    borderColor: digit
                      ? isWF
                        ? "#333"
                        : colors.petrolDeep
                      : isWF
                        ? "#CCCCCC"
                        : colors.divider,
                    color: isWF ? "#1A1A1A" : colors.charcoalInk,
                    fontFamily: isWF
                      ? undefined
                      : colors
                        ? "Inter_600SemiBold"
                        : undefined,
                    fontSize: FontSizes.xl,
                    borderRadius: isWF ? Radius.sm : Radius.md,
                  },
                ]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

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
            label="Verify OTP"
            onPress={handleVerifyOtp}
            loading={loading}
            size="lg"
          />

          <TouchableOpacity style={styles.resendBtn} onPress={handleResendCode}>
            <Text
              style={[
                styles.resendText,
                {
                  color: isWF ? "#444" : colors.petrolDeep,
                  fontFamily: font("bodyMedium"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Resend code
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
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
            Create account
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
            Join FuelNow — fuel delivery anywhere in SA
          </Text>

          <Input
            label="Full name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Name Surname"
            leftIcon={
              <Feather
                name="user"
                size={18}
                color={isWF ? "#888" : colors.inkLight}
              />
            }
          />
          <Input
            label="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.co.za"
            leftIcon={
              <Feather
                name="mail"
                size={18}
                color={isWF ? "#888" : colors.inkLight}
              />
            }
          />
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="082 456 7890"
            leftIcon={
              <Feather
                name="phone"
                size={18}
                color={isWF ? "#888" : colors.inkLight}
              />
            }
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            isPassword
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
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
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

          <Text
            style={[
              styles.termsText,
              {
                color: isWF ? "#666" : colors.inkLight,
                fontFamily: font("body"),
                fontSize: FontSizes.xs,
              },
            ]}
          >
            By creating an account, you agree to our{" "}
            <Text
              style={{
                color: isWF ? "#333" : colors.petrolDeep,
                fontFamily: font("bodyMedium"),
              }}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              style={{
                color: isWF ? "#333" : colors.petrolDeep,
                fontFamily: font("bodyMedium"),
              }}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <Button
            label="Create Account"
            onPress={handleSignUp}
            loading={loading}
            size="lg"
            style={{ marginTop: Spacing.sm }}
          />

          <View style={styles.signupRow}>
            <Text
              style={[
                styles.signupText,
                {
                  color: isWF ? "#555" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text
                style={[
                  styles.signupLink,
                  {
                    color: isWF ? "#333" : colors.petrolDeep,
                    fontFamily: font("bodySemiBold"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: Spacing.lg },
  backBtn: {
    marginBottom: Spacing.xl,
    alignSelf: "flex-start",
    padding: Spacing.xs,
  },
  title: { marginBottom: Spacing.xs },
  subtitle: {},
  error: { marginBottom: Spacing.md },
  termsText: { marginBottom: Spacing.md, lineHeight: 18 },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  signupText: {},
  signupLink: {},
  // OTP
  otpHeader: {
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  otpIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  otpTitle: {},
  otpSubtitle: { textAlign: "center", lineHeight: 24 },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    textAlign: "center",
  },
  resendBtn: {
    alignItems: "center",
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  resendText: {},
  demoHint: { textAlign: "center", marginTop: Spacing.sm },
});
