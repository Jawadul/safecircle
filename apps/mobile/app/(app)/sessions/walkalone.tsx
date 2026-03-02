/**
 * walkalone.tsx — WalkAlone session setup screen.
 * User sets prompt interval (how often they confirm they're safe).
 * If they don't respond within the window, contacts are alerted.
 */
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, colors, spacing, typography } from '@safecircle/ui';
import { useSession } from '../../../src/hooks/useSession';
import { useContactStore } from '../../../src/stores/contact.store';

const INTERVAL_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '5 min', seconds: 300 },
  { label: 'Custom', seconds: 0 },
];

export default function WalkAloneSetupScreen() {
  const router = useRouter();
  const { startWalkAlone, isSettingUp, setupError } = useSession();
  const { contacts } = useContactStore();

  const [selectedPreset, setSelectedPreset] = useState(1); // default 2 min
  const [customInterval, setCustomInterval] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const verifiedContacts = contacts.filter((c) => c.isVerified && c.status === 'ACTIVE');

  const isCustom = selectedPreset === INTERVAL_PRESETS.length - 1;

  const getIntervalSeconds = (): number => {
    if (!isCustom) {
      return INTERVAL_PRESETS[selectedPreset]!.seconds;
    }
    const v = parseInt(customInterval, 10);
    return isNaN(v) ? 0 : v;
  };

  const handleStart = async () => {
    const intervalSeconds = getIntervalSeconds();

    if (intervalSeconds < 30) {
      Alert.alert('Invalid interval', 'Prompt interval must be at least 30 seconds.');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('No contacts selected', 'Select at least one trusted contact.');
      return;
    }

    await startWalkAlone({
      promptIntervalSeconds: intervalSeconds,
      shareWith: selectedContacts,
    });

    if (!setupError) {
      router.replace('/(app)/home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Walk Alone</Text>
      <Text style={styles.subtitle}>
        You'll receive a safety ping at each interval. Not responding triggers an alert to your contacts.
      </Text>

      {/* Prompt interval */}
      <Card>
        <Text style={styles.label}>Check-in interval</Text>
        <View style={styles.presetRow}>
          {INTERVAL_PRESETS.map((preset, idx) => (
            <Button
              key={preset.label}
              label={preset.label}
              variant={selectedPreset === idx ? 'primary' : 'secondary'}
              size="sm"
              onPress={() => setSelectedPreset(idx)}
            />
          ))}
        </View>

        {isCustom && (
          <>
            <Text style={styles.label}>Custom interval (seconds)</Text>
            <TextInput
              style={styles.input}
              value={customInterval}
              onChangeText={setCustomInterval}
              keyboardType="number-pad"
              placeholder="e.g. 90"
            />
          </>
        )}

        <Text style={styles.intervalHint}>
          {isCustom
            ? customInterval
              ? `You'll be prompted every ${customInterval}s`
              : 'Enter your interval above'
            : `You'll be prompted every ${INTERVAL_PRESETS[selectedPreset]!.label}`}
        </Text>
      </Card>

      {/* Contacts */}
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
        label="Start Walk Alone"
        size="lg"
        fullWidth
        loading={isSettingUp}
        disabled={selectedContacts.length === 0 || getIntervalSeconds() < 30}
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
  presetRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
  intervalHint: { fontSize: typography.fontSize.xs, color: colors.gray400, marginTop: spacing.sm },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  contactName: { fontSize: typography.fontSize.md, color: colors.gray900 },
  noContacts: { color: colors.gray400, fontSize: typography.fontSize.sm },
  error: { color: colors.danger, fontSize: typography.fontSize.sm },
});
