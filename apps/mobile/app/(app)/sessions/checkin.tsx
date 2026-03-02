import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, colors, spacing, typography } from '@safecircle/ui';
import { useSession } from '../../../src/hooks/useSession';
import { useContactStore } from '../../../src/stores/contact.store';

export default function CheckInSetupScreen() {
  const router = useRouter();
  const { startCheckIn, isSettingUp, setupError } = useSession();
  const { contacts } = useContactStore();

  const [destination, setDestination] = useState('');
  const [eta, setEta] = useState('');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const verifiedContacts = contacts.filter((c) => c.isVerified && c.status === 'ACTIVE');

  const handleStart = async () => {
    if (!destination || !eta || selectedContacts.length === 0) {
      Alert.alert('Missing fields', 'Please fill in all fields and select at least one contact.');
      return;
    }

    const etaDate = new Date(eta);
    if (isNaN(etaDate.getTime()) || etaDate <= new Date()) {
      Alert.alert('Invalid ETA', 'ETA must be in the future.');
      return;
    }

    await startCheckIn({
      destination,
      etaAt: etaDate.toISOString(),
      gracePeriodMinutes: parseInt(gracePeriod, 10),
      shareWith: selectedContacts,
    });

    if (!setupError) {
      router.replace('/(app)/home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Check In</Text>
      <Text style={styles.subtitle}>Set your destination and share your arrival with trusted contacts.</Text>

      <Card>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Mom's house, Office"
        />

        <Text style={styles.label}>ETA</Text>
        <TextInput
          style={styles.input}
          value={eta}
          onChangeText={setEta}
          placeholder="YYYY-MM-DDTHH:MM (e.g. 2024-01-15T18:30)"
        />

        <Text style={styles.label}>Grace Period (minutes)</Text>
        <TextInput
          style={styles.input}
          value={gracePeriod}
          onChangeText={setGracePeriod}
          keyboardType="number-pad"
          placeholder="15"
        />
      </Card>

      <Card>
        <Text style={styles.label}>Share With</Text>
        {verifiedContacts.length === 0 ? (
          <Text style={styles.noContacts}>Add verified contacts first.</Text>
        ) : (
          verifiedContacts.map((c) => (
            <View key={c.id} style={styles.contactRow}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Button
                label={selectedContacts.includes(c.id) ? 'Selected ✓' : 'Select'}
                variant={selectedContacts.includes(c.id) ? 'primary' : 'secondary'}
                size="sm"
                onPress={() =>
                  setSelectedContacts((prev) =>
                    prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                  )
                }
              />
            </View>
          ))
        )}
      </Card>

      {setupError && <Text style={styles.error}>{setupError}</Text>}

      <Button
        label="Start Check In"
        size="lg"
        fullWidth
        loading={isSettingUp}
        disabled={!destination || !eta || selectedContacts.length === 0}
        onPress={handleStart}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 60 },
  title: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.gray900 },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.gray500 },
  label: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray600, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  contactName: { fontSize: typography.fontSize.md, color: colors.gray900 },
  noContacts: { color: colors.gray400, fontSize: typography.fontSize.sm },
  error: { color: colors.danger, fontSize: typography.fontSize.sm },
});
