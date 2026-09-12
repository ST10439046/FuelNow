import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius, Shadow } from "../../theme/tokens";
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
        "Your personal information has been successfully saved.",
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

  const bg = isWF ? "#F0F0F0" : colors.warmAsh;
  const cardBg = isWF ? "#FFFFFF" : colors.white;
  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;
  const subColor = isWF ? "#666666" : colors.inkLight;
  const border = isWF ? "#DDDDDD" : colors.divider;

  const initials = (name.trim() || user?.name || "FuelNow")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
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
          Personal Information
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
          {/* Avatar Hero Banner */}
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
                styles.avatarCircle,
                {
                  backgroundColor: isWF ? "#D8D8D8" : colors.petrolDeep,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  {
                    color: isWF ? "#333333" : colors.ignitionAmber,
                    fontFamily: font("displayBold"),
                  },
                ]}
              >
                {initials}
              </Text>
            </View>

            <View style={styles.heroTextContainer}>
              <Text
                style={[
                  styles.heroName,
                  { color: headingColor, fontFamily: font("displayBold") },
                ]}
              >
                {name || "Your Name"}
              </Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.tierBadge,
                    {
                      backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                    },
                  ]}
                >
                  <Feather
                    name="award"
                    size={12}
                    color={isWF ? "#555" : colors.petrolMid}
                  />
                  <Text
                    style={[
                      styles.tierText,
                      {
                        color: isWF ? "#444" : colors.petrolMid,
                        fontFamily: font("bodyMedium"),
                      },
                    ]}
                  >
                    {user?.loyaltyTier ?? "Bronze"} Tier
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isWF ? "#EAEAEA" : colors.greenLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isWF ? "#555" : colors.dieselGreen,
                        fontFamily: font("bodyMedium"),
                      },
                    ]}
                  >
                    Active Account
                  </Text>
                </View>
              </View>
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
              Profile Details
            </Text>

            <Text
              style={[
                styles.sectionSub,
                { color: subColor, fontFamily: font("body") },
              ]}
            >
              Ensure your contact information is accurate for delivery updates and dispatch notices.
            </Text>

            <View style={styles.fieldsContainer}>
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: headingColor, fontFamily: font("bodyMedium") },
                  ]}
                >
                  Full Name
                </Text>
                <Input
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  leftIcon={
                    <Feather
                      name="user"
                      size={18}
                      color={isWF ? "#666" : colors.inkLight}
                    />
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
                  Email Address
                </Text>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={
                    <Feather
                      name="mail"
                      size={18}
                      color={isWF ? "#666" : colors.inkLight}
                    />
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
                  Phone Number
                </Text>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +27 82 123 4567"
                  keyboardType="phone-pad"
                  leftIcon={
                    <Feather
                      name="phone"
                      size={18}
                      color={isWF ? "#666" : colors.inkLight}
                    />
                  }
                />
              </View>
            </View>

            <Button
              label={saving ? "Saving Changes..." : "Save Profile"}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              variant="primary"
              size="lg"
              style={{ marginTop: Spacing.md }}
              icon={
                !saving ? (
                  <Feather name="check" size={18} color="#FFFFFF" />
                ) : undefined
              }
            />
          </View>

          {/* Security Note */}
          <View
            style={[
              styles.infoCallout,
              {
                backgroundColor: isWF ? "#EFEFEF" : colors.petrolLight,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Feather
              name="shield"
              size={18}
              color={isWF ? "#555" : colors.petrolDeep}
            />
            <Text
              style={[
                styles.infoCalloutText,
                {
                  color: isWF ? "#444" : colors.petrolDeep,
                  fontFamily: font("body"),
                },
              ]}
            >
              Your personal data is encrypted and protected in accordance with POPIA regulations.
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSizes.xl,
  },
  heroTextContainer: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontSize: FontSizes.lg,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tierText: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
  },
  formCard: {
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sectionHeading: {
    fontSize: FontSizes.base,
  },
  sectionSub: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  fieldsContainer: {
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSizes.xs,
  },
  infoCallout: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
});
