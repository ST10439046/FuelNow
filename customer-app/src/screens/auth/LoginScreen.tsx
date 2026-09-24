
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { userRepository } from "../../repositories/UserRepository";
import { supabase } from "../../services/supabase";
import { pushNotificationService } from "../../services/PushNotificationService";

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // =====================================================
      // 1. SIGN IN USING SUPABASE AUTH
      // =====================================================

      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError) {
        throw authError;
      }

      if (!data.user) {
        throw new Error(
          "Login failed. No authenticated user was returned."
        );
      }

      if (!data.session) {
        throw new Error(
          "Login failed. No authentication session was created."
        );
      }

      // This is auth.users.id
      const authId = data.user.id;

      console.log("SUPABASE AUTH ID:", authId);
      console.log(
        "SUPABASE JWT RECEIVED:",
        !!data.session.access_token
      );

      // =====================================================
      // 2. FIND THE APPLICATION USER
      // =====================================================

      const { data: appUser, error: userError } =
        await supabase
          .from("users")
          .select(
            `
        user_id,
        auth_id,
        full_name,
        email,
        phone_number,
        status
      `
          )
          .eq("auth_id", authId)
          .single();

      if (userError || !appUser) {
        console.error(
          "APPLICATION USER LOOKUP ERROR:",
          userError
        );

        await supabase.auth.signOut();

        throw new Error(
          "Your authentication account is not linked to a FuelNow user profile."
        );
      }

      console.log(
        "APPLICATION USER:",
        JSON.stringify(appUser, null, 2)
      );

      // =====================================================
      // 3. CHECK APPLICATION USER STATUS
      // =====================================================

      if (appUser.status !== "active") {
        await supabase.auth.signOut();

        throw new Error(
          "Your FuelNow account is not active. Please contact support."
        );
      }

      // =====================================================
      // 4. MAKE SURE WE HAVE THE APPLICATION USER ID
      // =====================================================

      if (!appUser.user_id) {
        await supabase.auth.signOut();

        throw new Error(
          "Login succeeded, but no FuelNow user ID was found."
        );
      }

      // =====================================================
      // 5. CHECK CUSTOMER PROFILE
      // =====================================================

      const {
        data: customerProfile,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          `
        customer_id,
        loyalty_tier,
        fuel_points_balance
      `
        )
        .eq("customer_id", appUser.user_id)
        .single();

      if (customerError || !customerProfile) {
        console.error(
          "CUSTOMER PROFILE LOOKUP ERROR:",
          customerError
        );

        await supabase.auth.signOut();

        throw new Error(
          "This account does not have a FuelNow customer profile."
        );
      }

      console.log(
        "CUSTOMER PROFILE:",
        JSON.stringify(customerProfile, null, 2)
      );

      // =====================================================
      // 6. SAVE THE FUELNOW USER ID
      // =====================================================

      await userRepository.setAuthenticatedUserId(
        appUser.user_id
      );

      console.log(
        "FUELNOW USER ID SAVED:",
        appUser.user_id
      );

      console.log(
        "CUSTOMER ID:",
        customerProfile.customer_id
      );

      console.log(
        "AUTH ID:",
        appUser.auth_id
      );

      // =====================================================
      // 7. REGISTER THIS DEVICE WITH FIREBASE CLOUD MESSAGING
      // =====================================================

      try {
        await pushNotificationService.initialize();
      } catch (pushError) {
        console.error(
          "FCM registration failed:",
          pushError
        );
      }

      // =====================================================
      // 8. LOGIN COMPLETE
      // =====================================================

      navigation.replace("MainTabs");
    } catch (e: any) {
      console.error("Login error:", e);

      const message =
        e?.message?.toLowerCase() || "";

      if (
        message.includes(
          "invalid login credentials"
        )
      ) {
        setError("Invalid email or password.");
      } else if (
        message.includes(
          "email not confirmed"
        )
      ) {
        setError(
          "Please confirm your email address before signing in."
        );
      } else {
        setError(
          e?.message ||
            "Unable to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWireframe
            ? "#F0F0F0"
            : colors.warmAsh,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            {isWireframe ? (
              <View style={styles.wireframeLogo} />
            ) : (
              <View
                style={[
                  styles.logoMark,
                  {
                    backgroundColor:
                      colors.petrolDeep,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.logoText,
                    {
                      fontFamily:
                        font("displayBold"),
                      color:
                        colors.ignitionAmber,
                    },
                  ]}
                >
                  F
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.appName,
                {
                  color: isWireframe
                    ? "#1A1A1A"
                    : colors.petrolDeep,
                  fontFamily:
                    font("displayBold"),
                  fontSize: FontSizes["3xl"],
                },
              ]}
            >
              FuelNow
            </Text>

            <Text
              style={[
                styles.tagline,
                {
                  color: isWireframe
                    ? "#666"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                },
              ]}
            >
              South Africa's fuel delivery app
            </Text>
          </View>

          {/* Form card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: isWireframe
                  ? "#FFFFFF"
                  : colors.white,
                borderRadius: isWireframe
                  ? Radius.sm
                  : Radius.xl,
                borderWidth: isWireframe
                  ? 1.5
                  : 0,
                borderColor: "#CCCCCC",
              },
            ]}
          >
            <Text
              style={[
                styles.formTitle,
                {
                  color: isWireframe
                    ? "#1A1A1A"
                    : colors.charcoalInk,
                  fontFamily: font("display"),
                  fontSize: FontSizes.xl,
                },
              ]}
            >
              Welcome back
            </Text>

            <Text
              style={[
                styles.formSubtitle,
                {
                  color: isWireframe
                    ? "#666"
                    : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                  marginBottom: Spacing.xl,
                },
              ]}
            >
              Sign in to your FuelNow account
            </Text>

            {/* Email */}
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
                  color={
                    isWireframe
                      ? "#888"
                      : colors.inkLight
                  }
                />
              }
            />

            {/* Password */}
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Enter your password"
              leftIcon={
                <Feather
                  name="lock"
                  size={18}
                  color={
                    isWireframe
                      ? "#888"
                      : colors.inkLight
                  }
                />
              }
            />

            {/* Error */}
            {error ? (
              <Text
                style={[
                  styles.error,
                  {
                    color: isWireframe
                      ? "#555"
                      : colors.signalRed,
                    fontFamily:
                      font("body"),
                    fontSize:
                      FontSizes.sm,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() =>
                navigation.navigate(
                  "ForgotPassword"
                )
              }
            >
              <Text
                style={[
                  styles.forgotText,
                  {
                    color: isWireframe
                      ? "#444"
                      : colors.petrolDeep,
                    fontFamily:
                      font("bodyMedium"),
                    fontSize:
                      FontSizes.sm,
                  },
                ]}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login */}
            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              style={{
                marginTop: Spacing.md,
              }}
            />
          </View>

          {/* Sign up link */}
          <View style={styles.signupRow}>
            <Text
              style={[
                styles.signupText,
                {
                  color: isWireframe
                    ? "#555"
                    : colors.inkLight,
                  fontFamily:
                    font("body"),
                  fontSize:
                    FontSizes.sm,
                },
              ]}
            >
              Don't have an account?{" "}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("SignUp")
              }
            >
              <Text
                style={[
                  styles.signupLink,
                  {
                    color: isWireframe
                      ? "#333"
                      : colors.petrolDeep,
                    fontFamily:
                      font("bodySemiBold"),
                    fontSize:
                      FontSizes.sm,
                  },
                ]}
              >
                Create account
              </Text>
            </TouchableOpacity>
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

  scroll: {
    flexGrow: 1,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },

  header: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
    gap: Spacing.sm,
  },

  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },

  logoText: {
    fontSize: 32,
  },

  wireframeLogo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#888",
    marginBottom: Spacing.sm,
  },

  appName: {
    letterSpacing: -0.5,
  },

  tagline: {},

  card: {
    padding: Spacing.xl,
  },

  formTitle: {
    marginBottom: Spacing.xs,
  },

  formSubtitle: {},

  error: {
    marginBottom: Spacing.md,
  },

  forgotBtn: {
    alignSelf: "flex-end",
    padding: Spacing.xs,
  },

  forgotText: {},

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Spacing.lg,
  },

  signupText: {},

  signupLink: {},
});

