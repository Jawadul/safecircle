import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? colors.primary : colors.white}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}` as const], styles[`label_${size}` as const]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: {
    backgroundColor: colors.white,
    borderColor: colors.primary,
  },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },

  // Sizes
  sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, minHeight: 36 },
  md: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg, minHeight: 44 },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, minHeight: 52 },

  // Labels
  label: { fontWeight: typography.fontWeight.semibold },
  label_primary: { color: colors.white, fontSize: typography.fontSize.md },
  label_secondary: { color: colors.primary, fontSize: typography.fontSize.md },
  label_danger: { color: colors.white, fontSize: typography.fontSize.md },
  label_ghost: { color: colors.primary, fontSize: typography.fontSize.md },
  label_sm: { fontSize: typography.fontSize.sm },
  label_md: { fontSize: typography.fontSize.md },
  label_lg: { fontSize: typography.fontSize.lg },
});
