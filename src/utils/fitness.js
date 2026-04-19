// Brzycki 1RM formula
export function estimate1RM(weight, reps) {
  if (reps === 1) return weight;
  return weight * (36 / (37 - reps));
}

// Given a target weight and barbell weight, return plates per side
export function calculatePlates(targetKg, barbellKg = 20, availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25]) {
  const perSide = (targetKg - barbellKg) / 2;
  if (perSide < 0) return { error: 'Target lighter than barbell', plates: [] };
  let remaining = perSide;
  const plates = [];
  for (const plate of availablePlates) {
    while (remaining >= plate - 0.001) {
      plates.push(plate);
      remaining -= plate;
      remaining = Math.round(remaining * 1000) / 1000;
    }
  }
  const achievable = remaining < 0.01;
  const actualWeight = barbellKg + plates.reduce((a, b) => a + b, 0) * 2;
  return { plates, achievable, actualWeight, perSide };
}

export function formatWeight(kg) {
  return kg % 1 === 0 ? `${kg}kg` : `${kg}kg`;
}

export function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatWorkoutDuration(startedAt, finishedAt) {
  if (!finishedAt) return null;
  const diff = Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000);
  return formatDuration(diff);
}

export function totalVolume(sets) {
  return sets
    .filter(s => s.completed && !s.is_warmup)
    .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
}

export const BARBELL_PRESETS = [
  { label: 'Standard (20kg)', weight: 20 },
  { label: "Women's (15kg)", weight: 15 },
  { label: 'Trap Bar (25kg)', weight: 25 },
  { label: 'EZ Bar (10kg)', weight: 10 },
];

export const MARTIAL_DISCIPLINES = [
  'Boxing', 'Kickboxing', 'Muay Thai', 'Taekwondo',
  'Tai Chi', 'BJJ', 'Wrestling', 'MMA', 'Bag Work',
  'Pad Work', 'Sparring', 'Shadowboxing', 'Drilling',
];

export const EXERCISE_CATEGORIES = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Martial Arts', 'Other',
];

export const EQUIPMENT_TYPES = [
  'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Bands', 'Bag', 'Pads', 'Rope', 'Partner', 'Other',
];
