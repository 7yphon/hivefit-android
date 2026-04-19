import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Screen, Header, Card } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { getBodyMetrics } from '../../database/db';
import { colors, spacing, font } from '../../theme';

export default function BodyScreen() {
  const { activeUser } = useUserStore();
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    if (activeUser) loadData();
  }, [activeUser]);

  async function loadData() {
    const data = await getBodyMetrics(activeUser.id, 30);
    setMetrics(data);
  }

  const latest = metrics[0] || null;

  return (
    <Screen>
      <Header title="Body" />
      <ScrollView contentContainerStyle={styles.scroll}>

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
              Sync your Hume Pod via the Hume Health app → connect to Google Fit → then Health Connect integration will pull it in automatically (Phase 2).
            </Text>
            <Text style={styles.emptyText}>
              In the meantime, manual entry is coming in Phase 2.
            </Text>
          </Card>
        )}

        {/* History */}
        {metrics.length > 1 && (
          <Card>
            <Text style={styles.sectionTitle}>History</Text>
            {metrics.slice(0, 20).map((m, i) => (
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
  emptyText: { color: colors.textSub, fontSize: font.size.s, textAlign: 'center', marginBottom: spacing.s },
  sectionTitle: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.s },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  histDate: { flex: 1, color: colors.textSub, fontSize: font.size.s },
  histVal: { flex: 1, color: colors.text, fontSize: font.size.s },
  histSource: { color: colors.textMuted, fontSize: font.size.xs },
});
