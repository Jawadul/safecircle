/**
 * sos/index.tsx — Full-screen SOS overlay (outside tab chrome).
 * Activated by holding the SOS button on the home screen.
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SOSButton, colors, spacing, typography } from '@safecircle/ui';
import { useSession } from '../../src/hooks/useSession';

export default function SOSScreen() {
  const router = useRouter();
  const { triggerSOS, activeSession, endSession } = useSession();

  const handleActivate = async () => {
    await triggerSOS({});
    // Stay on screen — show escalation ladder status
  };

  const handleCancel = async () => {
    if (activeSession?.type === 'SOS') {
      await endSession();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Dismiss / Cancel */}
      <Pressable style={styles.cancel} onPress={handleCancel} accessibilityRole="button">
        <Ionicons name="close" size={28} color={colors.white} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>
          {activeSession?.type === 'SOS'
            ? 'SOS active — your contacts are being notified'
            : 'Hold the button to alert all your trusted contacts'}
        </Text>

        <SOSButton onActivate={handleActivate} size={160} holdDurationMs={1500} />

        <View style={styles.escalationLadder}>
          <EscalationStep step={1} label="Push notification to all contacts" active />
          <EscalationStep step={2} label="SMS in 30 seconds" />
          <EscalationStep step={3} label="Voice call in 60 seconds" />
        </View>
      </View>

      {activeSession?.type === 'SOS' && (
        <Pressable style={styles.cancelSOS} onPress={handleCancel}>
          <Text style={styles.cancelSOSText}>Cancel SOS — I'm safe</Text>
        </Pressable>
      )}
    </View>
  );
}

function EscalationStep({ step, label, active }: { step: number; label: string; active?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepDot, active && styles.stepDotActive]}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dangerDark,
    paddingHorizontal: spacing.xl,
  },
  cancel: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  escalationLadder: { gap: spacing.sm, width: '100%' },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.white },
  stepNum: { color: colors.danger, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.sm },
  stepLabel: { color: 'rgba(255,255,255,0.7)', fontSize: typography.fontSize.sm, flex: 1 },
  stepLabelActive: { color: colors.white, fontWeight: typography.fontWeight.semibold },
  cancelSOS: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xxl,
    alignItems: 'center',
  },
  cancelSOSText: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
});
