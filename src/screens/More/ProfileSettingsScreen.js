import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Screen, Header, Card, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { upsertUser } from '../../database/db';
import { colors, spacing, font } from '../../theme';

const AVATAR_COLORS = ['#c8f03c', '#f03c3c', '#3c8ff0', '#f0c43c', '#c43cf0', '#3cf0b8', '#f0803c'];

export default function ProfileSettingsScreen({ navigation }) {
  const { users, activeUser, loadUsers } = useUserStore();
  const [editUser, setEditUser] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#c8f03c');
  const [openhiveUrl, setOpenhiveUrl] = useState('');
  const [openhiveUser, setOpenhiveUser] = useState('');

  function openEdit(user) {
    setEditUser(user);
    setName(user.name);
    setColor(user.avatar_color || '#c8f03c');
    setOpenhiveUrl(user.openhive_url || '');
    setOpenhiveUser(user.openhive_username || '');
  }

  async function handleSave() {
    if (!name.trim()) return;
    await upsertUser({ ...editUser, name: name.trim(), avatar_color: color, openhive_url: openhiveUrl, openhive_username: openhiveUser });
    await loadUsers();
    setEditUser(null);
  }

  async function handleAddUser() {
    await upsertUser({ name: 'New User', avatar_color: AVATAR_COLORS[users.length % AVATAR_COLORS.length] });
    await loadUsers();
  }

  return (
    <Screen>
      <Header title="Profiles" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {editUser ? (
          <Card>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.textMuted} />
            <Text style={styles.fieldLabel}>Avatar colour</Text>
            <View style={styles.colorRow}>
              {AVATAR_COLORS.map(c => (
                <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} />
              ))}
            </View>
            <Text style={styles.fieldLabel}>OpenHive URL (optional)</Text>
            <TextInput style={styles.input} value={openhiveUrl} onChangeText={setOpenhiveUrl} placeholder="https://..." placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <Text style={styles.fieldLabel}>OpenHive username</Text>
            <TextInput style={styles.input} value={openhiveUser} onChangeText={setOpenhiveUser} placeholder="username" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <View style={styles.actions}>
              <Button label="Cancel" onPress={() => setEditUser(null)} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
              <Button label="Save" onPress={handleSave} style={{ flex: 1 }} />
            </View>
          </Card>
        ) : (
          <>
            {users.map(u => (
              <TouchableOpacity key={u.id} onPress={() => openEdit(u)} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: u.avatar_color || colors.primary }]}>
                  <Text style={styles.avatarText}>{u.name[0]}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  {u.openhive_username ? <Text style={styles.userSub}>OpenHive: {u.openhive_username}</Text> : null}
                </View>
                {u.is_active ? <Text style={styles.activeBadge}>active</Text> : null}
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
            <Button label="+ Add Profile" onPress={handleAddUser} variant="secondary" style={styles.addBtn} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  sectionTitle: { color: colors.text, fontSize: font.size.l, fontWeight: font.weight.semibold, marginBottom: spacing.m },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border,
  },
  fieldLabel: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.s },
  colorRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.text },
  actions: { flexDirection: 'row', gap: spacing.s },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m, marginBottom: spacing.s,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.m },
  avatarText: { color: colors.bg, fontSize: font.size.l, fontWeight: font.weight.bold },
  userInfo: { flex: 1 },
  userName: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.medium },
  userSub: { color: colors.textSub, fontSize: font.size.s },
  activeBadge: { color: colors.primary, fontSize: font.size.xs, marginRight: spacing.s },
  arrow: { color: colors.textSub, fontSize: 22 },
  addBtn: { marginTop: spacing.s },
});
