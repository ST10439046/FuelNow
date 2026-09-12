import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing, Radius } from "../../theme/tokens";
import Card from "../../components/Card";
import Button from "../../components/Button";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { userRepository, UserModel } from "../../repositories/UserRepository";

import { supabase } from "../../services/supabase";

interface Props {
  navigation: any;
}

const LANGUAGES = ["English", "Afrikaans"];

export default function ProfileScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const { t } = useTranslation("profile");

  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [language, setLanguage] = useState(i18n.language);
  const handleLanguageChange = async (lang: "en" | "af") => {
    await i18n.changeLanguage(lang);
    setLanguage(lang);
  };
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /*
   * ============================================================
   * LOAD USER
   * ============================================================
   */

  const loadUser = useCallback(async () => {
    try {
      setRefreshing(true);

      const data = await userRepository.getUser();

      setUser(data);
    } catch (error: any) {
      console.error("ProfileScreen: failed to load user:", error);

      setUser(null);

      Alert.alert(
        "Unable to Load Profile",
        error?.message ?? "We could not load your profile information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /*
   * Reload every time ProfileScreen becomes active.
   *
   * This means:
   * Add Address -> go back -> addresses reload
   * Edit Profile -> go back -> profile reloads
   * Add Card -> go back -> payment methods reload
   */
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser]),
  );

  /*
   * ============================================================
   * SIGN OUT
   * ============================================================
   */

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of your FuelNow account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const { error } = await supabase.auth.signOut();

              if (error) {
                throw error;
              }

              await userRepository.clearAuthenticatedUser();

              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error: any) {
              console.error("ProfileScreen: sign out failed:", error);

              setLoading(false);

              Alert.alert(
                "Sign Out Failed",
                error?.message ??
                  "We could not sign you out. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  /*
   * ============================================================
   * SECTION COMPONENT
   * ============================================================
   */

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={{ gap: Spacing.sm }}>
      <Text
        style={[
          styles.sectionLabel,
          {
            color: isWF ? "#888" : colors.inkLight,
            fontFamily: font("body"),
            fontSize: FontSizes.xs,
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>

      <Card
        padded={false}
        style={{
          overflow: "hidden",
        }}
      >
        {children}
      </Card>
    </View>
  );

  /*
   * ============================================================
   * ROW COMPONENT
   * ============================================================
   */

  const Row = ({
    icon,
    label,
    value,
    onPress,
    danger = false,
    isSwitch = false,
    switchVal,
    onSwitch,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
    isSwitch?: boolean;
    switchVal?: boolean;
    onSwitch?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.row,
        {
          borderBottomColor: isWF ? "#EEEEEE" : colors.divider,
        },
      ]}
      onPress={onPress}
      disabled={isSwitch}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.rowIcon,
          {
            backgroundColor: danger
              ? isWF
                ? "#D0D0D0"
                : "#FEE2E2"
              : isWF
                ? "#E0E0E0"
                : colors.petrolLight,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={16}
          color={
            danger
              ? isWF
                ? "#555"
                : colors.signalRed
              : isWF
                ? "#444"
                : colors.petrolDeep
          }
        />
      </View>

      <Text
        style={[
          styles.rowLabel,
          {
            color: danger
              ? isWF
                ? "#555"
                : colors.signalRed
              : isWF
                ? "#1A1A1A"
                : colors.charcoalInk,
            fontFamily: font("body"),
            fontSize: FontSizes.base,
            flex: 1,
          },
        ]}
      >
        {label}
      </Text>

      {isSwitch ? (
        <Switch
          value={switchVal}
          onValueChange={onSwitch}
          trackColor={{
            true: isWF ? "#888" : "#F97316",
            false: isWF ? "#CCC" : colors.divider,
          }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text
          style={{
            color: isWF ? "#888" : colors.inkLight,
            fontFamily: font("body"),
            fontSize: FontSizes.sm,
          }}
        >
          {value}
        </Text>
      ) : (
        <Feather
          name="chevron-right"
          size={18}
          color={isWF ? "#BBBBBB" : colors.inkFaint}
        />
      )}
    </TouchableOpacity>
  );

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading && !user) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
          },
        ]}
      >
        <View style={styles.topBar}>
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
            Profile
          </Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={isWF ? "#555" : colors.petrolDeep}
          />

          <Text
            style={{
              marginTop: Spacing.md,
              color: isWF ? "#555" : colors.inkLight,
              fontFamily: font("body"),
              fontSize: FontSizes.sm,
            }}
          >
            Loading your profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ============================================================
   * MAIN SCREEN
   * ============================================================
   */

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      <View style={styles.topBar}>
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
          Profile
        </Text>

        {refreshing && (
          <ActivityIndicator
            size="small"
            color={isWF ? "#555" : colors.petrolDeep}
          />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* =====================================================
            PROFILE HEADER
        ====================================================== */}

        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isWF ? "#D0D0D0" : colors.petrolDeep,
                },
              ]}
            >
              {isWF ? (
                <Feather name="user" size={24} color="#555" />
              ) : (
                <Text style={{ fontSize: 32 }}>👤</Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  {
                    color: isWF ? "#1A1A1A" : colors.charcoalInk,
                    fontFamily: font("displayBold"),
                    fontSize: FontSizes.lg,
                  },
                ]}
              >
                {user?.name || "User"}
              </Text>

              <Text
                style={[
                  {
                    color: isWF ? "#555" : colors.inkLight,
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                {user?.email || ""}
              </Text>

              <Text
                style={[
                  {
                    color: isWF ? "#555" : colors.inkLight,
                    fontFamily: font("body"),
                    fontSize: FontSizes.sm,
                  },
                ]}
              >
                {user?.phone || ""}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.editBtn,
                {
                  backgroundColor: isWF ? "#E0E0E0" : colors.petrolLight,
                },
              ]}
              onPress={() => navigation.navigate("PersonalInformation")}
              activeOpacity={0.7}
            >
              <Feather
                name="edit-2"
                size={16}
                color={isWF ? "#444" : colors.petrolDeep}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* =====================================================
            ACCOUNT
        ====================================================== */}

        <Section title="Account">
          <Row
            icon="user"
            label="Personal Information"
            onPress={() => navigation.navigate("PersonalInformation")}
          />

          <Row
            icon="shield"
            label="Change Password"
            onPress={() => navigation.navigate("ChangePassword")}
          />

          <Row
            icon="phone"
            label="Phone Number"
            value={user?.phone}
            onPress={() => navigation.navigate("PersonalInformation")}
          />
        </Section>

        {/* =====================================================
            ADDRESSES
        ====================================================== */}

        <Section title="Addresses">
          {user?.savedAddresses && user.savedAddresses.length > 0 ? (
            user.savedAddresses.map((addr) => (
              <Row
                key={addr.id}
                icon={
                  addr.label === "Home"
                    ? "home"
                    : addr.label === "Work"
                      ? "briefcase"
                      : "map-pin"
                }
                label={`${addr.label} - ${addr.street}`}
                value={addr.city ? `${addr.suburb}, ${addr.city}` : undefined}
                onPress={() =>
                  navigation.navigate("AddAddress", {
                    existing: addr,
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Feather
                name="map-pin"
                size={18}
                color={isWF ? "#999" : colors.inkFaint}
              />

              <Text
                style={{
                  color: isWF ? "#777" : colors.inkLight,
                  fontFamily: font("body"),
                  fontSize: FontSizes.sm,
                }}
              >
                No saved addresses
              </Text>
            </View>
          )}

          <Row
            icon="plus"
            label="Add new address"
            onPress={() => navigation.navigate("AddAddress")}
          />
        </Section>

        {/* =====================================================
            NOTIFICATIONS
        ====================================================== */}

        <Section title="Notifications">
          <Row
            icon="bell"
            label="Push notifications"
            isSwitch
            switchVal={pushEnabled}
            onSwitch={setPushEnabled}
          />

          <Row
            icon="message-square"
            label="SMS updates"
            isSwitch
            switchVal={smsEnabled}
            onSwitch={setSmsEnabled}
          />
        </Section>

        {/* =====================================================
            LANGUAGE
        ====================================================== */}

        {/* =====================================================
    LANGUAGE
====================================================== */}

        <Section title={t("profile.language")}>
          <TouchableOpacity
            style={[
              styles.langRow,
              {
                borderBottomColor: isWF ? "#EEE" : colors.divider,
              },
            ]}
            onPress={() => handleLanguageChange("en")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  flex: 1,
                },
              ]}
            >
              {t("languages.english")}
            </Text>

            {language === "en" && (
              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: isWF ? "#888" : colors.petrolDeep,
                  },
                ]}
              >
                <Feather name="check" size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langRow,
              {
                borderBottomColor: isWF ? "#EEE" : colors.divider,
              },
            ]}
            onPress={() => handleLanguageChange("af")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                {
                  color: isWF ? "#1A1A1A" : colors.charcoalInk,
                  fontFamily: font("body"),
                  fontSize: FontSizes.base,
                  flex: 1,
                },
              ]}
            >
              {t("languages.afrikaans")}
            </Text>

            {language === "af" && (
              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: isWF ? "#888" : colors.petrolDeep,
                  },
                ]}
              >
                <Feather name="check" size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </Section>

        {/* =====================================================
            APP
        ====================================================== */}

        <Section title="App">
          <Row
            icon="help-circle"
            label="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
          />

          <Row
            icon="file-text"
            label="Terms of Use"
            onPress={() => navigation.navigate("TermsOfUse")}
          />

          <Row
            icon="lock"
            label="Privacy Policy"
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />

          <Row icon="info" label="App version" value="1.0.0" />
        </Section>

        {/* =====================================================
            SIGN OUT
        ====================================================== */}

        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          size="md"
          style={{
            marginTop: Spacing.sm,
          }}
          icon={<Feather name="log-out" size={16} color="#FFFFFF" />}
        />

        <Text
          style={[
            {
              textAlign: "center",
              color: isWF ? "#AAAAAA" : colors.inkFaint,
              fontFamily: font("body"),
              fontSize: FontSizes.xs,
              marginTop: Spacing.md,
            },
          ]}
        >
          FuelNow v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  topBar: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {},

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing["4xl"],
    gap: Spacing.lg,
  },

  profileCard: {},

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    paddingLeft: Spacing.xs,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 62,
  },

  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  rowLabel: {},

  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    minHeight: 58,
  },

  langRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderBottomWidth: 1,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
