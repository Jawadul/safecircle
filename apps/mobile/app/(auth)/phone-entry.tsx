import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, colors, spacing, typography } from '@safecircle/ui';
import { authApi } from '../../src/services/api.client';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone.startsWith('+') || phone.length < 8) {
      Alert.alert('Invalid phone', 'Enter your phone number in international format (e.g. +8801XXXXXXXXX)');
      return;
    }

    setLoading(true);
    try {
      await authApi.requestOtp(phone);
      router.push({ pathname: '/(auth)/otp-verify', params: { phone } });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your number</Text>
      <Text style={styles.subtitle}>We'll send you a verification code.</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+8801700000000"
        keyboardType="phone-pad"
        autoFocus
        accessibilityLabel="Phone number input"
      />

      <Button
        label="Send Code"
        size="lg"
        fullWidth
        loading={loading}
        disabled={phone.length < 8}
        onPress={handleSubmit}
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
    fontSize: typography.fontSize.xl,
    color: colors.gray900,
    letterSpacing: 2,
  },
});
