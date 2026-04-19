import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Screen, Header, Card } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { getPRs, getExercises } from '../../database/db';
import { colors, spacing, font } from '../../theme';

export default function ProgressScreen({ navigation }) {
  const { activeUser } = useUserStore();
  const [prs, setPRs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [tab, setTab] = useState('prs');

  useEffect(() => {
    if (!activeUser) return;
    loadData();
  }, [activeUser]);

  async function loadData() {
    const [prData, exData] = await Promise.all([
      getPRs(activeUser.id),
      getExercises(activeUser.id),
    ]);
    setPRs(prData);
    setExercises(exData);
  }

  return (
    <Screen>
      <Header title="Progress" />
      <View style={styles.tabs}>
        {[['prs', 'PR Board'], ['exercises', 'Exercises']].map(([key, label]) => (
          <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'prs' ? (
        <FlatList
          data={prs}
          keyExtractor={p => String(p.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseProgress', { exerciseId: item.exercise_id, exerciseName: item.exercise_name })} style={styles.prRow}>
              <View style={styles.prLeft}>
                <Text style={styles.prName}>{item.exercise_name}</Text>
                <Text style={styles.prCat}>{item.category}</Text>
              </View>
              <View style={styles.prRight}>
                <Text style={styles.prWeight}>{item.weight}kg × {item.rep_count}</Text>
                <Text style={styles.pr1rm}>~{Math.round(item.estimated_1rm)}kg 1RM</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No PRs yet. Log some sets!</Text>}
        />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={e => String(e.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('ExerciseProgress', { exerciseId: item.id, exerciseName: item.name })} style={styles.exRow}>
              <View>
                <Text style={styles.exName}>{item.name}</Text>
                <Text style={styles.exMeta}>{item.category} · {item.equipment}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.m, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textSub, fontSize: font.size.m },
  tabTextActive: { color: colors.primary, fontWeight: font.weight.semibold },
  list: { padding: spacing.m, paddingBottom: 32 },
  prRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m, marginBottom: spacing.s,
  },
  prLeft: { flex: 1 },
  prName: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.medium },
  prCat: { color: colors.textSub, fontSize: font.size.s },
  prRight: { alignItems: 'flex-end', marginRight: spacing.s },
  prWeight: { color: colors.text, fontSize: font.size.m },
  pr1rm: { color: colors.primary, fontSize: font.size.s, fontWeight: font.weight.semibold },
  arrow: { color: colors.textSub, fontSize: 22 },
  exRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m, marginBottom: spacing.s,
  },
  exName: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.medium },
  exMeta: { color: colors.textSub, fontSize: font.size.s },
  empty: { color: colors.textSub, textAlign: 'center', padding: 32 },
});
