import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../../context/DesignModeContext';
import { FontSizes, Spacing, Radius, Colors } from '../../theme/tokens';
import FuelGaugeArc from '../../components/FuelGaugeArc';
import Button from '../../components/Button';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    gaugeValue: 75,
    gaugeUnit: 'L',
    gaugeLabel: 'fuel delivered',
    title: 'Fuel, at your\ndoorstep.',
    subtitle:
      'Order petrol or diesel from your phone. We deliver to your home, office, or wherever your car is parked in Johannesburg, Pretoria & Cape Town.',
    accent: Colors.ignitionAmber,
  },
  {
    id: '2',
    gaugeValue: 23,
    gaugeUnit: 'min',
    gaugeLabel: 'avg. ETA',
    title: 'Live tracking,\nevery kilometre.',
    subtitle:
      "Watch your driver on the map in real time. Get notified when they're 2 minutes away — so you can meet them at the gate.",
    accent: Colors.dieselGreen,
  },
  {
    id: '3',
    gaugeValue: 340,
    gaugeUnit: 'pts',
    gaugeLabel: 'FuelPoints',
    title: 'Earn rewards\non every litre.',
    subtitle:
      'Collect FuelPoints with each delivery. Redeem them for free delivery fees — the more you fill up, the more you save.',
    accent: Colors.ignitionAmber,
  },
];

interface Props {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: Props) {
  const { colors, font, isWireframe } = useDesignMode();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const next = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((i) => i + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const skip = () => navigation.replace('Login');

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={[styles.slide, { width: W }]}>
      {/* Gauge */}
      <View style={styles.gaugeContainer}>
        {isWireframe ? (
          <View style={styles.wireframeGauge}>
            <Text style={styles.wireframeGaugeLabel}>[Gauge Dial]</Text>
          </View>
        ) : (
          <FuelGaugeArc
            value={item.gaugeValue}
            max={item.id === '3' ? 500 : item.id === '2' ? 45 : 100}
            label={item.gaugeLabel}
            unit={item.gaugeUnit}
            size={220}
            color={item.accent}
          />
        )}
      </View>

      {/* Text content */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            {
              color: isWireframe ? '#1A1A1A' : colors.charcoalInk,
              fontFamily: font('displayBold'),
              fontSize: FontSizes['2xl'],
            },
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: isWireframe ? '#555555' : colors.inkLight,
              fontFamily: font('body'),
              fontSize: FontSizes.base,
            },
          ]}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isWireframe ? '#F0F0F0' : colors.warmAsh },
      ]}
    >
      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text
            style={[
              styles.skipText,
              {
                color: isWireframe ? '#666' : colors.inkLight,
                fontFamily: font('bodyMedium'),
                fontSize: FontSizes.sm,
              },
            ]}
          >
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        keyExtractor={(i) => i.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === currentIndex
                    ? isWireframe
                      ? '#333'
                      : colors.ignitionAmber
                    : isWireframe
                    ? '#BBBBBB'
                    : colors.divider,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Button
          label={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={next}
          variant="primary"
          size="lg"
          icon={
            !isWireframe ? (
              <Feather name="arrow-right" size={18} color={colors.white} />
            ) : undefined
          }
        />
        {currentIndex === SLIDES.length - 1 && (
          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('Login')}>
            <Text
              style={[
                styles.loginText,
                {
                  color: isWireframe ? '#444' : colors.petrolDeep,
                  fontFamily: font('bodyMedium'),
                  fontSize: FontSizes.sm,
                },
              ]}
            >
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: {
    position: 'absolute',
    top: Spacing['2xl'],
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {},
  flatList: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  gaugeContainer: {
    marginBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  wireframeGauge: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: '#AAAAAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wireframeGaugeLabel: {
    color: '#888',
    fontSize: FontSizes.sm,
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.base,
    alignItems: 'center',
  },
  loginLink: { padding: Spacing.sm },
  loginText: {},
});
