import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Header, Card, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { upsertUser, setActiveUser } from '../../database/db';
import { loginToOpenHive, saveUserToken, loadUserToken, clearUserToken } from '../../services/auth';
import { colors, spacing, font } from '../../theme';

const AVATAR_COLORS = ['#f59e0b', '#ef4444', '#3c8ff0', '#f97316', '#a855f7', '#10b981', '#e879f9'];

export default function ProfileSettingsScreen({ navigation }) {
  const { users, activeUser, loadUsers } = useUserStore();
  const [editUser, setEditUser] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  const [hiveUrl, setHiveUrl] = useState('');
  const [hiveUsername, setHiveUsername] = useState('');
  const [hivePassword, setHivePassword] = useState('');
  const [showConnect, setShowConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  function openEdit(user) {
    setEditUser(user);
    setName(user.name);
    setColor(user.avatar_color || AVATAR_COLORS[0]);
    setHiveUrl(user.openhive_url || '');
    setHiveUsername(user.openhive_username || '');
    setHivePassword('');
    setShowConnect(false);
    setIsConnected(false);
    loadUserToken(user.id).then(token => setIsConnected(!!token));
  }

  async function handleSave() {
    if (!name.trim()) return;
    await upsertUser({ ...editUser, name: name.trim(), avatar_color: color });
    await loadUsers();
    setEditUser(null);
  }

  async function handleSetActive(user) {
    await setActiveUser(user.id);
    await loadUsers();
  }

  async function handleConnect() {
    if (!hiveUsername.trim() || !hivePassword.trim() || !hiveUrl.trim()) return;
    setConnectError('');
    setConnecting(true);
    const url = hiveUrl.trim();
    try {
      const token = await loginToOpenHive(url, hiveUsername.trim(), hivePassword);
      await saveUserToken(editUser.id, token);
      await upsertUser({
        ...editUser,
        openhive_url: url,
        openhive_username: hiveUsername.trim(),
      });
      await loadUsers();
      setEditUser(prev => ({ ...prev, openhive_url: url, openhive_username: hiveUsername.trim() }));
      setIsConnected(true);
      setHivePassword('');
      setShowConnect(false);
      Alert.alert('Connected', `Linked to OpenHive as ${hiveUsername.trim()}`);
    } catch (e) {
      setConnectError(e.message || 'Could not connect to OpenHive');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    Alert.alert('Disconnect OpenHive', 'Remove OpenHive link from this profile?', [
      { text: 'Cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await clearUserToken(editUser.id);
          await upsertUser({ ...editUser, openhive_url: null, openhive_username: null });
          await loadUsers();
          setEditUser(prev => ({ ...prev, openhive_url: null, openhive_username: null }));
          setIsConnected(false);
          setHiveUrl('');
          setHiveUsername('');
        },
      },
    ]);
  }

  async function handleAddUser() {
    await upsertUser({ name: 'New User', avatar_color: AVATAR_COLORS[users.length % AVATAR_COLORS.length] });
    await loadUsers();
  }

  return (
    <Screen>
      <Header title="Profiles" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {editUser ? (
          <>
            <Card>
              <Text style={styles.sectionTitle}>Edit Profile</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Avatar colour</Text>
              <View style={styles.colorRow}>
                {AVATAR_COLORS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                  />
                ))}
              </View>
              <View style={styles.actions}>
                <Button label="Cancel" onPress={() => setEditUser(null)} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
                <Button label="Save" onPress={handleSave} style={{ flex: 1 }} />
              </View>
            </Card>

            {/* OpenHive section */}
            <Card style={{ marginTop: spacing.m }}>
              <View style={styles.hiveHeader}>
                <Text style={styles.sectionTitle}>OpenHive</Text>
                {isConnected
                  ? <View style={styles.connectedBadge}><Text style={styles.connectedText}>Connected</Text></View>
                  : <View style={styles.disconnectedBadge}><Text style={styles.disconnectedText}>Not linked</Text></View>
                }
              </View>

              {isConnected ? (
                <>
                  <Text style={styles.fieldLabel}>Signed in as</Text>
                  <Text style={styles.hiveValue}>{editUser.openhive_username}</Text>
                  <Text style={styles.fieldLabel}>Server</Text>
                  <Text style={styles.hiveValue}>{editUser.openhive_url}</Text>
                  <Button label="Disconnect OpenHive" onPress={handleDisconnect} variant="danger" style={{ marginTop: spacing.m }} />
                </>
              ) : (
                <>
                  {!showConnect ? (
                    <Button label="Connect to OpenHive" onPress={() => { setShowConnect(true); setConnectError(''); }} variant="secondary" />
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>Server URL *</Text>
                      <TextInput
                        style={styles.input}
                        value={hiveUrl}
                        onChangeText={t => { setHiveUrl(t); setConnectError(''); }}
                        placeholder="https://hive.example.com"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        keyboardType="url"
                        autoCorrect={false}
                      />
                      <Text style={styles.fieldLabel}>Username *</Text>
                      <TextInput
                        style={styles.input}
                        value={hiveUsername}
                        onChangeText={t => { setHiveUsername(t); setConnectError(''); }}
                        placeholder="your OpenHive username"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.fieldLabel}>Password *</Text>
                      <View style={styles.passwordRow}>
                        <TextInput
                          style={[styles.input, { flex: 1, marginBottom: 0 }]}
                          value={hivePassword}
                          onChangeText={t => { setHivePassword(t); setConnectError(''); }}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                          <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                        </TouchableOpacity>
                      </View>
                      {connectError ? <Text style={styles.errorText}>{connectError}</Text> : null}
                      <View style={[styles.actions, { marginTop: spacing.m }]}>
                        <Button label="Cancel" onPress={() => { setShowConnect(false); setConnectError(''); }} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
                        <TouchableOpacity
                          style={[styles.connectBtn, (connecting || !hiveUsername.trim() || !hivePassword.trim() || !hiveUrl.trim()) && styles.connectBtnDisabled]}
                          onPress={handleConnect}
                          disabled={connecting || !hiveUsername.trim() || !hivePassword.trim() || !hiveUrl.trim()}
                        >
                          {connecting
                            ? <ActivityIndicator color={colors.bg} size="small" />
                            : <Text style={styles.connectBtnText}>Connect</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </>
              )}
            </Card>
          </>
        ) : (
          <>
            {users.map(u => (
              <TouchableOpacity key={u.id} style={styles.userRow} onPress={() => openEdit(u)}>
                <TouchableOpacity onPress={() => handleSetActive(u)} style={[styles.avatar, { backgroundColor: u.avatar_color || colors.primary }]}>
                  <Text style={styles.avatarText}>{u.name[0]}</Text>
                </TouchableOpacity>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  {u.openhive_username
                    ? <Text style={styles.userSub}>OpenHive: {u.openhive_username}</Text>
                    : <Text style={[styles.userSub, { color: colors.textMuted }]}>No OpenHive link</Text>
                  }
                </View>
                {u.is_active ? <Text style={styles.activeBadge}>active</Text> : null}
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.hint}>Tap avatar to set active · Tap row to edit</Text>
            <Button label="+ Add Profile" onPress={handleAddUser} variant="secondary" style={styles.addBtn} />
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  fieldLabel: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.s, textTransform: 'uppercase', letterSpacing: 0.6 },
  colorRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.text },
  actions: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
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
  hint: { color: colors.textMuted, fontSize: font.size.xs, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.m },
  addBtn: { marginTop: spacing.s },
  hiveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.m },
  connectedBadge: { backgroundColor: colors.success + '22', borderRadius: 6, paddingHorizontal: spacing.s, paddingVertical: 2 },
  connectedText: { color: colors.success, fontSize: font.size.xs, fontWeight: font.weight.medium },
  disconnectedBadge: { backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: spacing.s, paddingVertical: 2 },
  disconnectedText: { color: colors.textMuted, fontSize: font.size.xs },
  hiveValue: { color: colors.text, fontSize: font.size.m, marginBottom: spacing.m },
  connectBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: 10,
    padding: spacing.m, alignItems: 'center',
  },
  connectBtnDisabled: { opacity: 0.5 },
  connectBtnText: { color: colors.bg, fontSize: font.size.m, fontWeight: font.weight.bold },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m },
  eyeBtn: { paddingHorizontal: spacing.s, paddingVertical: spacing.m },
  eyeText: { fontSize: 18 },
  errorText: { color: colors.danger, fontSize: font.size.s, marginBottom: spacing.m },
});
