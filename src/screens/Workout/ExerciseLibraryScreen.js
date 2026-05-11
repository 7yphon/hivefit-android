import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { Screen, Header, Button } from '../../components/Screen';
import { useUserStore } from '../../store/userStore';
import { useWorkoutStore } from '../../store/workoutStore';
import { getExercises, addCustomExercise } from '../../database/db';
import { colors, spacing, font } from '../../theme';
import { EXERCISE_CATEGORIES, EQUIPMENT_TYPES } from '../../utils/fitness';

const SESSION_CATEGORY_MAP = {
  martial_arts: 'Martial Arts',
  yoga: 'Yoga',
  pilates: 'Pilates',
  bodycombat: 'BodyCombat',
  chair_yoga: 'Chair Yoga',
  chair_pilates: 'Chair Pilates',
};

export default function ExerciseLibraryScreen({ navigation, route }) {
  const { activeUser } = useUserStore();
  const { addExercise } = useWorkoutStore();
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const initialCategory = SESSION_CATEGORY_MAP[route?.params?.sessionType] ?? 'All';
  const [category, setCategory] = useState(initialCategory);
  const [showAdd, setShowAdd] = useState(false);
  const [newEx, setNewEx] = useState({ name: '', category: 'Chest', equipment: 'Barbell', muscle_groups: '' });

  useEffect(() => { loadExercises(); }, []);

  useEffect(() => {
    let result = exercises;
    if (category !== 'All') result = result.filter(e => e.category === category);
    if (search.trim()) result = result.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [exercises, search, category]);

  async function loadExercises() {
    const data = await getExercises(activeUser?.id);
    setExercises(data);
  }

  async function handleAdd() {
    if (!newEx.name.trim()) return;
    await addCustomExercise(newEx, activeUser.id);
    await loadExercises();
    setShowAdd(false);
    setNewEx({ name: '', category: 'Chest', equipment: 'Barbell', muscle_groups: '' });
  }

  function handleSelect(exercise) {
    addExercise(exercise);
    navigation.goBack();
  }

  const categories = ['All', ...EXERCISE_CATEGORIES];

  return (
    <Screen>
      <Header
        title="Exercise Library"
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={() => setShowAdd(true)}>
            <Text style={{ color: colors.primary, fontSize: font.size.l }}>+</Text>
          </TouchableOpacity>
        }
      />

      <TextInput
        style={styles.search}
        placeholder="Search exercises..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {/* Category filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.catScroll}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCategory(item)}
            style={[styles.catChip, category === item && styles.catChipActive]}
          >
            <Text style={[styles.catChipText, category === item && styles.catChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={e => String(e.id)}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelect(item)} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowMeta}>{item.muscle_groups || item.category} · {item.equipment}</Text>
            </View>
            {item.is_custom ? <Text style={styles.customBadge}>custom</Text> : null}
            <Text style={styles.rowArrow}>+</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No exercises found.</Text>}
      />

      {/* Add custom exercise modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Custom Exercise</Text>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              placeholderTextColor={colors.textMuted}
              value={newEx.name}
              onChangeText={v => setNewEx(s => ({ ...s, name: v }))}
            />
            <Text style={styles.fieldLabel}>Category</Text>
            <FlatList
              horizontal
              data={EXERCISE_CATEGORIES}
              keyExtractor={c => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ marginBottom: spacing.m }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setNewEx(s => ({ ...s, category: item }))}
                  style={[styles.catChip, newEx.category === item && styles.catChipActive, { marginRight: spacing.s }]}
                >
                  <Text style={[styles.catChipText, newEx.category === item && styles.catChipTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TextInput
              style={styles.input}
              placeholder="Muscle groups (optional)"
              placeholderTextColor={colors.textMuted}
              value={newEx.muscle_groups}
              onChangeText={v => setNewEx(s => ({ ...s, muscle_groups: v }))}
            />
            <View style={styles.modalActions}>
              <Button label="Cancel" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1, marginRight: spacing.s }} />
              <Button label="Add" onPress={handleAdd} disabled={!newEx.name.trim()} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    margin: spacing.m, backgroundColor: colors.card, borderRadius: 10,
    padding: spacing.m, color: colors.text, fontSize: font.size.m,
    borderWidth: 1, borderColor: colors.border,
  },
  catScroll: { paddingHorizontal: spacing.m, paddingBottom: spacing.s },
  catChip: {
    paddingHorizontal: spacing.m, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.card, marginRight: spacing.s,
    borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  catChipText: { color: colors.textSub, fontSize: font.size.s },
  catChipTextActive: { color: colors.primary, fontWeight: font.weight.semibold },
  list: { padding: spacing.m, paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m, marginBottom: spacing.s,
  },
  rowLeft: { flex: 1 },
  rowName: { color: colors.text, fontSize: font.size.m, fontWeight: font.weight.medium },
  rowMeta: { color: colors.textSub, fontSize: font.size.s, marginTop: 2 },
  customBadge: { color: colors.primaryDim, fontSize: font.size.xs, marginRight: spacing.s },
  rowArrow: { color: colors.primary, fontSize: 22, fontWeight: font.weight.bold },
  empty: { color: colors.textSub, textAlign: 'center', padding: 32 },
  modalOverlay: { flex: 1, backgroundColor: '#000a', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.l, paddingBottom: 32 },
  modalTitle: { color: colors.text, fontSize: font.size.xl, fontWeight: font.weight.bold, marginBottom: spacing.l },
  input: {
    backgroundColor: colors.card, borderRadius: 10, padding: spacing.m,
    color: colors.text, fontSize: font.size.m, marginBottom: spacing.m,
    borderWidth: 1, borderColor: colors.border,
  },
  fieldLabel: { color: colors.textSub, fontSize: font.size.s, marginBottom: spacing.s },
  modalActions: { flexDirection: 'row', gap: spacing.s, marginTop: spacing.s },
});
