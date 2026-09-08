import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing } from "../../theme/tokens";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";

import { userRepository, UserModel } from "../../repositories/UserRepository";

interface Props {
  navigation: any;
}

export default function PersonalInformationScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const [user, setUser] = useState<UserModel | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, []),
  );

  const loadUser = async () => {
    try {
      setLoading(true);

      const data = await userRepository.getUser();

      setUser(data);
      setName(data.name ?? "");
      setEmail(data.email ?? "");
      setPhone(data.phone ?? "");
    } catch (error: any) {
      console.error("PersonalInformationScreen: failed to load user:", error);

      Alert.alert(
        "Unable to Load Profile",
        error?.message ?? "We could not load your personal information.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    try {
      setSaving(true);

      await userRepository.updateProfile({
        fullName: name.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
      });

      Alert.alert(
        "Profile Updated",
        "Your personal information has been updated.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error: any) {
      console.error(
        "PersonalInformationScreen: failed to update profile:",
        error,
      );

      Alert.alert(
        "Update Failed",
        error?.message ?? "We could not update your personal information.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            Personal Information
          </Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isWF ? "#555" : colors.petrolDeep}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          Personal Information
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
                name="user"
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
            Your Details
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
            Update the information associated with your FuelNow account.
          </Text>

          <View style={styles.form}>
            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <Button
            label={saving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            disabled={saving}
            variant="primary"
            size="md"
            icon={
              saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="save" size={16} color="#FFFFFF" />
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

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
