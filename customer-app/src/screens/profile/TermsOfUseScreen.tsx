import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useDesignMode } from "../../context/DesignModeContext";
import { FontSizes, Spacing } from "../../theme/tokens";
import Card from "../../components/Card";

interface Props {
  navigation: any;
}

interface SectionProps {
  number: string;
  title: string;
  children: string;
  headingColor: string;
  bodyColor: string;
  font: (type: any) => string | undefined;
  isWF: boolean;
}

function LegalSection({
  number,
  title,
  children,
  headingColor,
  bodyColor,
  font,
  isWF,
}: SectionProps) {
  return (
    <View
      style={[
        styles.section,
        {
          borderTopColor: isWF ? "#D5D5D5" : "#E5E0D8",
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor: isWF ? "#DADADA" : "#EFE9DE",
            },
          ]}
        >
          <Text
            style={[
              styles.number,
              {
                color: headingColor,
                fontFamily: font("displayBold"),
              },
            ]}
          >
            {number}
          </Text>
        </View>

        <Text
          style={[
            styles.heading,
            {
              color: headingColor,
              fontFamily: font("displayBold"),
            },
          ]}
        >
          {title}
        </Text>
      </View>

      <Text
        style={[
          styles.body,
          {
            color: bodyColor,
            fontFamily: font("body"),
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export default function TermsOfUseScreen({ navigation }: Props) {
  const { colors, font, isWireframe: isWF } = useDesignMode();

  const headingColor = isWF ? "#1A1A1A" : colors.charcoalInk;

  const bodyColor = isWF ? "#555" : colors.inkLight;

  const accentColor = isWF ? "#333" : colors.charcoalInk;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF ? "#F0F0F0" : colors.warmAsh,
        },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backButton,
            {
              backgroundColor: isWF ? "#E2E2E2" : "#FFFFFF",
              borderColor: isWF ? "#CCCCCC" : "#E8E2D9",
            },
          ]}
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={20} color={headingColor} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: headingColor,
              fontFamily: font("displayBold"),
              fontSize: FontSizes.md,
            },
          ]}
        >
          Terms of Use
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View
            style={[
              styles.documentIcon,
              {
                backgroundColor: isWF ? "#DCDCDC" : "#E8E1D5",
              },
            ]}
          >
            <Feather name="file-text" size={26} color={accentColor} />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: headingColor,
                fontFamily: font("displayBold"),
              },
            ]}
          >
            FuelNow Terms of Use
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: bodyColor,
                fontFamily: font("body"),
              },
            ]}
          >
            Please review the terms that apply when using the FuelNow service.
          </Text>

          <View
            style={[
              styles.updatedPill,
              {
                backgroundColor: isWF ? "#E1E1E1" : "#FFFFFF",
                borderColor: isWF ? "#D0D0D0" : "#E5DED3",
              },
            ]}
          >
            <Feather name="calendar" size={13} color={bodyColor} />

            <Text
              style={[
                styles.updated,
                {
                  color: bodyColor,
                  fontFamily: font("body"),
                },
              ]}
            >
              Updated September 2026
            </Text>
          </View>
        </View>

        {/* CONTENT */}
        <Card>
          <LegalSection
            number="01"
            title="Acceptance of Terms"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            By using the FuelNow application, you agree to these Terms of Use.
            If you do not agree with these terms, please do not use the
            application.
          </LegalSection>

          <LegalSection
            number="02"
            title="Fuel Orders"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            FuelNow allows customers to request fuel deliveries to supported
            delivery locations. Orders are subject to availability, delivery
            coverage, applicable pricing and operational conditions.
          </LegalSection>

          <LegalSection
            number="03"
            title="Customer Responsibilities"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Customers are responsible for providing accurate contact
            information, delivery addresses and order information. Customers
            should ensure that delivery locations are accessible and suitable
            for fuel delivery.
          </LegalSection>

          <LegalSection
            number="04"
            title="Payments"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Customers are responsible for completing payment for confirmed
            orders. Prices, delivery fees and other applicable charges will be
            shown before an order is confirmed.
          </LegalSection>

          <LegalSection
            number="05"
            title="Cancellations"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Orders may be cancelled subject to the current order status and
            FuelNow cancellation rules. Additional charges may apply where
            delivery operations have already commenced.
          </LegalSection>

          <LegalSection
            number="06"
            title="Service Availability"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            FuelNow may temporarily suspend or limit services for maintenance,
            technical problems, fuel availability, safety concerns or other
            operational reasons.
          </LegalSection>

          <LegalSection
            number="07"
            title="Contact"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            If you have questions about these Terms of Use, please contact
            FuelNow support through the application's Help & Support section.
          </LegalSection>
        </Card>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  headerTitle: {
    textAlign: "center",
  },

  headerSpacer: {
    width: 42,
  },

  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },

  hero: {
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  documentIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: FontSizes.xl,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: Spacing.md,
  },

  updatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },

  updated: {
    fontSize: FontSizes.xs,
  },

  section: {
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },

  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  number: {
    fontSize: 11,
  },

  heading: {
    flex: 1,
    fontSize: FontSizes.md,
  },

  body: {
    fontSize: FontSizes.sm,
    lineHeight: 23,
    paddingLeft: 44,
  },

  bottomSpace: {
    height: Spacing["4xl"],
  },
});
