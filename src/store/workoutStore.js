import { create } from 'zustand';
import {
  startWorkout, finishWorkout, deleteWorkout, addExerciseToWorkout,
  addSet, completeSet, deleteSet, checkAndSavePR,
} from '../database/db';

export const useWorkoutStore = create((set, get) => ({
  activeWorkout: null,       // { id, name, sessionType, startedAt }
  exercises: [],             // [{ weId, exerciseId, name, category, sets: [...] }]
  isActive: false,

  startWorkout: async (userId, name, sessionType = 'strength', templateId = null) => {
    const workoutId = await startWorkout(userId, name, sessionType, templateId);
    set({
      activeWorkout: { id: workoutId, name, sessionType, userId, startedAt: new Date().toISOString() },
      exercises: [],
      isActive: true,
    });
    return workoutId;
  },

  addExercise: async (exercise) => {
    const { activeWorkout, exercises } = get();
    if (!activeWorkout) return;
    const position = exercises.length;
    const weId = await addExerciseToWorkout(activeWorkout.id, exercise.id, position);
    const newEx = {
      weId,
      exerciseId: exercise.id,
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      sets: [],
    };
    set({ exercises: [...exercises, newEx] });
  },

  addSet: async (weIndex, setData) => {
    const { exercises } = get();
    const ex = exercises[weIndex];
    if (!ex) return;
    const setNumber = ex.sets.length + 1;
    const setId = await addSet(ex.weId, { ...setData, set_number: setNumber });
    const newSet = { id: setId, set_number: setNumber, ...setData, completed: 0 };
    const updated = exercises.map((e, i) =>
      i === weIndex ? { ...e, sets: [...e.sets, newSet] } : e
    );
    set({ exercises: updated });
    return setId;
  },

  completeSet: async (weIndex, setIndex, weight, reps, rpe = null) => {
    const { exercises, activeWorkout } = get();
    const ex = exercises[weIndex];
    const s = ex?.sets[setIndex];
    if (!s) return false;
    await completeSet(s.id, weight, reps, rpe);
    const isPR = !s.is_warmup && await checkAndSavePR(
      activeWorkout.userId, ex.exerciseId, weight, reps, activeWorkout.id
    );
    const updated = exercises.map((e, i) => {
      if (i !== weIndex) return e;
      return {
        ...e,
        sets: e.sets.map((st, j) =>
          j === setIndex ? { ...st, weight, reps, rpe, completed: 1 } : st
        ),
      };
    });
    set({ exercises: updated });
    return isPR;
  },

  deleteSet: async (weIndex, setIndex) => {
    const { exercises } = get();
    const s = exercises[weIndex]?.sets[setIndex];
    if (!s) return;
    await deleteSet(s.id);
    const updated = exercises.map((e, i) => {
      if (i !== weIndex) return e;
      return { ...e, sets: e.sets.filter((_, j) => j !== setIndex) };
    });
    set({ exercises: updated });
  },

  finishWorkout: async (notes = '') => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;
    await finishWorkout(activeWorkout.id, notes);
    const finished = { ...activeWorkout, finishedAt: new Date().toISOString() };
    set({ activeWorkout: null, exercises: [], isActive: false });
    return finished;
  },

  discardWorkout: async () => {
    const { activeWorkout } = get();
    if (activeWorkout?.id) {
      await deleteWorkout(activeWorkout.id);
    }
    set({ activeWorkout: null, exercises: [], isActive: false });
  },
}));
