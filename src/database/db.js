import * as SQLite from 'expo-sqlite';
import { SCHEMA, SEED_EXERCISES } from './schema';

let _db = null;

export async function getDb() {
  if (_db) return _db;
  _db = SQLite.openDatabaseSync('hivefit.db');
  await _db.execAsync('PRAGMA journal_mode=WAL;');
  await _db.execAsync('PRAGMA foreign_keys=ON;');
  await initSchema();
  return _db;
}

async function initSchema() {
  // Run each CREATE TABLE individually for clearer error isolation
  const tables = SCHEMA.split(/;\s*\n/).map(s => s.trim()).filter(s => s.startsWith('CREATE'));
  for (const stmt of tables) {
    await _db.execAsync(stmt.endsWith(';') ? stmt : stmt + ';');
  }
  await seedExercises();
  await ensureDefaultUser();
}

async function seedExercises() {
  const count = await _db.getFirstAsync('SELECT COUNT(*) as n FROM exercises WHERE is_custom=0');
  if (count.n > 0) return;
  for (const ex of SEED_EXERCISES) {
    await _db.runAsync(
      'INSERT INTO exercises (name,category,muscle_groups,equipment,is_custom,youtube_query) VALUES (?,?,?,?,0,?)',
      [ex.name, ex.category, ex.muscle_groups || '', ex.equipment || '', ex.youtube_query || '']
    );
  }
}

async function ensureDefaultUser() {
  const count = await _db.getFirstAsync('SELECT COUNT(*) as n FROM users');
  if (count.n > 0) return;
  await _db.runAsync(
    "INSERT INTO users (name, avatar_color, is_active) VALUES ('Chris', '#c8f03c', 1)"
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUsers() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM users ORDER BY id');
}

export async function getActiveUser() {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM users WHERE is_active=1');
}

export async function setActiveUser(id) {
  const db = await getDb();
  await db.runAsync('UPDATE users SET is_active=0');
  await db.runAsync('UPDATE users SET is_active=1 WHERE id=?', [id]);
}

export async function upsertUser(user) {
  const db = await getDb();
  if (user.id) {
    await db.runAsync(
      'UPDATE users SET name=?,avatar_color=?,openhive_url=?,openhive_username=?,openhive_token=? WHERE id=?',
      [user.name, user.avatar_color, user.openhive_url, user.openhive_username, user.openhive_token, user.id]
    );
  } else {
    const r = await db.runAsync(
      'INSERT INTO users (name,avatar_color,openhive_url,openhive_username,openhive_token,is_active) VALUES (?,?,?,?,?,0)',
      [user.name, user.avatar_color || '#c8f03c', user.openhive_url || null, user.openhive_username || null, user.openhive_token || null]
    );
    return r.lastInsertRowId;
  }
}

// ── Exercises ─────────────────────────────────────────────────────────────────
export async function getExercises(userId = null) {
  const db = await getDb();
  if (userId) {
    return db.getAllAsync(
      'SELECT * FROM exercises WHERE is_custom=0 OR user_id=? ORDER BY category,name',
      [userId]
    );
  }
  return db.getAllAsync('SELECT * FROM exercises WHERE is_custom=0 ORDER BY category,name');
}

export async function addCustomExercise(exercise, userId) {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO exercises (name,category,muscle_groups,equipment,is_custom,user_id,notes,youtube_query) VALUES (?,?,?,?,1,?,?,?)',
    [exercise.name, exercise.category, exercise.muscle_groups || '', exercise.equipment || '',
     userId, exercise.notes || '', exercise.youtube_query || '']
  );
  return r.lastInsertRowId;
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export async function startWorkout(userId, name, sessionType = 'strength', templateId = null) {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO workouts (user_id,name,session_type,template_id,started_at) VALUES (?,?,?,?,?)',
    [userId, name, sessionType, templateId, new Date().toISOString()]
  );
  return r.lastInsertRowId;
}

export async function finishWorkout(workoutId, notes = '') {
  const db = await getDb();
  await db.runAsync(
    'UPDATE workouts SET finished_at=?,notes=? WHERE id=?',
    [new Date().toISOString(), notes, workoutId]
  );
}

export async function getWorkouts(userId, limit = 50) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM workouts WHERE user_id=? ORDER BY started_at DESC LIMIT ?',
    [userId, limit]
  );
}

