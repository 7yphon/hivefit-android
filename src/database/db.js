import * as SQLite from 'expo-sqlite';
import { SCHEMA, SEED_EXERCISES } from './schema';

let _initPromise = null;

export function getDb() {
  if (!_initPromise) {
    _initPromise = (async () => {
      const db = SQLite.openDatabaseSync('hivefit.db');
      await db.execAsync('PRAGMA journal_mode=WAL;');
      await db.execAsync('PRAGMA foreign_keys=ON;');
      await initSchema(db);
      return db;
    })();
  }
  return _initPromise;
}

async function initSchema(db) {
  await db.withTransactionAsync(async () => {
    const tables = SCHEMA.split(/;\s*\n/).map(s => s.trim()).filter(s => s.startsWith('CREATE'));
    for (const stmt of tables) {
      await db.execAsync(stmt.endsWith(';') ? stmt : stmt + ';');
    }
  });
  await runMigrations(db);
  await seedExercises(db);
  await ensureDefaultUser(db);
}

async function runMigrations(db) {
  const cols = [
    'ALTER TABLE users ADD COLUMN height_cm REAL',
    'ALTER TABLE users ADD COLUMN sex TEXT',
    'ALTER TABLE users ADD COLUMN birth_year INTEGER',
    'ALTER TABLE users ADD COLUMN target_weight_kg REAL',
  ];
  for (const sql of cols) {
    try {
      await db.execAsync(sql);
    } catch (e) {
      // Ignore "already exists" — rethrow anything unexpected
      if (!e.message?.includes('duplicate column name') && !e.message?.includes('already exists')) throw e;
    }
  }
  // Clear any stale tokens left in the dead openhive_token column
  await db.execAsync('UPDATE users SET openhive_token=NULL WHERE openhive_token IS NOT NULL');
}

async function seedExercises(db) {
  const existing = await db.getAllAsync('SELECT name FROM exercises WHERE is_custom=0');
  const existingNames = new Set(existing.map(r => r.name));
  for (const ex of SEED_EXERCISES) {
    if (!existingNames.has(ex.name)) {
      await db.runAsync(
        'INSERT INTO exercises (name,category,muscle_groups,equipment,is_custom,youtube_query) VALUES (?,?,?,?,0,?)',
        [ex.name, ex.category, ex.muscle_groups || '', ex.equipment || '', ex.youtube_query || '']
      );
    }
  }
}

async function ensureDefaultUser(db) {
  // No-op — first-run onboarding creates the initial profile
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
      `UPDATE users SET name=?,avatar_color=?,openhive_url=?,openhive_username=?,openhive_token=NULL,
       height_cm=?,sex=?,birth_year=?,target_weight_kg=? WHERE id=?`,
      [user.name, user.avatar_color, user.openhive_url ?? null, user.openhive_username ?? null,
       user.height_cm ?? null, user.sex ?? null, user.birth_year ?? null, user.target_weight_kg ?? null,
       user.id]
    );
  } else {
    const r = await db.runAsync(
      'INSERT INTO users (name,avatar_color,openhive_url,openhive_username,height_cm,sex,birth_year,target_weight_kg,is_active) VALUES (?,?,?,?,?,?,?,?,0)',
      [user.name, user.avatar_color || '#f59e0b', user.openhive_url ?? null, user.openhive_username ?? null,
       user.height_cm ?? null, user.sex ?? null, user.birth_year ?? null, user.target_weight_kg ?? null]
    );
    return r.lastInsertRowId;
  }
}

export function calcBMI(weight_kg, height_cm) {
  if (!weight_kg || !height_cm) return null;
  const h = height_cm / 100;
  return Math.round((weight_kg / (h * h)) * 10) / 10;
}

export function calcBMR(weight_kg, height_cm, sex, birth_year) {
  if (!weight_kg || !height_cm || !sex || !birth_year) return null;
  const age = new Date().getFullYear() - birth_year;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
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

export async function deleteWorkout(workoutId) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id=?)',
      [workoutId]
    );
    await db.runAsync('DELETE FROM workout_exercises WHERE workout_id=?', [workoutId]);
    await db.runAsync('DELETE FROM workouts WHERE id=?', [workoutId]);
  });
}

