/**
 * SOSButton.tsx — Full-screen SOS trigger button with hold-to-activate UX.
 * Hold for 1.5 seconds to prevent accidental activation.
 */
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Pressable } from 'react-native';

import { colors, shadows, typography } from './theme';

export interface SOSButtonProps {
  onActivate: () => void;
  holdDurationMs?: number;
  size?: number;
}

export function SOSButton({ onActivate, holdDurationMs = 1500, size = 120 }: SOSButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const startHold = useCallback(
    (_: GestureResponderEvent) => {
      setIsHolding(true);
      Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true }).start();

      progressAnim.setValue(0);
      progressAnimation.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: holdDurationMs,
        useNativeDriver: false,
      });
      progressAnimation.current.start();

      holdTimer.current = setTimeout(() => {
        onActivate();
        releaseHold();
      }, holdDurationMs);
    },
    [onActivate, holdDurationMs],
  );

  const releaseHold = useCallback(() => {
    setIsHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    progressAnimation.current?.stop();
    progressAnim.setValue(0);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  }, []);

  const progressSize = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={startHold}
          onPressOut={releaseHold}
          accessibilityRole="button"
          accessibilityLabel="SOS — Hold to activate emergency alert"
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
            shadows.lg,
          ]}
        >
          {isHolding && (
            <Animated.View
              style={[
                styles.progress,
                {
                  width: progressSize,
                  height: progressSize,
                  borderRadius: size / 2,
                },
              ]}
            />
          )}
          <Text style={styles.label}>SOS</Text>
          {isHolding && <Text style={styles.subLabel}>Keep holding…</Text>}
        </Pressable>
      </Animated.View>
      {!isHolding && <Text style={styles.hint}>Hold to activate</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    backgroundColor: colors.dangerDark,
  },
  label: {
    color: colors.white,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 2,
  },
  subLabel: {
    color: colors.dangerLight,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  hint: {
    color: colors.gray500,
    fontSize: typography.fontSize.sm,
  },
});
