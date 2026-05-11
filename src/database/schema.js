export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#c8f03c',
    openhive_url TEXT,
    openhive_username TEXT,
    openhive_token TEXT,
    is_active INTEGER DEFAULT 0,
    height_cm REAL,
    sex TEXT,
    birth_year INTEGER,
    target_weight_kg REAL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    muscle_groups TEXT,
    equipment TEXT,
    is_custom INTEGER DEFAULT 0,
    user_id INTEGER,
    notes TEXT,
    youtube_query TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workout_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    session_type TEXT DEFAULT 'strength',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS template_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    default_sets INTEGER DEFAULT 3,
    default_reps INTEGER DEFAULT 8,
    default_weight REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    weeks INTEGER DEFAULT 4,
    active INTEGER DEFAULT 0,
    start_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS program_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL,
    template_id INTEGER,
    label TEXT
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id INTEGER,
    name TEXT NOT NULL,
    session_type TEXT DEFAULT 'strength',
    started_at TEXT NOT NULL,
    finished_at TEXT,
    notes TEXT,
    synced_to_openhive INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight REAL,
    reps INTEGER,
    rpe REAL,
    duration_seconds INTEGER,
    is_warmup INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS martial_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    discipline TEXT NOT NULL,
    rounds INTEGER,
    round_duration_seconds INTEGER,
    rest_between_seconds INTEGER,
    rpe REAL,
    partner_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS personal_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    rep_count INTEGER NOT NULL,
    weight REAL NOT NULL,
    estimated_1rm REAL,
    achieved_at TEXT NOT NULL,
    workout_id INTEGER,
    UNIQUE(user_id, exercise_id, rep_count)
  );

  CREATE TABLE IF NOT EXISTS body_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recorded_at TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    weight_kg REAL,
    body_fat_pct REAL,
    muscle_mass_kg REAL,
    bmr REAL,
    bmi REAL,
    visceral_fat REAL
  );

  CREATE TABLE IF NOT EXISTS daily_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    steps INTEGER,
    active_calories REAL,
    resting_hr INTEGER,
    sleep_minutes INTEGER,
    sleep_score REAL,
    source TEXT DEFAULT 'health_connect',
    UNIQUE(user_id, date)
  );
