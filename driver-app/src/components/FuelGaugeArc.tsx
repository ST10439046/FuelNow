import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Circle, G, Line } from 'react-native-svg';
import { useDesignMode } from '../context/DesignModeContext';
import { FontSizes, Fonts } from '../theme/tokens';

interface FuelGaugeArcProps {
  /** Current value */
  value: number;
  /** Maximum value (100 for %, litre count, minutes, etc.) */
  max: number;
  /** Label shown below the numeric readout */
  label?: string;
  /** Unit suffix shown next to the readout */
  unit?: string;
  /** Diameter of the gauge in pixels */
  size?: number;
  /** Override the accent/fill colour */
  color?: string;
  /** If true, shows tick marks around the arc */
  showTicks?: boolean;
  /** Animate the needle on mount/value change */
  animated?: boolean;
}

const TO_RAD = Math.PI / 180;

/**
 * FuelGaugeArc — Signature reusable speedometer-style dial.
 *
 * The arc sweeps from 220° (left) to -40° (right), i.e. a 220° sweep.
 * Used for: order progress, ETA countdown, loyalty progress, driver earnings.
 */
export default function FuelGaugeArc({
  value,
  max,
  label,
  unit,
  size = 200,
  color,
  showTicks = true,
  animated = true,
}: FuelGaugeArcProps) {
  const { colors, font, isWireframe } = useDesignMode();

  const accentColor = isWireframe ? '#888888' : (color ?? colors.ignitionAmber);
  const trackColor = isWireframe ? '#DDDDDD' : colors.petrolLight;
  const textColor = isWireframe ? '#1A1A1A' : colors.charcoalInk;
  const needleColor = isWireframe ? '#555555' : colors.ignitionAmber;

  const ratio = Math.min(Math.max(value / max, 0), 1);

  // Arc geometry
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const strokeW = (size / 2) * 0.105;

  // Sweep: 220° starting at 200° clock position (bottom-left)
  const startAngle = 200; // degrees
  const totalSweep = 220; // degrees
  const endAngle = startAngle + totalSweep;

  const polarToCartesian = (angleDeg: number) => {
    const a = (angleDeg - 90) * TO_RAD;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
    };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const filledEnd = startAngle + totalSweep * ratio;
  const filledPath = ratio > 0 ? describeArc(startAngle, filledEnd) : '';

  // Needle
  const needleAngle = (startAngle + totalSweep * ratio - 90) * TO_RAD;
  const needleLen = r * 0.82;
  const needleTailLen = r * 0.18;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy + needleLen * Math.sin(needleAngle);
  const ntx = cx - needleTailLen * Math.cos(needleAngle);
  const nty = cy - needleTailLen * Math.sin(needleAngle);

  // Animation
  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (animated) {
      Animated.timing(animVal, {
        toValue: ratio,
        duration: 900,
        useNativeDriver: false,
      }).start();
    } else {
      animVal.setValue(ratio);
    }
  }, [ratio]);

  // Tick marks
  const ticks = showTicks
    ? Array.from({ length: 9 }, (_, i) => {
        const angle = (startAngle + (totalSweep / 8) * i - 90) * TO_RAD;
        const rOuter = r + strokeW * 0.75;
        const rInner = r + strokeW * 0.3;
        return {
          x1: cx + rInner * Math.cos(angle),
          y1: cy + rInner * Math.sin(angle),
          x2: cx + rOuter * Math.cos(angle),
          y2: cy + rOuter * Math.sin(angle),
        };
      })
    : [];

  const displayValue =
    unit === 'min' && value > 60
      ? `${Math.floor(value / 60)}h ${value % 60}m`
      : value % 1 === 0
      ? String(Math.round(value))
      : value.toFixed(1);

  return (
    <View style={[styles.container, { width: size }]}>
      <Svg width={size} height={size * 0.85}>
        {/* Track arc */}
        <Path
          d={describeArc(startAngle, endAngle)}
          stroke={trackColor}
          strokeWidth={strokeW}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {ratio > 0 && (
          <Path
            d={filledPath}
            stroke={accentColor}
            strokeWidth={strokeW}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Tick marks */}
        {ticks.map((t, i) => (
          <Line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={isWireframe ? '#BBBBBB' : colors.divider}
            strokeWidth={1.5}
          />
        ))}
        {/* Needle */}
        <G>
          <Line
            x1={ntx}
            y1={nty}
            x2={nx}
            y2={ny}
            stroke={needleColor}
            strokeWidth={size * 0.018}
            strokeLinecap="round"
          />
          {/* Needle hub */}
          <Circle
            cx={cx}
            cy={cy}
            r={size * 0.045}
            fill={needleColor}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={size * 0.022}
            fill={isWireframe ? '#FFFFFF' : colors.warmAsh}
          />
        </G>
      </Svg>

      {/* Value placement underneath the gauge */}
      <View style={styles.underneathContainer}>
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.valueText,
              {
                fontSize: size * 0.14,
                color: textColor,
                fontFamily: isWireframe ? undefined : Fonts.monoBold,
              },
            ]}
          >
            {displayValue}
          </Text>
          {unit ? (
            <Text
              style={[
                styles.unitText,
                {
                  fontSize: size * 0.065,
                  color: isWireframe ? '#666' : colors.inkLight,
                  fontFamily: isWireframe ? undefined : Fonts.mono,
                  marginLeft: 2,
                },
              ]}
            >
              {unit}
            </Text>
          ) : null}
        </View>
        {label ? (
          <Text
            style={[
              styles.labelText,
              {
                fontSize: size * 0.06,
                color: isWireframe ? '#888' : colors.inkLight,
                fontFamily: isWireframe ? undefined : font('body'),
                marginTop: 1,
              },
            ]}
          >
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  underneathContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: '700',
  },
  unitText: {
    letterSpacing: 0.5,
  },
  labelText: {
    letterSpacing: 0.2,
  },
});
