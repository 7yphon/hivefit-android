import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Card, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { getBodyMetrics, saveBodyMetrics } from '../../database/db';
import { initHealthConnect, checkHealthPermissions, requestHealthPermissions, getLatestWeight, getLatestBodyFat } from '../../services/healthConnect';
import { colors, spacing, font } from '../../theme';

export default function BodyScreen() {
  const { activeUser } = useUserStore();
  const [metrics, setMetrics] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [hcAvailable, setHcAvailable] = useState(false);
  const appState = useRef(AppState.currentState);
  const hcWaiting = useRef(false);

  useFocusEffect(useCallback(() => {
    if (activeUser) loadData();
  }, [activeUser]));

  useEffect(() => { initHC(); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active' && hcWaiting.current) {
        hcWaiting.current = false;
        const hasPerms = await checkHealthPermissions();
        if (hasPerms) {
          setHcAvailable(true);
          doSync();
        } else {
          setSyncMsg('Permissions not granted in Health Connect');
          setSyncing(false);
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  async function initHC() {
    const result = await initHealthConnect();
    if (result.available) setHcAvailable(true);
  }

  async function loadData() {
    const data = await getBodyMetrics(activeUser.id, 30);
    setMetrics(data);
  }

  async function doSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const [weight, bodyFat] = await Promise.all([getLatestWeight(), getLatestBodyFat()]);
      if (!weight && !bodyFat) {
        setSyncMsg('No data found in Health Connect');
        return;
      }
      await saveBodyMetrics(activeUser.id, {
        weight_kg: weight,
        body_fat_pct: bodyFat,
        source: 'health_connect',
      });
      await loadData();
      setSyncMsg(`Synced: ${weight ? `${weight}kg` : ''}${weight && bodyFat ? ' · ' : ''}${bodyFat ? `${bodyFat}% body fat` : ''}`);
    } catch (e) {
      setSyncMsg(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSync() {
    const hasPerms = await checkHealthPermissions();
    if (!hasPerms) {
      setSyncMsg('Opening Health Connect — grant permissions then come back');
      hcWaiting.current = true;
      setSyncing(true);
      await requestHealthPermissions();
      return;
    }
    doSync();
  }

  const latest = metrics[0] || null;

  return (
    <Screen>
      <Header title="Body" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Sync button */}
        {hcAvailable && (
          <TouchableOpacity onPress={handleSync} disabled={syncing} style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}>
            {syncing
              ? <ActivityIndicator color={colors.bg} size="small" />
              : <Text style={styles.syncText}>⟳  Sync from Health Connect</Text>
            }
          </TouchableOpacity>
        )}
        {syncMsg ? <Text style={styles.syncMsg}>{syncMsg}</Text> : null}

        {latest ? (
          <>
            <Text style={styles.asOf}>Last scan: {new Date(latest.recorded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <View style={styles.grid}>
              <MetricBox label="Weight" value={latest.weight_kg ? `${latest.weight_kg}kg` : '—'} />
              <MetricBox label="Body Fat" value={latest.body_fat_pct ? `${latest.body_fat_pct.toFixed(1)}%` : '—'} accent />
              <MetricBox label="Muscle Mass" value={latest.muscle_mass_kg ? `${latest.muscle_mass_kg}kg` : '—'} />
              <MetricBox label="BMR" value={latest.bmr ? `${Math.round(latest.bmr)} kcal` : '—'} />
              <MetricBox label="BMI" value={latest.bmi ? latest.bmi.toFixed(1) : '—'} />
              <MetricBox label="Visceral Fat" value={latest.visceral_fat != null ? String(latest.visceral_fat) : '—'} />
            </View>
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No body data yet</Text>
            <Text style={styles.emptyText}>
              Make sure Hume Health → Google Fit → Health Connect sync is enabled, then tap Sync above.
            </Text>
          </Card>
        )}

        {metrics.length > 1 && (
          <Card>
            <Text style={styles.sectionTitle}>History</Text>
            {metrics.slice(0, 20).map(m => (
              <View key={m.id} style={styles.histRow}>
                <Text style={styles.histDate}>{new Date(m.recorded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</Text>
                <Text style={styles.histVal}>{m.weight_kg ? `${m.weight_kg}kg` : '—'}</Text>
                <Text style={styles.histVal}>{m.body_fat_pct ? `${m.body_fat_pct.toFixed(1)}%` : '—'}</Text>
                <Text style={styles.histSource}>{m.source}</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function MetricBox({ label, value, accent }) {
  return (
    <View style={styles.metricBox}>
      <Text style={[styles.metricValue, accent && { color: colors.primary }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  syncBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: spacing.m, alignItems: 'center', marginBottom: spacing.s,
  },
  syncBtnDisabled: { opacity: 0.6 },
  syncText: { color: colors.bg, fontSize: font.size.m, fontWeight: font.weight.semibold },
  syncMsg: { color: colors.textSub, fontSize: font.size.s, textAlign: 'center', marginBottom: spacing.m },
  asOf: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.m },
  metricBox: {
    width: '48%', backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, alignItems: 'center',
  },
  metricValue: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold },
  metricLabel: { color: colors.textSub, fontSize: font.size.xs, marginTop: 2 },
  emptyCard: { alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: font.size.l, fontWeight: font.weight.semibold, marginBottom: spacing.m },
  emptyText: { color: colors.textSub, fontSize: font.size.s, textAlign: 'center' },
  sectionTitle: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.s },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  histDate: { flex: 1, color: colors.textSub, fontSize: font.size.s },
  histVal: { flex: 1, color: colors.text, fontSize: font.size.s },
  histSource: { color: colors.textMuted, fontSize: font.size.xs },
});
