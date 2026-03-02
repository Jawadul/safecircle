/**
 * saferide.tsx — SafeRide session setup screen.
 * Origin auto-filled from current GPS location.
 * User enters destination as decimal lat,lng.
 */
import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { Button, Card, colors, spacing, typography } from '@safecircle/ui';
import { useSession } from '../../../src/hooks/useSession';
import { useContactStore } from '../../../src/stores/contact.store';

function parseLatLng(raw: string): { lat: number; lng: number } | null {
  const parts = raw.split(',').map((s) => s.trim());
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]!);
  const lng = parseFloat(parts[1]!);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function SafeRideSetupScreen() {
  const router = useRouter();
  const { startSafeRide, isSettingUp, setupError } = useSession();
  const { contacts } = useContactStore();

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [destinationRaw, setDestinationRaw] = useState('');
  const [deviationThreshold, setDeviationThreshold] = useState('200');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const verifiedContacts = contacts.filter((c) => c.isVerified && c.status === 'ACTIVE');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is required for SafeRide.');
        setLocationLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setOrigin({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocationError('Could not get current location. Check GPS and try again.');
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const handleStart = async () => {
    if (!origin) {
      Alert.alert('No location', 'Waiting for GPS fix. Try again in a moment.');
      return;
    }

    const destination = parseLatLng(destinationRaw);
    if (!destination) {
      Alert.alert('Invalid destination', 'Enter destination as: lat, lng  (e.g. 51.5074, -0.1278)');
      return;
    }

    if (selectedContacts.length === 0) {
      Alert.alert('No contacts selected', 'Select at least one trusted contact.');
      return;
    }

    const threshold = parseInt(deviationThreshold, 10);
    if (isNaN(threshold) || threshold < 50) {
      Alert.alert('Invalid threshold', 'Deviation threshold must be at least 50 metres.');
      return;
    }

    await startSafeRide({
      origin,
      destination,
      deviationThresholdMeters: threshold,
      shareWith: selectedContacts,
    });

    if (!setupError) {
      router.replace('/(app)/home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Safe Ride</Text>
      <Text style={styles.subtitle}>Your route is monitored. Contacts are alerted for deviations or unexplained stops.</Text>

      {/* Origin */}
      <Card>
        <Text style={styles.label}>Your current location (origin)</Text>
        {locationLoading ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.locStatus}> Acquiring GPS…</Text>
          </View>
        ) : locationError ? (
          <Text style={styles.error}>{locationError}</Text>
        ) : origin ? (
          <Text style={styles.locValue}>
            {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
          </Text>
        ) : null}
      </Card>

      {/* Destination */}
      <Card>
        <Text style={styles.label}>Destination (lat, lng)</Text>
        <TextInput
          style={styles.input}
          value={destinationRaw}
          onChangeText={setDestinationRaw}
          placeholder="e.g. 51.5074, -0.1278"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />

        <Text style={styles.label}>Deviation alert threshold (metres)</Text>
        <TextInput
          style={styles.input}
          value={deviationThreshold}
          onChangeText={setDeviationThreshold}
          keyboardType="number-pad"
          placeholder="200"
        />
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
        label="Start Safe Ride"
        size="lg"
        fullWidth
        loading={isSettingUp || locationLoading}
        disabled={!origin || !destinationRaw || selectedContacts.length === 0}
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  locStatus: { fontSize: typography.fontSize.sm, color: colors.gray500 },
  locValue: { fontSize: typography.fontSize.md, color: colors.gray900, fontFamily: 'monospace', paddingVertical: spacing.xs },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  contactName: { fontSize: typography.fontSize.md, color: colors.gray900 },
  noContacts: { color: colors.gray400, fontSize: typography.fontSize.sm },
  error: { color: colors.danger, fontSize: typography.fontSize.sm },
});
