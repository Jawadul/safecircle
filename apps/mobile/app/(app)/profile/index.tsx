import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, colors, spacing, typography } from '@safecircle/ui';
import { useAuthStore } from '../../../src/stores/auth.store';
import { authApi } from '../../../src/services/api.client';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, tokens, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          if (tokens?.refreshToken) {
            await authApi.logout(tokens.refreshToken).catch(() => {});
          }
          clearAuth();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile & Settings</Text>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <Text style={styles.name}>{user?.name}</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Share location with contacts</Text>
          <Switch
            value={user?.privacySettings.shareLocationWithContacts ?? true}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Reduce location precision</Text>
          <Switch
            value={user?.privacySettings.reduceLocationPrecision ?? false}
            trackColor={{ true: colors.primary }}
          />
        </View>
      </Card>

      <Button label="Log Out" variant="danger" fullWidth onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.gray900 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: 1 },
  phone: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray900 },
  name: { fontSize: typography.fontSize.md, color: colors.gray600 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: typography.fontSize.md, color: colors.gray700, flex: 1 },
});
