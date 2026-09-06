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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather
            name="arrow-left"
            size={22}
            color={headingColor}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: headingColor,
              fontFamily: font('display'),
              fontSize: FontSizes.md,
            },
          ]}
        >
          Privacy Policy
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card>
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
              styles.updated,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Last updated: September 2026
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            1. Information We Collect
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            FuelNow may collect information required to
            create and manage your account and process
            deliveries. This may include your name, email
            address, phone number, delivery addresses,
            orders and payment-related information.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            2. How We Use Information
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Information may be used to authenticate your
            account, process fuel orders, coordinate
            deliveries, communicate with you about orders,
            provide customer support and improve the
            FuelNow service.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            3. Account Information
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Your account information is associated with
            your FuelNow profile. You should keep your
            login credentials confidential and notify
            FuelNow if you believe your account has been
            accessed without permission.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            4. Location and Delivery Information
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Delivery addresses and related information may
            be used to fulfil fuel deliveries and provide
            delivery updates.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            5. Payment Information
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            Payment information is used to process orders
            and maintain payment records. FuelNow should
            not store sensitive card authentication data
            such as CVV values in its application database.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            6. Data Security
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            FuelNow uses authentication and access controls
            designed to protect customer information.
            However, no internet-based system can guarantee
            absolute security.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            7. Your Rights
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            You may request information about your personal
            data and ask for incorrect information to be
            corrected, subject to applicable laws and
            operational requirements.
          </Text>

          <Text
            style={[
              styles.heading,
              {
                color: headingColor,
                fontFamily: font('displayBold'),
              },
            ]}
          >
            8. Contact
          </Text>

          <Text
            style={[
              styles.body,
              {
                color: bodyColor,
                fontFamily: font('body'),
              },
            ]}
          >
            For privacy-related questions, please contact
            FuelNow through the application's Help &
            Support section.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {},

  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },

  title: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },

  updated: {
    fontSize: FontSizes.xs,
    marginBottom: Spacing.lg,
  },

  heading: {
    fontSize: FontSizes.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  body: {
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
});