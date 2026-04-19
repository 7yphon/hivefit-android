import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Screen, Header, Card } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { getExerciseHistory, getExercisePRs } from '../../database/db';
import { colors, spacing, font } from '../../theme';

export default function ExerciseProgressScreen({ route, navigation }) {
  const { exerciseId, exerciseName } = route.params;
  const { activeUser } = useUserStore();
  const [history, setHistory] = useState([]);
  const [prs, setPRs] = useState([]);

  useEffect(() => {
    if (!activeUser) return;
    loadData();
  }, [activeUser]);

  async function loadData() {
    const [hist, prData] = await Promise.all([
      getExerciseHistory(activeUser.id, exerciseId),
      getExercisePRs(activeUser.id, exerciseId),
    ]);
    setHistory(hist);
    setPRs(prData);
  }

  function openYouTube() {
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' form tutorial')}`);
  }

  const best1rm = prs.reduce((b, p) => Math.max(b, p.estimated_1rm || 0), 0);

  return (
    <Screen>
      <Header title={exerciseName} onBack={() => navigation.goBack()} right={
        <TouchableOpacity onPress={openYouTube}>
          <Text style={{ color: colors.primary, fontSize: font.size.s }}>▶ YT</Text>
        </TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* PR summary */}
        {prs.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <View style={styles.prGrid}>
              {prs.map(p => (
                <View key={p.id} style={styles.prBox}>
                  <Text style={styles.prRep}>{p.rep_count} rep{p.rep_count !== 1 ? 's' : ''}</Text>
                  <Text style={styles.prWeight}>{p.weight}kg</Text>
                </View>
              ))}
            </View>
            {best1rm > 0 && <Text style={styles.est1rm}>Est. 1RM: ~{Math.round(best1rm)}kg</Text>}
          </Card>
        )}

        {/* History table */}
        <Card>
          <Text style={styles.sectionTitle}>Session History</Text>
          {history.length === 0 && <Text style={styles.empty}>No history yet.</Text>}
          {history.map((h, i) => (
            <View key={i} style={styles.histRow}>
              <Text style={styles.histDate}>{new Date(h.started_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</Text>
              <Text style={styles.histBest}>{h.best_weight}kg best</Text>
              <Text style={styles.hist1rm}>~{Math.round(h.est_1rm)}kg</Text>
              <Text style={styles.histVol}>{h.volume >= 1000 ? `${(h.volume / 1000).toFixed(1)}t` : `${h.volume}kg`}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 40 },
  sectionTitle: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.m },
  prGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.s },
  prBox: {
    backgroundColor: colors.surface, borderRadius: 8, padding: spacing.s,
    alignItems: 'center', minWidth: 64,
  },
  prRep: { color: colors.textSub, fontSize: font.size.xs },
  prWeight: { color: colors.primary, fontSize: font.size.m, fontWeight: font.weight.bold },
  est1rm: { color: colors.textSub, fontSize: font.size.s, textAlign: 'right' },
  histRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  histDate: { flex: 1, color: colors.textSub, fontSize: font.size.s },
  histBest: { flex: 1, color: colors.text, fontSize: font.size.s },
  hist1rm: { flex: 1, color: colors.primary, fontSize: font.size.s },
  histVol: { color: colors.textSub, fontSize: font.size.s },
  empty: { color: colors.textSub, textAlign: 'center', padding: spacing.m },
});
