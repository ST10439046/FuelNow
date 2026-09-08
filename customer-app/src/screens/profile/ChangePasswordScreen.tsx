import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing } from "../../theme/tokens";
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

  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!password) {
      Alert.alert("Missing Password", "Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Your password must contain at least 6 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Do Not Match",
        "Please make sure both passwords are the same.",
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "No authenticated user was found. Please log in again.",
        );
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setPassword("");
      setConfirmPassword("");

      Alert.alert(
        "Password Changed",
        "Your password has been successfully updated.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      console.error("ChangePasswordScreen: password update failed:", error);

      Alert.alert(
        "Password Change Failed",
        error?.message ??
          "We could not change your password. Please try again.",
      );
    } finally {
      setSaving(false);
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
      <View style={styles.header}>
        <Button
          label=""
          variant="secondary"
          size="sm"
          onPress={() => navigation.goBack()}
          icon={
            <Feather
              name="arrow-left"
              size={18}
              color={isWF ? "#444" : colors.charcoalInk}
            />
          }
        />

        <Text
          style={[
            styles.title,
            {
              color: isWF ? "#1A1A1A" : colors.charcoalInk,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.xl,
            },
          ]}
        >
          Change Password
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isWF ? "#D0D0D0" : colors.petrolLight,
                },
              ]}
            >
              <Feather
                name="lock"
                size={24}
                color={isWF ? "#555" : colors.petrolDeep}
              />
            </View>
          </View>

          <Text
            style={[
              styles.heading,
              {
                color: isWF ? "#1A1A1A" : colors.charcoalInk,
                fontFamily: font("displayBold"),
              },
            ]}
          >
            Create a New Password
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: isWF ? "#666" : colors.inkLight,
                fontFamily: font("body"),
              },
            ]}
          >
            Choose a secure password that you do not use for another account.
          </Text>

          <View style={styles.form}>
            <Input
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              secureTextEntry
              autoCapitalize="none"
            />

            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Button
            label={saving ? "Updating..." : "Change Password"}
            onPress={handleChangePassword}
            disabled={saving}
            variant="primary"
            size="md"
            icon={
              saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="shield" size={16} color="#FFFFFF" />
              )
            }
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    padding: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    flex: 1,
    textAlign: "center",
  },

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["4xl"],
  },

  iconContainer: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  heading: {
    fontSize: FontSizes.lg,
    textAlign: "center",
  },

  description: {
    fontSize: FontSizes.sm,
    textAlign: "center",
    marginTop: Spacing.xs,
  },

  form: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
