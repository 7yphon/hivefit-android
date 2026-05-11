import { loadUserToken } from './auth';

function _base(user) {
  return user?.openhive_url?.replace(/\/$/, '') ?? null;
}

function _buildWorkoutContent(workout, exercises) {
  const completedSets = exercises.flatMap(e => e.sets.filter(s => s.completed && !s.is_warmup));
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);

  return {
    workout_id:   workout.id,
    name:         workout.name,
    session_type: workout.sessionType,
    started_at:   workout.startedAt,
    finished_at:  new Date().toISOString(),
    exercises: exercises.map(e => ({
      name:     e.name,
      category: e.category,
      sets:     e.sets.filter(s => s.completed).map(s => ({
        set_number: s.set_number,
        weight:     s.weight,
        reps:       s.reps,
        rpe:        s.rpe ?? null,
        is_warmup:  !!s.is_warmup,
      })),
    })),
    total_volume: totalVolume,
  };
}

export async function pushWorkoutLog(user, { workout, exercises }) {
  const base = _base(user);
  if (!base || !user?.id) return false;
  const token = await loadUserToken(user.id);
  if (!token) return false;

  const res = await fetch(`${base}/api/hivefit/log`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Token': token },
    body:    JSON.stringify(_buildWorkoutContent(workout, exercises)),
  });
  return res.ok;
}

export async function fetchPlans(user) {
  const base = _base(user);
  if (!base || !user?.id) return [];
  const token = await loadUserToken(user.id);
  if (!token) return [];

  const res = await fetch(`${base}/api/hivefit/plans`, {
    headers: { 'X-Session-Token': token },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return data.plans ?? [];
}

export async function markPlanImported(user, planId) {
  const base = _base(user);
  if (!base || !user?.id) return;
  const token = await loadUserToken(user.id);
  if (!token) return;

  const res = await fetch(`${base}/api/hivefit/plans/${planId}`, {
    method:  'DELETE',
    headers: { 'X-Session-Token': token },
  });
  if (!res.ok) throw new Error(`Failed to mark plan consumed (${res.status})`);
}
