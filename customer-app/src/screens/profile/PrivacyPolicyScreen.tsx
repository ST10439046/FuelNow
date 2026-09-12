import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useDesignMode } from '../../context/DesignModeContext';
import {
  FontSizes,
  Spacing,
} from '../../theme/tokens';
import Card from '../../components/Card';

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
          borderTopColor: isWF
            ? '#D5D5D5'
            : '#E5E0D8',
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor: isWF
                ? '#DADADA'
                : '#EFE9DE',
            },
          ]}
        >
          <Text
            style={[
              styles.number,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
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
              fontFamily: font('displayBold'),
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
            fontFamily: font('body'),
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({
  navigation,
}: Props) {
  const {
    colors,
    font,
    isWireframe: isWF,
  } = useDesignMode();

  const headingColor = isWF
    ? '#1A1A1A'
    : colors.charcoalInk;

  const bodyColor = isWF
    ? '#555'
    : colors.inkLight;

  const accentColor = isWF
    ? '#333'
    : colors.charcoalInk;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isWF
            ? '#F0F0F0'
            : colors.warmAsh,
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
              backgroundColor: isWF
                ? '#E2E2E2'
                : '#FFFFFF',
              borderColor: isWF
                ? '#CCCCCC'
                : '#E8E2D9',
            },
          ]}
          activeOpacity={0.75}
        >
          <Feather
            name="arrow-left"
            size={20}
            color={headingColor}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: headingColor,
              fontFamily: font('displayBold'),
              fontSize: FontSizes.md,
            },
          ]}
        >
          Privacy Policy
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View
            style={[
              styles.documentIcon,
              {
                backgroundColor: isWF
                  ? '#DCDCDC'
                  : '#E8E1D5',
              },
            ]}
          >
            <Feather
              name="shield"
              size={26}
              color={accentColor}
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            FuelNow Privacy Policy
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Learn how FuelNow collects, uses and protects
            your personal information.
          </Text>

          <View
            style={[
              styles.updatedPill,
              {
                backgroundColor: isWF
                  ? '#E1E1E1'
                  : '#FFFFFF',
                borderColor: isWF
                  ? '#D0D0D0'
                  : '#E5DED3',
              },
            ]}
          >
            <Feather
              name="calendar"
              size={13}
              color={bodyColor}
            />

            <Text
              style={[
                styles.updated,
                {
                  color: bodyColor,
                  fontFamily: font('body'),
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
            title="Information We Collect"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            FuelNow may collect information required to
            create and manage your account and process
            deliveries. This may include your name, email
            address, phone number, delivery addresses,
            orders and payment-related information.
          </LegalSection>

          <LegalSection
            number="02"
            title="How We Use Information"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Information may be used to authenticate your
            account, process fuel orders, coordinate
            deliveries, communicate with you about orders,
            provide customer support and improve the
            FuelNow service.
          </LegalSection>

          <LegalSection
            number="03"
            title="Account Information"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Your account information is associated with
            your FuelNow profile. You should keep your
            login credentials confidential and notify
            FuelNow if you believe your account has been
            accessed without permission.
          </LegalSection>

          <LegalSection
            number="04"
            title="Location & Delivery Information"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Delivery addresses and related information may
            be used to fulfil fuel deliveries and provide
            delivery updates.
          </LegalSection>

          <LegalSection
            number="05"
            title="Payment Information"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            Payment information is used to process orders
            and maintain payment records. FuelNow should
            not store sensitive card authentication data
            such as CVV values in its application database.
          </LegalSection>

          <LegalSection
            number="06"
            title="Data Security"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            FuelNow uses authentication and access controls
            designed to protect customer information.
            However, no internet-based system can guarantee
            absolute security.
          </LegalSection>

          <LegalSection
            number="07"
            title="Your Rights"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            You may request information about your personal
            data and ask for incorrect information to be
            corrected, subject to applicable laws and
            operational requirements.
          </LegalSection>

          <LegalSection
            number="08"
            title="Contact"
            headingColor={headingColor}
            bodyColor={bodyColor}
            font={font}
            isWF={isWF}
          >
            For privacy-related questions, please contact
            FuelNow through the application's Help &
            Support section.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  headerTitle: {
    textAlign: 'center',
  },

  headerSpacer: {
    width: 42,
  },

  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },

  hero: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  documentIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },

  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.md,
  },

  updatedPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  numberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: Spacing['4xl'],
  },
});