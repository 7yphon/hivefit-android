import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Screen, Header, Card } from '../../components/Screen';
import { getWorkoutDetail } from '../../database/db';
import { colors, spacing, font } from '../../theme';
import { totalVolume, formatWorkoutDuration, estimate1RM } from '../../utils/fitness';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { workoutId } = route.params;
  const [detail, setDetail] = useState(null);

  useEffect(() => { loadDetail(); }, []);

  async function loadDetail() {
    const data = await getWorkoutDetail(workoutId);
    setDetail(data);
  }

  if (!detail) return <Screen><Header title="Loading..." onBack={() => navigation.goBack()} /></Screen>;

  const { workout, exercises } = detail;
  const allSets = exercises.flatMap(e => e.sets).filter(s => s.completed && !s.is_warmup);
  const vol = allSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
  const duration = formatWorkoutDuration(workout.started_at, workout.finished_at);
  const date = new Date(workout.started_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Screen>
      <Header title={workout.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.date}>{date}</Text>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          <SummaryBox label="Duration" value={duration || '—'} />
          <SummaryBox label="Volume" value={vol >= 1000 ? `${(vol / 1000).toFixed(1)}t` : `${vol}kg`} />
          <SummaryBox label="Sets" value={String(allSets.length)} />
        </View>

        {workout.notes ? (
          <Card style={styles.notesCard}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{workout.notes}</Text>
          </Card>
        ) : null}

        {/* Exercise breakdown */}
        {exercises.map(ex => {
          const workSets = ex.sets.filter(s => s.completed && !s.is_warmup);
          const best = workSets.reduce((b, s) => {
            const e = estimate1RM(s.weight || 0, s.reps || 1);
            return e > b.e1rm ? { weight: s.weight, reps: s.reps, e1rm: e } : b;
          }, { weight: 0, reps: 0, e1rm: 0 });

          return (
            <Card key={ex.id} style={styles.exCard}>
              <View style={styles.exHeader}>
                <Text style={styles.exName}>{ex.name}</Text>
                {best.weight > 0 && (
                  <Text style={styles.exBest}>{best.weight}kg × {best.reps}</Text>
                )}
              </View>
              {ex.sets.map(s => (
                <View key={s.id} style={[styles.setRow, !s.completed && styles.setSkipped]}>
                  <Text style={styles.setNum}>{s.is_warmup ? 'W' : s.set_number}</Text>
                  <Text style={styles.setVal}>{s.weight || '—'} kg</Text>
                  <Text style={styles.setVal}>{s.reps || '—'} reps</Text>
                  {s.rpe ? <Text style={styles.setRpe}>RPE {s.rpe}</Text> : null}
                  {!s.completed && <Text style={styles.setSkipLabel}>skipped</Text>}
                </View>
              ))}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

function SummaryBox({ label, value }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  date: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.m },
  summaryRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.m },
  summaryBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, alignItems: 'center',
  },
  summaryValue: { color: colors.text, fontSize: font.size.l, fontWeight: font.weight.bold },
  summaryLabel: { color: colors.textSub, fontSize: font.size.xs, marginTop: 2 },
  notesCard: { marginBottom: spacing.m },
  notesLabel: { color: colors.textSub, fontSize: font.size.xs, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  notesText: { color: colors.text, fontSize: font.size.m },
  exCard: { marginBottom: spacing.s },
  exHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s },
  exName: { flex: 1, color: colors.text, fontSize: font.size.m, fontWeight: font.weight.semibold },
  exBest: { color: colors.primary, fontSize: font.size.s, fontWeight: font.weight.semibold },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: spacing.m },
  setSkipped: { opacity: 0.4 },
  setNum: { color: colors.textSub, fontSize: font.size.s, width: 20, textAlign: 'center' },
  setVal: { color: colors.text, fontSize: font.size.m },
  setRpe: { color: colors.textSub, fontSize: font.size.s, marginLeft: 'auto' },
  setSkipLabel: { color: colors.textMuted, fontSize: font.size.xs, fontStyle: 'italic', marginLeft: 'auto' },
});
