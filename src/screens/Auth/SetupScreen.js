import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { upsertUser } from '../../database/db';
import { useUserStore } from '../../store/userStore';
import { colors, spacing, font } from '../../theme';

const AVATAR_COLORS = ['#f59e0b', '#ef4444', '#3c8ff0', '#f97316', '#a855f7', '#10b981', '#e879f9'];

export default function SetupScreen() {
  const { loadUsers } = useUserStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await upsertUser({ name: trimmed, avatar_color: color });
      await loadUsers();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.logo}>
          <Text style={styles.logoH}>H</Text>
        </View>
        <Text style={styles.title}>Welcome to HiveFit</Text>
        <Text style={styles.sub}>Create your profile to get started</Text>

        <Text style={styles.label}>Your name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleStart}
        />

        <Text style={styles.label}>Avatar colour</Text>
        <View style={styles.colorRow}>
          {AVATAR_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => setColor(c)}
              style={[styles.dot, { backgroundColor: c }, color === c && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, (!name.trim() || saving) && styles.btnDisabled]}
          onPress={handleStart}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.btnText}>Get Started</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, paddingBottom: 60 },
  logo: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: spacing.l,
  },
  logoH: { color: colors.primary, fontSize: 44, fontWeight: 'bold' },
  title: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold, textAlign: 'center', marginBottom: spacing.s },
  sub: { color: colors.textSub, fontSize: font.size.m, textAlign: 'center', marginBottom: spacing.xl },
  label: { color: colors.textSub, fontSize: font.size.s, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.s },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.m, marginBottom: spacing.l,
    borderWidth: 1, borderColor: colors.border,
  },
  colorRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.xl },
  dot: { width: 36, height: 36, borderRadius: 18 },
  dotActive: { borderWidth: 3, borderColor: colors.text },
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.m, alignItems: 'center', marginTop: spacing.s,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.bg, fontSize: font.size.m, fontWeight: font.weight.bold },
});
