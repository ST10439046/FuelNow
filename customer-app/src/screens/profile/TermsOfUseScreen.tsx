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

export default function TermsOfUseScreen({
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
          Terms of Use
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
            FuelNow Terms of Use
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
            1. Acceptance of Terms
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
            By using the FuelNow application, you agree
            to these Terms of Use. If you do not agree with
            these terms, please do not use the application.
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
            2. Fuel Orders
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
            FuelNow allows customers to request fuel
            deliveries to supported delivery locations.
            Orders are subject to availability, delivery
            coverage, applicable pricing and operational
            conditions.
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
            3. Customer Responsibilities
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
            Customers are responsible for providing
            accurate contact information, delivery
            addresses and order information. Customers
            should ensure that delivery locations are
            accessible and suitable for fuel delivery.
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
            4. Payments
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
            Customers are responsible for completing
            payment for confirmed orders. Prices, delivery
            fees and other applicable charges will be shown
            before an order is confirmed.
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
            5. Cancellations
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
            Orders may be cancelled subject to the current
            order status and FuelNow cancellation rules.
            Additional charges may apply where delivery
            operations have already commenced.
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
            6. Service Availability
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
            FuelNow may temporarily suspend or limit
            services for maintenance, technical problems,
            fuel availability, safety concerns or other
            operational reasons.
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
            7. Contact
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
            If you have questions about these Terms of Use,
            please contact FuelNow support through the
            application's Help & Support section.
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