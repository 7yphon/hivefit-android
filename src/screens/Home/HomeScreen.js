import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, RefreshControl, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Card, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { getWorkouts, getPRs, getBodyMetrics } from '../../database/db';
import { initHealthConnect, checkHealthPermissions, requestHealthPermissions, getDashboardData } from '../../services/healthConnect';
import { colors, spacing, font } from '../../theme';

export default function HomeScreen({ navigation }) {
  const { activeUser, users, loadUsers, switchUser } = useUserStore();
  const { isActive } = useWorkoutStore();
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [topPRs, setTopPRs] = useState([]);
  const [latestBody, setLatestBody] = useState(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [hcData, setHcData] = useState(null);
  const [hcAvailable, setHcAvailable] = useState(false);
  const [hcNeedsPermission, setHcNeedsPermission] = useState(false);
  const [hcRequesting, setHcRequesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const hcWaiting = useRef(false);

  useEffect(() => { loadUsers(); initHC(); }, []);

  // Refresh HC data whenever app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        let freshPermsGranted = false;
        if (hcWaiting.current) {
          hcWaiting.current = false;
          const hasPerms = await checkHealthPermissions();
          if (hasPerms) {
            setHcAvailable(true);
            setHcNeedsPermission(false);
            freshPermsGranted = true;
            const data = await getDashboardData();
            setHcData(data);
          }
        }
        if (!freshPermsGranted && hcAvailableRef.current) {
          const data = await getDashboardData();
          setHcData(data);
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  // Keep a ref so the AppState closure can read current hcAvailable
  const hcAvailableRef = useRef(false);
  useEffect(() => { hcAvailableRef.current = hcAvailable; }, [hcAvailable]);

  // Reload local data whenever the Home tab is focused
  useFocusEffect(useCallback(() => {
    if (activeUser) loadData();
  }, [activeUser]));

  useEffect(() => {
    if (!activeUser) return;
    loadData();
  }, [activeUser]);

  async function initHC() {
    const result = await initHealthConnect();
    if (!result.available) return;
    const hasPerms = await checkHealthPermissions();
    if (hasPerms) {
      setHcAvailable(true);
      const data = await getDashboardData();
      setHcData(data);
    } else {
      setHcNeedsPermission(true);
    }
  }

  async function handleGrantHC() {
    setHcRequesting(true);
    hcWaiting.current = true;
    try {
      const granted = await requestHealthPermissions();
      if (granted && granted.length > 0) {
        hcWaiting.current = false;
        setHcAvailable(true);
        setHcNeedsPermission(false);
        const data = await getDashboardData();
        setHcData(data);
      }
      // else: settings was opened as fallback — hcWaiting stays true
      // AppState listener handles permissions check on resume
    } catch (e) {
      hcWaiting.current = false;
      Alert.alert('Health Connect', e.message || 'Could not request permissions');
    } finally {
      setHcRequesting(false);
    }
  }

  async function loadData() {
    const workouts = await getWorkouts(activeUser.id, 7);
    setRecentWorkouts(workouts);
    const prs = await getPRs(activeUser.id);
    setTopPRs(prs.slice(0, 3));
    const body = await getBodyMetrics(activeUser.id, 1);
    setLatestBody(body[0] || null);
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      if (activeUser) await loadData();
      if (hcAvailableRef.current) {
        const data = await getDashboardData();
        setHcData(data);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const thisWeek = recentWorkouts.filter(w => {
    const diff = (Date.now() - new Date(w.started_at)) / 86400000;
    return diff <= 7 && w.finished_at;
  }).length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{activeUser?.name || '—'}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowUserPicker(!showUserPicker)} style={[styles.avatar, { backgroundColor: activeUser?.avatar_color || colors.primary }]}>
            <Text style={styles.avatarText}>{activeUser?.name?.[0] || '?'}</Text>
          </TouchableOpacity>
        </View>

        {/* User picker */}
        {showUserPicker && users.length > 1 && (
          <Card style={styles.pickerCard}>
            {users.map(u => (
              <TouchableOpacity key={u.id} onPress={() => { switchUser(u.id); setShowUserPicker(false); }} style={styles.pickerRow}>
                <View style={[styles.avatarSm, { backgroundColor: u.avatar_color || colors.primary }]}>
                  <Text style={styles.avatarSmText}>{u.name[0]}</Text>
                </View>
                <Text style={[styles.pickerName, u.is_active && { color: colors.primary }]}>{u.name}</Text>
                {u.is_active && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Active workout banner */}
        {isActive && (
          <TouchableOpacity onPress={() => navigation.navigate('Workout', { screen: 'ActiveWorkout' })} style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>🏋️  Workout in progress — tap to return</Text>
          </TouchableOpacity>
        )}

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatBox label="This week" value={`${thisWeek}`} unit="sessions" />
          <StatBox label="Weight" value={latestBody?.weight_kg ? `${latestBody.weight_kg}` : '—'} unit="kg" />
          <StatBox label="Body fat" value={latestBody?.body_fat_pct ? `${latestBody.body_fat_pct.toFixed(1)}%` : '—'} unit="" />
        </View>

        {/* Health Connect — needs permission */}
        {hcNeedsPermission && (
          <TouchableOpacity onPress={handleGrantHC} disabled={hcRequesting} style={styles.hcConnectBtn}>
            {hcRequesting
              ? <ActivityIndicator color={colors.textSub} size="small" />
              : <Text style={styles.hcConnectText}>🏃 Connect Samsung Health</Text>
            }
          </TouchableOpacity>
        )}

        {/* Health Connect today */}
        {hcAvailable && hcData && (
          <Card style={styles.hcCard}>
            <Text style={styles.hcTitle}>Today</Text>
            <View style={styles.hcRow}>
              <HCBox icon="👟" value={hcData.steps != null ? hcData.steps.toLocaleString() : '—'} label="steps" />
              <HCBox icon="🔥" value={hcData.calories != null ? `${hcData.calories}` : '—'} label="kcal" />
              <HCBox icon="📍" value={hcData.distance != null ? `${hcData.distance}` : '—'} label="km" />
              <HCBox icon="❤️" value={hcData.heartRate != null ? `${hcData.heartRate}` : '—'} label="bpm" />
            </View>
          </Card>
        )}

        {/* Start workout */}
        <Button
          label={isActive ? '🏋️  Resume Workout' : '+ Start Workout'}
          onPress={() => navigation.navigate('Workout', isActive ? { screen: 'ActiveWorkout' } : undefined)}
          style={styles.startBtn}
        />

        {/* Top PRs */}
        {topPRs.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Top PRs</Text>
            {topPRs.map(pr => (
              <View key={pr.id} style={styles.prRow}>
                <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                <Text style={styles.prValue}>{pr.weight}kg × {pr.rep_count}</Text>
                <Text style={styles.pr1rm}>~{Math.round(pr.estimated_1rm)}kg</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Recent workouts */}
        {recentWorkouts.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Recent</Text>
            {recentWorkouts.slice(0, 5).map(w => (
              <TouchableOpacity key={w.id} onPress={() => navigation.navigate('Workout', { screen: 'WorkoutDetail', params: { workoutId: w.id } })} style={styles.workoutRow}>
                <View>
                  <Text style={styles.workoutName}>{w.name}</Text>
                  <Text style={styles.workoutDate}>{new Date(w.started_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.workoutArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function HCBox({ icon, value, label }) {
  return (
    <View style={styles.hcBox}>
      <Text style={styles.hcIcon}>{icon}</Text>
      <Text style={styles.hcValue}>{value}</Text>
      <Text style={styles.hcLabel}>{label}</Text>
    </View>
  );
}

function StatBox({ label, value, unit }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}<Text style={styles.statUnit}>{unit}</Text></Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.l },
  greeting: { color: colors.textSub, fontSize: font.size.m },
  name: { color: colors.text, fontSize: font.size.xxl, fontWeight: font.weight.bold },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.bg, fontSize: font.size.l, fontWeight: font.weight.bold },
  avatarSm: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.s },
  avatarSmText: { color: colors.bg, fontSize: font.size.m, fontWeight: font.weight.bold },
  pickerCard: { marginBottom: spacing.m },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s },
  pickerName: { flex: 1, color: colors.text, fontSize: font.size.m },
  checkMark: { color: colors.primary, fontSize: font.size.m },
  activeBanner: {
    backgroundColor: colors.primary + '22', borderColor: colors.primary,
    borderWidth: 1, borderRadius: 10, padding: spacing.m, marginBottom: spacing.m,
  },
  activeBannerText: { color: colors.primary, fontSize: font.size.m, fontWeight: font.weight.medium },
  statsRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold },
  statUnit: { fontSize: font.size.s, color: colors.textSub, fontWeight: font.weight.regular },
  statLabel: { color: colors.textSub, fontSize: font.size.xs, marginTop: 2 },
  startBtn: { marginBottom: spacing.m },
  hcConnectBtn: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    marginBottom: spacing.m, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  hcConnectText: { color: colors.textSub, fontSize: font.size.s },
  hcCard: { marginBottom: spacing.m, paddingBottom: spacing.s },
  hcTitle: { color: colors.textSub, fontSize: font.size.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.s },
  hcRow: { flexDirection: 'row', justifyContent: 'space-between' },
  hcBox: { flex: 1, alignItems: 'center' },
  hcIcon: { fontSize: 18, marginBottom: 2 },
  hcValue: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.bold },
  hcLabel: { color: colors.textMuted, fontSize: font.size.xs },
  sectionTitle: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold, marginBottom: spacing.s, textTransform: 'uppercase', letterSpacing: 0.8 },
  prRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  prExercise: { flex: 1, color: colors.text, fontSize: font.size.m },
  prValue: { color: colors.textSub, fontSize: font.size.s, marginRight: spacing.s },
  pr1rm: { color: colors.primary, fontSize: font.size.s, fontWeight: font.weight.semibold, minWidth: 52, textAlign: 'right' },
  workoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  workoutName: { color: colors.text, fontSize: font.size.m },
  workoutDate: { color: colors.textSub, fontSize: font.size.s },
  workoutArrow: { color: colors.textSub, fontSize: 22 },
});
