import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useDesignMode } from '../context/DesignModeContext';
import { Fonts, FontSizes, Radius, Spacing } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const { colors, font, isWireframe } = useDesignMode();

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: isWireframe ? Radius.sm : Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
      opacity: disabled ? 0.45 : 1,
      ...(fullWidth ? { width: '100%' } : {}),
      ...sizeMap[size],
    };

    if (isWireframe) {
      return {
        ...base,
        backgroundColor: variant === 'outline' || variant === 'ghost' ? 'transparent' : '#B0B0B0',
        borderWidth: 1.5,
        borderColor: '#666666',
      };
    }

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.petrolDeep };
      case 'secondary':
        return { ...base, backgroundColor: colors.ignitionAmber };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.petrolDeep,
        };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'danger':
        return { ...base, backgroundColor: colors.signalRed };
      default:
        return { ...base, backgroundColor: colors.petrolDeep };
    }
  };

  const getTextColor = (): string => {
    if (isWireframe) return '#1A1A1A';
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return colors.white;
      case 'outline':
      case 'ghost':
        return colors.petrolDeep;
      default:
        return colors.white;
    }
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              {
                color: textColor,
                fontSize: textSizeMap[size],
                fontFamily: font('bodySemiBold'),
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const sizeMap: Record<Size, ViewStyle> = {
  sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  lg: { paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing.xl },
};

const textSizeMap: Record<Size, number> = {
  sm: FontSizes.sm,
  md: FontSizes.base,
  lg: FontSizes.md,
};

const styles = StyleSheet.create({
  label: {
    letterSpacing: 0.2,
  },
});
