import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';

import { Card, colors, spacing, typography } from '@safecircle/ui';
import type { AlertEvent } from '@safecircle/shared-types';
import { alertsApi } from '../../../src/services/api.client';
import { useSessionStore } from '../../../src/stores/session.store';

export default function AlertsScreen() {
  const { activeSession } = useSessionStore();
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!activeSession) {
      setAlerts([]);
      return;
    }
    try {
      const data = await alertsApi.getBySession(activeSession.id);
      setAlerts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setError(null);
    } catch {
      setError('Could not load alerts.');
    }
  }, [activeSession]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alert History</Text>

      {!activeSession && (
        <Text style={styles.noSession}>Start a session to see alert events here.</Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AlertItem alert={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          activeSession ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No alerts</Text>
              <Text style={styles.emptyText}>Alert events will appear here when a session escalates.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function AlertItem({ alert }: { alert: AlertEvent }) {
  const severityColor = {
    CRITICAL: colors.danger,
    WARNING: colors.warning,
    INFO: colors.gray500,
  }[alert.severity];

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
        <View style={styles.info}>
          <Text style={styles.type}>{alert.type.replace(/_/g, ' ')}</Text>
          <Text style={styles.message}>{alert.message}</Text>
          <Text style={styles.time}>{new Date(alert.createdAt).toLocaleString()}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  title: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.gray900, marginBottom: spacing.md },
  noSession: { fontSize: typography.fontSize.sm, color: colors.gray400, marginBottom: spacing.md },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  info: { flex: 1, gap: 2 },
  type: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.gray900 },
  message: { fontSize: typography.fontSize.sm, color: colors.gray600 },
  time: { fontSize: typography.fontSize.xs, color: colors.gray400 },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, color: colors.gray600 },
  emptyText: { fontSize: typography.fontSize.sm, color: colors.gray400, textAlign: 'center' },
  error: { color: colors.danger, fontSize: typography.fontSize.sm, marginBottom: spacing.sm },
});