`;

export const SEED_EXERCISES = [
  // Chest
  { name: 'Bench Press', category: 'Chest', muscle_groups: 'Chest,Triceps,Front Delts', equipment: 'Barbell', youtube_query: 'bench press form tutorial' },
  { name: 'Incline Bench Press', category: 'Chest', muscle_groups: 'Upper Chest,Triceps', equipment: 'Barbell', youtube_query: 'incline bench press form' },
  { name: 'Dumbbell Fly', category: 'Chest', muscle_groups: 'Chest', equipment: 'Dumbbell', youtube_query: 'dumbbell fly form' },
  { name: 'Cable Fly', category: 'Chest', muscle_groups: 'Chest', equipment: 'Cable', youtube_query: 'cable fly chest form' },
  { name: 'Dips', category: 'Chest', muscle_groups: 'Chest,Triceps', equipment: 'Bodyweight', youtube_query: 'chest dips form tutorial' },
  // Back
  { name: 'Deadlift', category: 'Back', muscle_groups: 'Lower Back,Hamstrings,Glutes,Traps', equipment: 'Barbell', youtube_query: 'deadlift form tutorial' },
  { name: 'Barbell Row', category: 'Back', muscle_groups: 'Lats,Rhomboids,Biceps', equipment: 'Barbell', youtube_query: 'barbell row form tutorial' },
  { name: 'Pull-Up', category: 'Back', muscle_groups: 'Lats,Biceps', equipment: 'Bodyweight', youtube_query: 'pull up form tutorial' },
  { name: 'Lat Pulldown', category: 'Back', muscle_groups: 'Lats,Biceps', equipment: 'Cable', youtube_query: 'lat pulldown form' },
  { name: 'Seated Cable Row', category: 'Back', muscle_groups: 'Lats,Rhomboids,Biceps', equipment: 'Cable', youtube_query: 'seated cable row form' },
  { name: 'Face Pull', category: 'Back', muscle_groups: 'Rear Delts,Rotator Cuff', equipment: 'Cable', youtube_query: 'face pull form tutorial' },
  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders', muscle_groups: 'Front Delts,Triceps', equipment: 'Barbell', youtube_query: 'overhead press form tutorial' },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders', muscle_groups: 'Front Delts,Triceps', equipment: 'Dumbbell', youtube_query: 'dumbbell shoulder press form' },
  { name: 'Lateral Raise', category: 'Shoulders', muscle_groups: 'Side Delts', equipment: 'Dumbbell', youtube_query: 'lateral raise form tutorial' },
  { name: 'Rear Delt Fly', category: 'Shoulders', muscle_groups: 'Rear Delts', equipment: 'Dumbbell', youtube_query: 'rear delt fly form' },
  // Arms
  { name: 'Barbell Curl', category: 'Arms', muscle_groups: 'Biceps', equipment: 'Barbell', youtube_query: 'barbell curl form tutorial' },
  { name: 'Dumbbell Curl', category: 'Arms', muscle_groups: 'Biceps', equipment: 'Dumbbell', youtube_query: 'dumbbell curl form' },
  { name: 'Hammer Curl', category: 'Arms', muscle_groups: 'Biceps,Brachialis', equipment: 'Dumbbell', youtube_query: 'hammer curl form' },
  { name: 'Tricep Pushdown', category: 'Arms', muscle_groups: 'Triceps', equipment: 'Cable', youtube_query: 'tricep pushdown form' },
  { name: 'Skull Crusher', category: 'Arms', muscle_groups: 'Triceps', equipment: 'Barbell', youtube_query: 'skull crusher form tutorial' },
  // Legs
  { name: 'Squat', category: 'Legs', muscle_groups: 'Quads,Glutes,Hamstrings', equipment: 'Barbell', youtube_query: 'barbell squat form tutorial' },
  { name: 'Romanian Deadlift', category: 'Legs', muscle_groups: 'Hamstrings,Glutes', equipment: 'Barbell', youtube_query: 'romanian deadlift form' },
  { name: 'Leg Press', category: 'Legs', muscle_groups: 'Quads,Glutes', equipment: 'Machine', youtube_query: 'leg press form tutorial' },
  { name: 'Leg Curl', category: 'Legs', muscle_groups: 'Hamstrings', equipment: 'Machine', youtube_query: 'lying leg curl form' },
  { name: 'Leg Extension', category: 'Legs', muscle_groups: 'Quads', equipment: 'Machine', youtube_query: 'leg extension form' },
  { name: 'Calf Raise', category: 'Legs', muscle_groups: 'Calves', equipment: 'Machine', youtube_query: 'standing calf raise form' },
  { name: 'Hip Thrust', category: 'Legs', muscle_groups: 'Glutes,Hamstrings', equipment: 'Barbell', youtube_query: 'barbell hip thrust form' },
  // Core
  { name: 'Plank', category: 'Core', muscle_groups: 'Abs,Obliques', equipment: 'Bodyweight', youtube_query: 'plank form tutorial' },
  { name: 'Ab Wheel', category: 'Core', muscle_groups: 'Abs', equipment: 'Other', youtube_query: 'ab wheel rollout form' },
  { name: 'Cable Crunch', category: 'Core', muscle_groups: 'Abs', equipment: 'Cable', youtube_query: 'cable crunch form' },
  { name: 'Hanging Leg Raise', category: 'Core', muscle_groups: 'Lower Abs', equipment: 'Bodyweight', youtube_query: 'hanging leg raise form' },
  // Martial Arts
  { name: 'Heavy Bag', category: 'Martial Arts', muscle_groups: 'Full Body', equipment: 'Bag', youtube_query: 'heavy bag boxing workout' },
  { name: 'Pad Work', category: 'Martial Arts', muscle_groups: 'Full Body', equipment: 'Pads', youtube_query: 'boxing pad work drills' },
  { name: 'Sparring', category: 'Martial Arts', muscle_groups: 'Full Body', equipment: 'Partner', youtube_query: 'boxing sparring tips' },
  { name: 'Shadowboxing', category: 'Martial Arts', muscle_groups: 'Full Body', equipment: 'Bodyweight', youtube_query: 'shadowboxing technique' },
  { name: 'Jump Rope', category: 'Cardio', muscle_groups: 'Full Body,Calves', equipment: 'Rope', youtube_query: 'jump rope boxing cardio' },
  // Yoga
  { name: 'Sun Salutation', category: 'Yoga', muscle_groups: 'Full Body', equipment: 'Bodyweight', youtube_query: 'sun salutation tutorial' },
  { name: 'Warrior I', category: 'Yoga', muscle_groups: 'Legs,Hips,Shoulders', equipment: 'Bodyweight', youtube_query: 'warrior 1 yoga pose' },
  { name: 'Warrior II', category: 'Yoga', muscle_groups: 'Legs,Hips,Shoulders', equipment: 'Bodyweight', youtube_query: 'warrior 2 yoga pose' },
  { name: 'Warrior III', category: 'Yoga', muscle_groups: 'Legs,Core,Shoulders', equipment: 'Bodyweight', youtube_query: 'warrior 3 yoga pose' },
  { name: 'Downward Dog', category: 'Yoga', muscle_groups: 'Hamstrings,Calves,Shoulders', equipment: 'Bodyweight', youtube_query: 'downward dog yoga tutorial' },
  { name: "Child's Pose", category: 'Yoga', muscle_groups: 'Back,Hips', equipment: 'Bodyweight', youtube_query: 'childs pose yoga tutorial' },
  { name: 'Tree Pose', category: 'Yoga', muscle_groups: 'Legs,Core', equipment: 'Bodyweight', youtube_query: 'tree pose yoga tutorial' },
  { name: 'Bridge Pose', category: 'Yoga', muscle_groups: 'Glutes,Back,Hamstrings', equipment: 'Bodyweight', youtube_query: 'bridge pose yoga tutorial' },
  { name: 'Cat-Cow', category: 'Yoga', muscle_groups: 'Spine,Core', equipment: 'Bodyweight', youtube_query: 'cat cow yoga stretch' },
  { name: 'Pigeon Pose', category: 'Yoga', muscle_groups: 'Hips,Glutes', equipment: 'Bodyweight', youtube_query: 'pigeon pose yoga tutorial' },
  { name: 'Seated Forward Fold', category: 'Yoga', muscle_groups: 'Hamstrings,Back', equipment: 'Bodyweight', youtube_query: 'seated forward fold yoga' },
  { name: 'Savasana', category: 'Yoga', muscle_groups: 'Full Body', equipment: 'Bodyweight', youtube_query: 'savasana yoga relaxation' },
  // Pilates
  { name: 'The Hundred', category: 'Pilates', muscle_groups: 'Abs,Core', equipment: 'Bodyweight', youtube_query: 'the hundred pilates tutorial' },
  { name: 'Roll Up', category: 'Pilates', muscle_groups: 'Abs,Back', equipment: 'Bodyweight', youtube_query: 'roll up pilates tutorial' },
  { name: 'Single Leg Stretch', category: 'Pilates', muscle_groups: 'Core,Abs', equipment: 'Bodyweight', youtube_query: 'single leg stretch pilates' },
  { name: 'Double Leg Stretch', category: 'Pilates', muscle_groups: 'Core,Abs', equipment: 'Bodyweight', youtube_query: 'double leg stretch pilates' },
  { name: 'Criss Cross', category: 'Pilates', muscle_groups: 'Obliques,Abs', equipment: 'Bodyweight', youtube_query: 'criss cross pilates tutorial' },
  { name: 'Spine Stretch', category: 'Pilates', muscle_groups: 'Back,Hamstrings', equipment: 'Bodyweight', youtube_query: 'spine stretch pilates' },
  { name: 'Swan', category: 'Pilates', muscle_groups: 'Back,Glutes', equipment: 'Bodyweight', youtube_query: 'swan pilates exercise tutorial' },
  { name: 'Side-Lying Leg Lift', category: 'Pilates', muscle_groups: 'Glutes,Abductors', equipment: 'Bodyweight', youtube_query: 'side lying leg lift pilates' },
  { name: 'Shoulder Bridge', category: 'Pilates', muscle_groups: 'Glutes,Hamstrings,Core', equipment: 'Bodyweight', youtube_query: 'shoulder bridge pilates tutorial' },
  { name: 'Teaser', category: 'Pilates', muscle_groups: 'Full Core', equipment: 'Bodyweight', youtube_query: 'teaser pilates tutorial' },
  // BodyCombat
  { name: 'Jab-Cross Combo', category: 'BodyCombat', muscle_groups: 'Full Body,Shoulders', equipment: 'Bodyweight', youtube_query: 'jab cross boxing combo tutorial' },
  { name: 'Hook-Uppercut Combo', category: 'BodyCombat', muscle_groups: 'Full Body,Shoulders', equipment: 'Bodyweight', youtube_query: 'hook uppercut boxing combo' },
  { name: 'Front Kick', category: 'BodyCombat', muscle_groups: 'Legs,Core', equipment: 'Bodyweight', youtube_query: 'front kick technique tutorial' },
  { name: 'Roundhouse Kick', category: 'BodyCombat', muscle_groups: 'Legs,Core,Hips', equipment: 'Bodyweight', youtube_query: 'roundhouse kick tutorial' },
  { name: 'Knee Strike', category: 'BodyCombat', muscle_groups: 'Legs,Core', equipment: 'Bodyweight', youtube_query: 'muay thai knee strike tutorial' },
  { name: 'Capoeira Ginga', category: 'BodyCombat', muscle_groups: 'Full Body,Legs', equipment: 'Bodyweight', youtube_query: 'capoeira ginga tutorial' },
  { name: 'Power Block', category: 'BodyCombat', muscle_groups: 'Full Body', equipment: 'Bodyweight', youtube_query: 'bodycombat power training' },
  { name: 'Athletic Conditioning', category: 'BodyCombat', muscle_groups: 'Full Body', equipment: 'Bodyweight', youtube_query: 'bodycombat athletic conditioning' },
  { name: 'Lower Body Combat', category: 'BodyCombat', muscle_groups: 'Legs,Glutes,Core', equipment: 'Bodyweight', youtube_query: 'bodycombat lower body training' },
  { name: 'Core Combat', category: 'BodyCombat', muscle_groups: 'Core,Abs,Obliques', equipment: 'Bodyweight', youtube_query: 'bodycombat core workout' },
  // Chair Yoga — seated/supported poses for limited mobility
  { name: 'Seated Mountain Pose', category: 'Chair Yoga', muscle_groups: 'Spine,Core', equipment: 'Chair', youtube_query: 'seated mountain pose chair yoga' },
  { name: 'Seated Cat-Cow', category: 'Chair Yoga', muscle_groups: 'Spine,Core', equipment: 'Chair', youtube_query: 'seated cat cow chair yoga tutorial' },
  { name: 'Seated Forward Fold', category: 'Chair Yoga', muscle_groups: 'Hamstrings,Back', equipment: 'Chair', youtube_query: 'seated forward fold chair yoga' },
  { name: 'Seated Spinal Twist', category: 'Chair Yoga', muscle_groups: 'Spine,Obliques', equipment: 'Chair', youtube_query: 'seated spinal twist chair yoga' },
  { name: 'Seated Side Stretch', category: 'Chair Yoga', muscle_groups: 'Obliques,Lats', equipment: 'Chair', youtube_query: 'seated side stretch chair yoga' },
  { name: 'Seated Figure Four', category: 'Chair Yoga', muscle_groups: 'Hips,Glutes,Piriformis', equipment: 'Chair', youtube_query: 'seated figure four hip stretch chair yoga' },
  { name: 'Chair Tree Pose', category: 'Chair Yoga', muscle_groups: 'Legs,Core,Balance', equipment: 'Chair', youtube_query: 'chair tree pose yoga balance' },
  { name: 'Seated Neck Rolls', category: 'Chair Yoga', muscle_groups: 'Neck,Upper Traps', equipment: 'Chair', youtube_query: 'seated neck rolls chair yoga' },
  { name: 'Seated Shoulder Rolls', category: 'Chair Yoga', muscle_groups: 'Shoulders,Upper Back', equipment: 'Chair', youtube_query: 'seated shoulder rolls chair yoga' },
  { name: 'Chair Warrior I', category: 'Chair Yoga', muscle_groups: 'Hips,Legs,Shoulders', equipment: 'Chair', youtube_query: 'chair warrior one yoga pose' },
  { name: 'Chair Warrior II', category: 'Chair Yoga', muscle_groups: 'Hips,Legs,Shoulders', equipment: 'Chair', youtube_query: 'chair warrior two yoga pose' },
  { name: 'Seated Savasana', category: 'Chair Yoga', muscle_groups: 'Full Body', equipment: 'Chair', youtube_query: 'seated savasana chair yoga relaxation' },
  // Chair Pilates — seated/supported core and mobility for limited mobility
  { name: 'Seated Pelvic Tilt', category: 'Chair Pilates', muscle_groups: 'Core,Lower Back,Pelvic Floor', equipment: 'Chair', youtube_query: 'seated pelvic tilt chair pilates' },
  { name: 'Seated Spine Curl', category: 'Chair Pilates', muscle_groups: 'Spine,Abs', equipment: 'Chair', youtube_query: 'seated spine curl chair pilates' },
  { name: 'Seated Leg Lift', category: 'Chair Pilates', muscle_groups: 'Hip Flexors,Core,Quads', equipment: 'Chair', youtube_query: 'seated leg lift chair pilates' },
  { name: 'Seated Knee Extension', category: 'Chair Pilates', muscle_groups: 'Quads,Knee Joint', equipment: 'Chair', youtube_query: 'seated knee extension chair exercise' },
  { name: 'Seated Clam', category: 'Chair Pilates', muscle_groups: 'Glutes,Hip Abductors', equipment: 'Chair', youtube_query: 'seated clam exercise chair pilates' },
  { name: 'Seated Arm Circle', category: 'Chair Pilates', muscle_groups: 'Shoulders,Rotator Cuff', equipment: 'Chair', youtube_query: 'seated arm circle pilates shoulder mobility' },
  { name: 'Seated Side Bend Pilates', category: 'Chair Pilates', muscle_groups: 'Obliques,Core', equipment: 'Chair', youtube_query: 'seated side bend pilates chair' },
  { name: 'Seated Chest Opener', category: 'Chair Pilates', muscle_groups: 'Chest,Shoulders,Posture', equipment: 'Chair', youtube_query: 'seated chest opener chair pilates posture' },
  { name: 'Seated Glute Squeeze', category: 'Chair Pilates', muscle_groups: 'Glutes', equipment: 'Chair', youtube_query: 'seated glute squeeze activation exercise' },
  { name: 'Seated Hip Circle', category: 'Chair Pilates', muscle_groups: 'Hips,Lower Back', equipment: 'Chair', youtube_query: 'seated hip circle mobility exercise' },
  { name: 'Seated Hundred', category: 'Chair Pilates', muscle_groups: 'Core,Abs', equipment: 'Chair', youtube_query: 'seated hundred pilates chair modification' },
  { name: 'Supported Standing Leg Lift', category: 'Chair Pilates', muscle_groups: 'Glutes,Hip Abductors,Balance', equipment: 'Chair', youtube_query: 'standing leg lift chair support pilates' },
];
