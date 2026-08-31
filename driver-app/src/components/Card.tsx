import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useDesignMode } from '../context/DesignModeContext';
import { Radius, Shadow, Spacing } from '../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

export default function Card({
  children,
  style,
  padded = true,
  elevated = true,
  variant = 'default',
}: CardProps) {
  const { colors, isWireframe } = useDesignMode();

  const getBg = () => {
    if (isWireframe) return '#FFFFFF';
    switch (variant) {
      case 'filled':
        return colors.petrolLight;
      default:
        return colors.cardBg;
    }
  };

  const getBorder = () => {
    if (isWireframe) return { borderWidth: 1.5, borderColor: '#CCCCCC' };
    if (variant === 'outlined') return { borderWidth: 1, borderColor: colors.divider };
    return {};
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: getBg(),
          borderRadius: isWireframe ? Radius.sm : Radius.lg,
          ...(padded ? { padding: Spacing.base } : {}),
          ...(elevated && !isWireframe ? Shadow.md : {}),
          ...getBorder(),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
});
