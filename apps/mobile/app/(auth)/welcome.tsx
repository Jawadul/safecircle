import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, colors, spacing, typography } from '@safecircle/ui';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>SafeCircle</Text>
        <Text style={styles.tagline}>Your personal safety circle, always with you.</Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Get Started"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/phone-entry')}
        />
        <Text style={styles.privacy}>
          Your location is only shared during active sessions. We never track you otherwise.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 60,
  },
  hero: { alignItems: 'center', gap: spacing.md },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.fontSize.lg,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  },
  actions: { gap: spacing.md },
  privacy: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
});
