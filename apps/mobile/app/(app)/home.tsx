/**
 * home.tsx — Session launcher + SOS FAB.
 * Shows active session HUD if a session is running.
 */
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card, SOSButton, colors, spacing, typography, shadows } from '@safecircle/ui';
import { useSession } from '../../src/hooks/useSession';
import { useSessionStore } from '../../src/stores/session.store';

export default function HomeScreen() {
  const router = useRouter();
  const { activeSession, sessionStatus, isTracking, endSession } = useSession();
  const { lastLocation } = useSessionStore();

  const handleSOS = () => {
    router.push('/sos');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Stay Safe</Text>
        <Text style={styles.subtitle}>Choose a safety mode to start</Text>
      </View>

      {/* Active Session HUD */}
      {activeSession && sessionStatus === 'ACTIVE' && (
        <Card style={styles.activeHud} elevated>
          <View style={styles.hudRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <Text style={styles.hudType}>{activeSession.type} Active</Text>
          </View>
          {lastLocation && (
            <Text style={styles.hudLocation}>
              {lastLocation.lat.toFixed(5)}, {lastLocation.lng.toFixed(5)}
            </Text>
          )}
          <Button label="End Session" variant="danger" size="sm" onPress={endSession} />
        </Card>
      )}

      {/* Session Launchers */}
      {!activeSession && (
        <View style={styles.grid}>
          <SessionCard
            icon="checkmark-circle-outline"
            title="Check In"
            description="Set a destination & ETA"
            onPress={() => router.push('/(app)/sessions/checkin')}
          />
          <SessionCard
            icon="car-outline"
            title="Safe Ride"
            description="Track your route"
            onPress={() => router.push('/(app)/sessions/saferide')}
          />
          <SessionCard
            icon="walk-outline"
            title="Walk Alone"
            description="Regular safety pings"
            onPress={() => router.push('/(app)/sessions/walkalone')}
          />
        </View>
      )}

      {/* SOS FAB */}
      <View style={styles.sosFab}>
        <SOSButton onActivate={handleSOS} size={80} />
      </View>
    </View>
  );
}

function SessionCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <Card elevated>
        <Ionicons name={icon} size={32} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  header: { paddingVertical: spacing.lg },
  greeting: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  },
  subtitle: { fontSize: typography.fontSize.md, color: colors.gray500, marginTop: 4 },
  grid: { gap: spacing.md },
  card: { flex: 1 },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
    marginTop: spacing.sm,
  },
  cardDesc: { fontSize: typography.fontSize.sm, color: colors.gray500, marginTop: 4 },
  activeHud: { marginBottom: spacing.md, gap: spacing.sm },
  hudRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.success },
  hudType: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.gray900 },
  hudLocation: { fontSize: typography.fontSize.xs, color: colors.gray500, fontFamily: 'monospace' },
  sosFab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
  },
});
