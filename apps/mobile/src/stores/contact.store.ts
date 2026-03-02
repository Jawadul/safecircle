/**
 * contact.store.ts — Zustand store for trusted contacts.
 */
import { create } from 'zustand';

import type { TrustedContact } from '@safecircle/shared-types';

interface ContactState {
  contacts: TrustedContact[];
  isLoading: boolean;
  error: string | null;

  setContacts: (contacts: TrustedContact[]) => void;
  addContact: (contact: TrustedContact) => void;
  updateContact: (id: string, updates: Partial<TrustedContact>) => void;
  removeContact: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContactStore = create<ContactState>()((set) => ({
  contacts: [],
  isLoading: false,
  error: null,

  setContacts: (contacts) => set({ contacts, isLoading: false }),

  addContact: (contact) =>
    set((state) => ({ contacts: [...state.contacts, contact] })),

  updateContact: (id, updates) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectVerifiedContacts = (s: ContactState) =>
  s.contacts.filter((c) => c.isVerified && c.status === 'ACTIVE');

export const selectContactById = (id: string) => (s: ContactState) =>
  s.contacts.find((c) => c.id === id);
