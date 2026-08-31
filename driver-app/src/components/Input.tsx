import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDesignMode } from '../context/DesignModeContext';
import { FontSizes, Radius, Spacing } from '../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Feather icon name shorthand — rendered as left icon */
  icon?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export default function Input({
  label,
  error,
  hint,
  icon,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  multiline,
  numberOfLines,
  ...props
}: InputProps) {
  const { colors, font, isWireframe } = useDesignMode();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.signalRed
    : focused
    ? colors.petrolDeep
    : isWireframe
    ? '#999999'
    : colors.divider;

  // String icon shorthand takes priority over ReactNode leftIcon
  const resolvedLeftIcon = icon
    ? <Feather name={icon as any} size={16} color={isWireframe ? '#888' : colors.inkLight} />
    : leftIcon ?? null;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.charcoalInk, fontFamily: font('bodyMedium'), fontSize: FontSizes.sm }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            borderWidth: focused ? 1.5 : 1,
            borderRadius: isWireframe ? Radius.sm : Radius.md,
            backgroundColor: isWireframe ? '#F4F4F4' : colors.white,
            alignItems: multiline ? 'flex-start' : 'center',
            minHeight: multiline ? 80 : 50,
          },
        ]}
      >
        {resolvedLeftIcon ? (
          <View style={[styles.leftIcon, multiline && { paddingTop: 14 }]}>
            {resolvedLeftIcon}
          </View>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.charcoalInk,
              fontFamily: font('body'),
              fontSize: FontSizes.base,
              paddingLeft: resolvedLeftIcon ? 0 : Spacing.base,
              paddingRight: isPassword || rightIcon ? 0 : Spacing.base,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingTop: multiline ? Spacing.md : undefined,
            },
          ]}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color={colors.inkLight} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.hint, { color: colors.signalRed, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: colors.inkLight, fontFamily: font('body'), fontSize: FontSizes.xs }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.xs },
  label: { marginBottom: Spacing.xs },
  inputWrapper: { flexDirection: 'row' },
  input: { flex: 1, paddingVertical: Spacing.md },
  leftIcon: { paddingHorizontal: Spacing.md },
  rightIcon: { paddingHorizontal: Spacing.md },
  hint: { marginTop: Spacing.xs },
});