export async function updateWorkoutSynced(workoutId) {
  const db = await getDb();
  await db.runAsync('UPDATE workouts SET synced_to_openhive=1 WHERE id=?', [workoutId]);
}

export async function getInProgressWorkout(userId) {
  const db = await getDb();
  return db.getFirstAsync(
    'SELECT * FROM workouts WHERE user_id=? AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1',
    [userId]
  );
}

export async function getWorkouts(userId, limit = 50) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM workouts WHERE user_id=? AND finished_at IS NOT NULL ORDER BY started_at DESC LIMIT ?',
    [userId, limit]
  );
}

export async function getWorkoutDetail(workoutId) {
  const db = await getDb();
  const workout = await db.getFirstAsync('SELECT * FROM workouts WHERE id=?', [workoutId]);
  const rows = await db.getAllAsync(
    `SELECT we.id as we_id, we.workout_id, we.exercise_id, we.position, we.notes as we_notes,
            e.name, e.category, e.equipment, e.muscle_groups,
            s.id as s_id, s.set_number, s.weight, s.reps, s.rpe,
            s.duration_seconds, s.is_warmup, s.completed, s.completed_at
     FROM workout_exercises we
     JOIN exercises e ON we.exercise_id = e.id
     LEFT JOIN sets s ON s.workout_exercise_id = we.id
     WHERE we.workout_id = ?
     ORDER BY we.position, s.set_number`,
    [workoutId]
  );

  const exerciseMap = new Map();
  for (const row of rows) {
    if (!exerciseMap.has(row.we_id)) {
      exerciseMap.set(row.we_id, {
        id: row.we_id,
        workout_id: row.workout_id,
        exercise_id: row.exercise_id,
        position: row.position,
        notes: row.we_notes,
        name: row.name,
        category: row.category,
        equipment: row.equipment,
        muscle_groups: row.muscle_groups,
        sets: [],
      });
    }
    if (row.s_id != null) {
      exerciseMap.get(row.we_id).sets.push({
        id: row.s_id,
        set_number: row.set_number,
        weight: row.weight,
        reps: row.reps,
        rpe: row.rpe,
        duration_seconds: row.duration_seconds,
        is_warmup: row.is_warmup,
        completed: row.completed,
        completed_at: row.completed_at,
      });
    }
  }

  return { workout, exercises: [...exerciseMap.values()] };
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
    [workoutExerciseId, setData.set_number, setData.weight ?? null,
     setData.reps ?? null, setData.rpe ?? null, setData.duration_seconds ?? null,
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
            MAX(s.weight * (1 + s.reps / 30.0)) as est_1rm,
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
    [userId, metrics.recorded_at ?? new Date().toISOString(), metrics.source ?? 'manual',
     metrics.weight_kg ?? null, metrics.body_fat_pct ?? null, metrics.muscle_mass_kg ?? null,
     metrics.bmr ?? null, metrics.bmi ?? null, metrics.visceral_fat ?? null]
  );
}

export async function importBodyHistory(userId, entries) {
  const db = await getDb();
  const existing = await db.getAllAsync(
    "SELECT substr(recorded_at,1,10) as date FROM body_metrics WHERE user_id=? AND source='health_connect'",
    [userId]
  );
  const existingDates = new Set(existing.map(r => r.date));
  let count = 0;
  for (const e of entries) {
    if (existingDates.has(e.date)) continue;
    await db.runAsync(
      `INSERT INTO body_metrics (user_id,recorded_at,source,weight_kg,body_fat_pct,bmr,bmi)
       VALUES (?,?,?,?,?,?,?)`,
      [userId, e.recorded_at, 'health_connect',
       e.weight_kg ?? null, e.body_fat_pct ?? null, e.bmr ?? null, e.bmi ?? null]
    );
    count++;
  }
  return count;
}

export async function getBodyMetrics(userId, limit = 60) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM body_metrics WHERE user_id=? ORDER BY recorded_at DESC LIMIT ?',
    [userId, limit]
  );
}

