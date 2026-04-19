import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Header, Card, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { getWorkouts } from '../../database/db';
import { colors, spacing, font } from '../../theme';
import { MARTIAL_DISCIPLINES } from '../../utils/fitness';

export default function WorkoutListScreen({ navigation }) {
  const { activeUser } = useUserStore();
  const { isActive, startWorkout } = useWorkoutStore();
  const [workouts, setWorkouts] = useState([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [sessionType, setSessionType] = useState('strength');

  useFocusEffect(useCallback(() => {
    if (activeUser) loadWorkouts();
  }, [activeUser]));

  async function loadWorkouts() {
    const data = await getWorkouts(activeUser.id, 50);
    setWorkouts(data);
  }

  async function handleStart() {
    if (!workoutName.trim()) return;
    await startWorkout(activeUser.id, workoutName.trim(), sessionType);
    setShowStartModal(false);
    setWorkoutName('');
    navigation.navigate('ActiveWorkout');
  }

  function groupByMonth(list) {
    const groups = {};
    for (const w of list) {
      const key = new Date(w.started_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(w);
    }
    return groups;
  }

  const grouped = groupByMonth(workouts.filter(w => w.finished_at));

  return (
    <Screen>
      <Header title="Workouts" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isActive && (
          <TouchableOpacity onPress={() => navigation.navigate('ActiveWorkout')} style={styles.activeBanner}>
            <Text style={styles.activeBannerText}>🏋️  Resume active workout</Text>
          </TouchableOpacity>
        )}

        <Button label="+ New Workout" onPress={() => setShowStartModal(true)} style={styles.newBtn} />

        {Object.entries(grouped).map(([month, items]) => (
          <View key={month}>
            <Text style={styles.monthLabel}>{month}</Text>
            {items.map(w => (
              <TouchableOpacity key={w.id} onPress={() => navigation.navigate('WorkoutDetail', { workoutId: w.id })} style={styles.workoutCard}>
                <View style={[styles.sessionDot, { backgroundColor: w.session_type === 'martial_arts' ? colors.martial : colors.primary }]} />
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{w.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {new Date(w.started_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {workouts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No workouts yet.</Text>
            <Text style={styles.emptySubText}>Tap + New Workout to get started.</Text>
          </View>
        )}
      </ScrollView>

      {/* Start modal */}
      <Modal visible={showStartModal} transparent animationType="slide" onRequestClose={() => setShowStartModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Workout</Text>

            <TextInput
              style={styles.input}
              placeholder="Workout name (e.g. Push Day)"
              placeholderTextColor={colors.textMuted}
              value={workoutName}
              onChangeText={setWorkoutName}
              autoFocus
            />

            <Text style={styles.typeLabel}>Session type</Text>
            <View style={styles.typeRow}>
              {[['strength', '🏋️ Strength'], ['martial_arts', '🥊 Martial Arts']].map(([type, label]) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSessionType(type)}
                  style={[styles.typeBtn, sessionType === type && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeBtnText, sessionType === type && styles.typeBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowStartModal(false)} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
              <Button label="Start" onPress={handleStart} disabled={!workoutName.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.m, paddingBottom: 32 },
  activeBanner: {
    backgroundColor: colors.primary + '22', borderColor: colors.primary,
    borderWidth: 1, borderRadius: 10, padding: spacing.m, marginBottom: spacing.m,
  },
  activeBannerText: { color: colors.primary, fontSize: font.size.m, fontWeight: font.weight.medium },
  newBtn: { marginBottom: spacing.l },
  monthLabel: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.s, marginTop: spacing.s },
  workoutCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, marginBottom: spacing.s,
  },
  sessionDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.m },
  workoutInfo: { flex: 1 },
  workoutName: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.medium },
  workoutMeta: { color: colors.textSub, fontSize: font.size.s, marginTop: 2 },
  arrow: { color: colors.textSub, fontSize: 22 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: colors.text, fontSize: font.size.l },
  emptySubText: { color: colors.textSub, fontSize: font.size.m, marginTop: spacing.s },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.l, paddingBottom: 32 },
  modalTitle: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold, marginBottom: spacing.l },
  input: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border,
  },
  typeLabel: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.s },
  typeRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.l },
  typeBtn: {
    flex: 1, padding: spacing.m, borderRadius: 10,
    backgroundColor: colors.card, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  typeBtnText: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.medium },
  typeBtnTextActive: { color: colors.primary },
  modalActions: { flexDirection: 'row', gap: spacing.s },
});
