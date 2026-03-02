import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { borderRadius, colors, shadows, spacing } from './theme';

export interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  children: React.ReactNode;
}

export function Card({ style, elevated = false, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, elevated && shadows.md, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
});