export async function importPlanMarkdown(content, userId) {
  const db = await getDb();
  const lines = content.split('\n');

  let programName = 'Imported Program';
  let weeks = 4;
  const days = [];
  let currentDay = null;
  let currentExercise = null;
  let currentSection = 'exercise';

  function pushExercise() {
    if (currentExercise && currentDay) {
      currentDay.exercises.push(currentExercise);
      currentExercise = null;
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('# ')) {
      programName = line.slice(2).trim();
    } else if (/^weeks\s*:/i.test(line)) {
      weeks = parseInt(line.split(':')[1]) || 4;
    } else if (line.startsWith('## ')) {
      pushExercise();
      if (currentDay) days.push(currentDay);
      const label = line.replace(/^##\s*/, '').replace(/^Day\s+\d+\s*:\s*/i, '').trim();
      currentDay = { label, exercises: [] };
      currentSection = 'exercise';
    } else if (line.startsWith('### ') && currentDay) {
      pushExercise();
      const sectionName = line.slice(4).trim();
      const lower = sectionName.toLowerCase();
      if (lower === 'warmup') {
        currentSection = 'warmup';
      } else if (lower === 'cooldown') {
        currentSection = 'cooldown';
      } else {
        currentSection = 'exercise';
        currentExercise = { name: sectionName, sets: [] };
      }
    } else if (line.startsWith('- ') && currentDay) {
      const item = line.slice(2).trim();

      if (currentSection === 'warmup' || currentSection === 'cooldown') {
        const parts = item.split('|').map(s => s.trim());
        const exName = parts[0];
        const spec = parts[1] || '';
        const repMatch = spec.match(/(\d+)\s*[x×]\s*(\d+)/i);
        const defaultSets = repMatch ? parseInt(repMatch[1]) : 1;
        const defaultReps = repMatch ? parseInt(repMatch[2]) : 10;
        currentDay.exercises.push({ name: exName, sets: [], defaultSets, defaultReps, defaultWeight: 0 });
      } else if (currentExercise) {
        const setMatch = item.match(/set\s*\d+\s*\|\s*([\d.]+)\s*kg\s*[x×]\s*(\d+)/i);
        if (setMatch) {
          currentExercise.sets.push({ weight: parseFloat(setMatch[1]), reps: parseInt(setMatch[2]) });
        }
      }
    }
  }

  pushExercise();
  if (currentDay) days.push(currentDay);

  // Skip if already imported (prevents double-import when markPlanImported fails)
  const existingProg = await db.getFirstAsync(
    'SELECT id FROM programs WHERE user_id=? AND name=?',
    [userId, programName]
  );
  if (existingProg) return existingProg.id;

  let programId;
  await db.withTransactionAsync(async () => {
    const progResult = await db.runAsync(
      'INSERT INTO programs (user_id, name, weeks, active) VALUES (?,?,?,1)',
      [userId, programName, weeks]
    );
    programId = progResult.lastInsertRowId;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const tmplResult = await db.runAsync(
        'INSERT INTO workout_templates (user_id, name, session_type) VALUES (?,?,?)',
        [userId, day.label, 'strength']
      );
      const templateId = tmplResult.lastInsertRowId;

      await db.runAsync(
        'INSERT INTO program_days (program_id, day_of_week, template_id, label) VALUES (?,?,?,?)',
        [programId, i + 1, templateId, day.label]
      );

      for (let pos = 0; pos < day.exercises.length; pos++) {
        const ex = day.exercises[pos];
        let exRow = await db.getFirstAsync(
          'SELECT id FROM exercises WHERE LOWER(name)=? LIMIT 1',
          [ex.name.toLowerCase()]
        );
        if (!exRow) {
          const ins = await db.runAsync(
            'INSERT INTO exercises (name, category, is_custom, user_id) VALUES (?,?,1,?)',
            [ex.name, 'Other', userId]
          );
          exRow = { id: ins.lastInsertRowId };
        }
        const workingSets = ex.sets ?? [];
        const lastSet = workingSets[workingSets.length - 1];
        const defaultSets   = ex.defaultSets  ?? (workingSets.length || 3);
        const defaultReps   = ex.defaultReps  ?? (lastSet?.reps   || 8);
        const defaultWeight = ex.defaultWeight ?? (lastSet?.weight || 0);

        await db.runAsync(
          'INSERT INTO template_exercises (template_id, exercise_id, position, default_sets, default_reps, default_weight) VALUES (?,?,?,?,?,?)',
          [templateId, exRow.id, pos, defaultSets, defaultReps, defaultWeight]
        );
      }
    }
  });

  return programId;
}
