import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';

import { Card, Button, colors, spacing, typography } from '@safecircle/ui';
import type { TrustedContact } from '@safecircle/shared-types';
import { contactsApi } from '../../../src/services/api.client';
import { useContactStore } from '../../../src/stores/contact.store';

export default function ContactsScreen() {
  const { contacts, setContacts, isLoading, setLoading } = useContactStore();

  useEffect(() => {
    setLoading(true);
    contactsApi.list().then(setContacts).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trusted Contacts</Text>
      <Text style={styles.subtitle}>They'll be alerted in an emergency.</Text>

      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ContactItem contact={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts yet. Add someone you trust.</Text>
        }
        contentContainerStyle={styles.list}
      />

      <Button label="+ Add Contact" fullWidth onPress={() => {/* TODO: navigate to add screen */}} />
    </View>
  );
}

function ContactItem({ contact }: { contact: TrustedContact }) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.phone}>{contact.phone}</Text>
          <Text style={styles.status}>
            {contact.isVerified ? '✓ Verified' : '⏳ Pending invite'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray50, padding: spacing.lg },
  title: { fontSize: typography.fontSize.xxl, fontWeight: typography.fontWeight.bold, color: colors.gray900 },
  subtitle: { fontSize: typography.fontSize.sm, color: colors.gray500, marginBottom: spacing.md },
  list: { gap: spacing.sm, paddingBottom: spacing.lg },
  empty: { textAlign: 'center', color: colors.gray400, marginTop: spacing.xxl },
  card: { marginBottom: 0 },
  cardRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: typography.fontWeight.bold, fontSize: typography.fontSize.lg },
  info: { flex: 1, gap: 2 },
  name: { fontSize: typography.fontSize.md, fontWeight: typography.fontWeight.semibold, color: colors.gray900 },
  phone: { fontSize: typography.fontSize.sm, color: colors.gray500 },
  status: { fontSize: typography.fontSize.xs, color: colors.success },
});
