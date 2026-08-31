import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useDesignMode } from '../context/DesignModeContext';
import { Radius, Shadow, Spacing, FontSizes, Fonts } from '../theme/tokens';

export default function DesignModeToggle() {
  const { mode, toggleMode, colors, isWireframe } = useDesignMode();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isWireframe ? '#4A4A4A' : colors.petrolDeep,
            borderColor: isWireframe ? '#888' : colors.ignitionAmber,
            ...Shadow.lg,
          },
        ]}
        onPress={toggleMode}
        activeOpacity={0.85}
      >
        <Text style={styles.emoji}>{isWireframe ? '🎨' : '📐'}</Text>
        <Text style={[styles.label, { color: '#FFFFFF' }]}>
          {isWireframe ? 'Hi-Fi' : 'Wireframe'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.base,
    zIndex: 9999,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bodyMedium,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
