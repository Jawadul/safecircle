import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, colors, spacing, typography } from '@safecircle/ui';
import { authApi } from '../../src/services/api.client';
import { useAuthStore } from '../../src/stores/auth.store';

export default function OtpVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      setAuth(res.user, res.tokens);
      router.replace('/(app)/home');
    } catch (err) {
      Alert.alert('Invalid code', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>

      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        accessibilityLabel="OTP code input"
      />

      <Button
        label="Verify"
        size="lg"
        fullWidth
        loading={loading}
        disabled={otp.length !== 6}
        onPress={handleVerify}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  },
  subtitle: { fontSize: typography.fontSize.md, color: colors.gray500 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.fontSize.xxxl,
    color: colors.gray900,
    textAlign: 'center',
    letterSpacing: 12,
  },
});