export async function getWorkoutDetail(workoutId) {
  const db = await getDb();
  const workout = await db.getFirstAsync('SELECT * FROM workouts WHERE id=?', [workoutId]);
  const exercises = await db.getAllAsync(
    `SELECT we.*, e.name, e.category, e.equipment, e.muscle_groups
     FROM workout_exercises we JOIN exercises e ON we.exercise_id=e.id
     WHERE we.workout_id=? ORDER BY we.position`,
    [workoutId]
  );
  for (const ex of exercises) {
    ex.sets = await db.getAllAsync(
      'SELECT * FROM sets WHERE workout_exercise_id=? ORDER BY set_number',
      [ex.id]
    );
  }
  return { workout, exercises };
}

// ── Workout Exercises & Sets ──────────────────────────────────────────────────
export async function addExerciseToWorkout(workoutId, exerciseId, position) {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO workout_exercises (workout_id,exercise_id,position) VALUES (?,?,?)',
    [workoutId, exerciseId, position]
  );
  return r.lastInsertRowId;
}

export async function addSet(workoutExerciseId, setData) {
  const db = await getDb();
  const r = await db.runAsync(
    'INSERT INTO sets (workout_exercise_id,set_number,weight,reps,rpe,duration_seconds,is_warmup,completed) VALUES (?,?,?,?,?,?,?,0)',
    [workoutExerciseId, setData.set_number, setData.weight || null,
     setData.reps || null, setData.rpe || null, setData.duration_seconds || null,
     setData.is_warmup ? 1 : 0]
  );
  return r.lastInsertRowId;
}

export async function completeSet(setId, weight, reps, rpe = null) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sets SET weight=?,reps=?,rpe=?,completed=1,completed_at=? WHERE id=?',
    [weight, reps, rpe, new Date().toISOString(), setId]
  );
}

export async function deleteSet(setId) {
  const db = await getDb();
  await db.runAsync('DELETE FROM sets WHERE id=?', [setId]);
}

// ── Personal Records ──────────────────────────────────────────────────────────
export async function checkAndSavePR(userId, exerciseId, weight, reps, workoutId) {
  const db = await getDb();
  const est1rm = weight * (1 + reps / 30);
  const existing = await db.getFirstAsync(
    'SELECT * FROM personal_records WHERE user_id=? AND exercise_id=? AND rep_count=?',
    [userId, exerciseId, reps]
  );
  if (!existing || weight > existing.weight) {
    await db.runAsync(
      `INSERT INTO personal_records (user_id,exercise_id,rep_count,weight,estimated_1rm,achieved_at,workout_id)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(user_id,exercise_id,rep_count) DO UPDATE SET
       weight=excluded.weight, estimated_1rm=excluded.estimated_1rm,
       achieved_at=excluded.achieved_at, workout_id=excluded.workout_id`,
      [userId, exerciseId, reps, weight, est1rm, new Date().toISOString(), workoutId]
    );
    return true;
  }
  return false;
}

export async function getPRs(userId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT pr.*, e.name as exercise_name, e.category
     FROM personal_records pr JOIN exercises e ON pr.exercise_id=e.id
     WHERE pr.user_id=? ORDER BY pr.estimated_1rm DESC`,
    [userId]
  );
}

export async function getExercisePRs(userId, exerciseId) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM personal_records WHERE user_id=? AND exercise_id=? ORDER BY rep_count',
    [userId, exerciseId]
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
export async function getExerciseHistory(userId, exerciseId, limit = 30) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT w.started_at, w.id as workout_id,
            MAX(s.weight) as best_weight,
            MAX(s.weight * (1 + s.reps/30.0)) as est_1rm,
            SUM(s.weight * s.reps) as volume
     FROM workouts w
     JOIN workout_exercises we ON we.workout_id=w.id
     JOIN sets s ON s.workout_exercise_id=we.id
     WHERE w.user_id=? AND we.exercise_id=? AND s.completed=1 AND s.is_warmup=0
     GROUP BY w.id ORDER BY w.started_at DESC LIMIT ?`,
    [userId, exerciseId, limit]
  );
}

// ── Body Metrics ──────────────────────────────────────────────────────────────
export async function saveBodyMetrics(userId, metrics) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO body_metrics (user_id,recorded_at,source,weight_kg,body_fat_pct,muscle_mass_kg,bmr,bmi,visceral_fat)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [userId, metrics.recorded_at || new Date().toISOString(), metrics.source || 'manual',
     metrics.weight_kg || null, metrics.body_fat_pct || null, metrics.muscle_mass_kg || null,
     metrics.bmr || null, metrics.bmi || null, metrics.visceral_fat || null]
  );
}

export async function getBodyMetrics(userId, limit = 60) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM body_metrics WHERE user_id=? ORDER BY recorded_at DESC LIMIT ?',
    [userId, limit]
  );
}
