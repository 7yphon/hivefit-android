import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Modal, Vibration,
} from 'react-native';
import { Screen, Button } from '../../components/Screen';
import { useWorkoutStore } from '../../store/workoutStore';
import { useUserStore } from '../../store/userStore';
import { colors, spacing, font, radius } from '../../theme';
import { totalVolume, formatDuration } from '../../utils/fitness';

const DEFAULT_REST = 90;

export default function ActiveWorkoutScreen({ navigation }) {
  const { activeWorkout, exercises, isActive, addExercise, addSet, completeSet, deleteSet, finishWorkout, discardWorkout } = useWorkoutStore();
  const { activeUser } = useUserStore();

  const [restTimer, setRestTimer] = useState(0);       // seconds remaining
  const [restRunning, setRestRunning] = useState(false);
  const [prFlash, setPrFlash] = useState(null);        // exercise name that just got a PR
  const [editSet, setEditSet] = useState(null);        // { weIndex, setIndex, weight, reps, rpe }
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const restRef = useRef(null);

  useEffect(() => {
    if (!isActive && !activeWorkout) navigation.goBack();
  }, [isActive]);

  // Workout elapsed timer
  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Rest countdown
  useEffect(() => {
    if (!restRunning) return;
    restRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t <= 1) {
          clearInterval(restRef.current);
          setRestRunning(false);
          Vibration.vibrate([0, 300, 100, 300]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(restRef.current);
  }, [restRunning]);

  function startRest(seconds = DEFAULT_REST) {
    clearInterval(restRef.current);
    setRestTimer(seconds);
    setRestRunning(true);
  }

  function stopRest() {
    clearInterval(restRef.current);
    setRestRunning(false);
    setRestTimer(0);
  }

  async function handleCompleteSet(weIndex, setIndex) {
    const s = exercises[weIndex]?.sets[setIndex];
    if (!s) return;
    setEditSet({ weIndex, setIndex, weight: s.weight?.toString() || '', reps: s.reps?.toString() || '', rpe: s.rpe?.toString() || '' });
  }

  async function handleSaveSet() {
    const { weIndex, setIndex, weight, reps, rpe } = editSet;
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps) || 0;
    const e = parseFloat(rpe) || null;
    setEditSet(null);
    const isPR = await completeSet(weIndex, setIndex, w, r, e);
    if (isPR) {
      const name = exercises[weIndex]?.name;
      setPrFlash(name);
      setTimeout(() => setPrFlash(null), 3000);
    }
    startRest();
  }

  async function handleAddSet(weIndex) {
    const ex = exercises[weIndex];
    const lastSet = ex.sets.filter(s => !s.is_warmup).slice(-1)[0];
    await addSet(weIndex, {
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 8,
    });
  }

  async function handleFinish() {
    const vol = exercises.flatMap(e => e.sets).filter(s => s.completed && !s.is_warmup);
    if (vol.length === 0) {
      Alert.alert('No sets logged', 'Log at least one set before finishing.', [{ text: 'OK' }]);
      return;
    }
    Alert.alert('Finish Workout?', `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}, ${vol.length} sets`, [
      { text: 'Cancel' },
      { text: 'Finish', style: 'default', onPress: async () => {
        try {
          await finishWorkout(workoutNotes);
          navigation.navigate('WorkoutList');
        } catch (e) {
          Alert.alert('Save Failed', e.message || 'Could not save workout. Try again.');
        }
      }},
    ]);
  }

  function handleDiscard() {
    Alert.alert('Discard Workout?', 'All progress will be lost.', [
      { text: 'Keep going' },
      { text: 'Discard', style: 'destructive', onPress: async () => {
        await discardWorkout();
        navigation.goBack();
      }},
    ]);
  }

  const totalVol = exercises.reduce((sum, ex) => sum + totalVolume(ex.sets), 0);

  return (
    <Screen>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
          <Text style={styles.discardText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.workoutTitle}>{activeWorkout?.name}</Text>
          <Text style={styles.elapsed}>{formatDuration(elapsed)}</Text>
        </View>
        <Button label="Finish" onPress={handleFinish} style={styles.finishBtn} />
      </View>

      {/* Rest timer bar */}
      {restRunning && (
        <TouchableOpacity onPress={stopRest} style={styles.restBar}>
          <Text style={styles.restText}>Rest: {formatDuration(restTimer)}  (tap to skip)</Text>
        </TouchableOpacity>
      )}

      {/* PR flash */}
      {prFlash && (
        <View style={styles.prBanner}>
          <Text style={styles.prBannerText}>⭐ New PR — {prFlash}!</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{exercises.length} exercises</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{exercises.flatMap(e => e.sets).filter(s => s.completed).length} sets done</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{(totalVol / 1000).toFixed(1)}t volume</Text>
        </View>

        {/* Exercise list */}
        {exercises.map((ex, weIndex) => (
          <View key={ex.weId} style={styles.exerciseBlock}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseMeta}>{ex.equipment}</Text>
            </View>

            {/* Sets */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setCol, styles.setColNum]}>SET</Text>
              <Text style={[styles.setCol, styles.setColW]}>KG</Text>
              <Text style={[styles.setCol, styles.setColR]}>REPS</Text>
              <Text style={[styles.setCol, styles.setColDone]}></Text>
            </View>

            {ex.sets.map((s, setIndex) => (
              <View key={s.id} style={[styles.setRow, s.completed && styles.setRowDone]}>
                <Text style={[styles.setCol, styles.setColNum, styles.setNum]}>
                  {s.is_warmup ? 'W' : s.set_number}
                </Text>
                <Text style={[styles.setCol, styles.setColW, styles.setVal]}>{s.weight || '—'}</Text>
                <Text style={[styles.setCol, styles.setColR, styles.setVal]}>{s.reps || '—'}</Text>
                <TouchableOpacity
                  onPress={() => s.completed ? null : handleCompleteSet(weIndex, setIndex)}
                  onLongPress={() => Alert.alert('Delete set?', '', [
                    { text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteSet(weIndex, setIndex) }
                  ])}
                  style={[styles.setCheck, s.completed && styles.setCheckDone]}
                >
                  <Text style={styles.setCheckText}>{s.completed ? '✓' : '○'}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={() => handleAddSet(weIndex)} style={styles.addSetBtn}>
              <Text style={styles.addSetText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add exercise button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('ExerciseLibrary')}
          style={styles.addExBtn}
        >
          <Text style={styles.addExText}>+ Add Exercise</Text>
        </TouchableOpacity>

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          placeholder="Session notes..."
          placeholderTextColor={colors.textMuted}
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
          multiline
        />
      </ScrollView>

      {/* Set completion modal */}
      <Modal visible={!!editSet} transparent animationType="slide" onRequestClose={() => setEditSet(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Log Set</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={editSet?.weight}
                  onChangeText={v => setEditSet(s => ({ ...s, weight: v }))}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reps</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  value={editSet?.reps}
                  onChangeText={v => setEditSet(s => ({ ...s, reps: v }))}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>RPE</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={editSet?.rpe}
                  onChangeText={v => setEditSet(s => ({ ...s, rpe: v }))}
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                  selectTextOnFocus
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setEditSet(null)} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
              <Button label="✓ Done" onPress={handleSaveSet} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.m, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  discardBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  discardText: { color: colors.textSub, fontSize: 18 },
  topCenter: { flex: 1, alignItems: 'center' },
  workoutTitle: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.semibold },
  elapsed: { color: colors.textSub, fontSize: font.size.s },
  finishBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  restBar: {
    backgroundColor: colors.rest + '33', borderBottomWidth: 1, borderBottomColor: colors.rest,
    padding: spacing.s, alignItems: 'center',
  },
  restText: { color: colors.rest, fontSize: font.size.m, fontWeight: font.weight.semibold },
  prBanner: {
    backgroundColor: colors.primary + '22', borderBottomWidth: 1, borderBottomColor: colors.primary,
    padding: spacing.s, alignItems: 'center',
  },
  prBannerText: { color: colors.primary, fontSize: font.size.m, fontWeight: font.weight.semibold },
  scroll: { padding: spacing.m, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m },
  stat: { color: colors.textSub, fontSize: font.size.s },
  statDot: { color: colors.textMuted, marginHorizontal: spacing.s },
  exerciseBlock: {
    backgroundColor: colors.card, borderRadius: 12, padding: spacing.m, marginBottom: spacing.m,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.s },
  exerciseName: { flex: 1, color: colors.text, fontSize: font.size.l, fontWeight: font.weight.semibold },
  exerciseMeta: { color: colors.textSub, fontSize: font.size.s },
  setHeaderRow: { flexDirection: 'row', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, opacity: 0.6 },
  setRowDone: { opacity: 1 },
  setCol: { textAlign: 'center' },
  setColNum: { width: 36 },
  setColW: { flex: 1 },
  setColR: { flex: 1 },
  setColDone: { width: 44 },
  setNum: { color: colors.textSub, fontSize: font.size.s, fontWeight: font.weight.semibold },
  setVal: { color: colors.text, fontSize: font.size.m },
  setCheck: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  setCheckDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  setCheckText: { color: colors.bg, fontSize: font.size.m, fontWeight: font.weight.bold },
  addSetBtn: { paddingVertical: spacing.s, alignItems: 'center', marginTop: 4 },
  addSetText: { color: colors.primary, fontSize: font.size.s, fontWeight: font.weight.semibold },
  addExBtn: {
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: 12, padding: spacing.l, alignItems: 'center', marginBottom: spacing.m,
  },
  addExText: { color: colors.textSub, fontSize: font.size.m },
  notesInput: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.m, minHeight: 80, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border,
  },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.l, paddingBottom: 32 },
  modalTitle: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold, marginBottom: spacing.l },
  inputRow: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.l },
  inputGroup: { flex: 1 },
  inputLabel: { color: colors.textSub, fontSize: font.size.s, marginBottom: 4 },
  input: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.xl, textAlign: 'center',
    fontWeight: font.weight.bold, borderWidth: 1, borderColor: colors.border,
  },
  modalActions: { flexDirection: 'row', gap: spacing.s },
});
