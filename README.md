# HiveFit

Personal fitness tracking app for Android. Built for logging strength workouts, tracking PRs, monitoring body metrics, and reading activity data from Samsung Health via Android Health Connect.

Multi-user — Chris and Mel run separate profiles on the same device.

---

## Features

### Workout Logging
- Create named workouts (strength / martial arts)
- Log sets with weight, reps, and RPE
- Live elapsed timer + configurable rest timer with vibration
- PR detection with flash banner on new personal records
- Long-press to delete sets; workout notes
- Full workout history grouped by month
- Workout detail view (read-only)

### PR Tracking
- PR board showing best set per exercise (by estimated 1RM)
- Per-exercise progress view: PR grid by rep count + session history
- YouTube form link shortcut per exercise
- Epley formula for 1RM estimates: `weight × (1 + reps / 30)`

### Body Metrics
- Manual entry or sync from Health Connect (weight + body fat)
- Metrics grid: weight, body fat %, muscle mass, BMR, BMI, visceral fat
- History: last 20 entries with date, source, and values

### Health Connect Integration
- Reads from Samsung Health via Android Health Connect
- Dashboard data (today): steps, calories burned, distance, heart rate
- Body metrics sync: weight and body fat (up to 90 days history)
- Exercise sessions (last 7 days)
- Pull-to-refresh and auto-refresh on app foreground resume
- Permission management via More screen re-auth button

### Home Dashboard
- Greeting + active user avatar
- Quick stats: sessions this week, latest weight, latest body fat
- Health Connect today card: steps / kcal / km / bpm
- Top 3 PRs
- 5 most recent workouts

### Multi-User
- Multiple profiles on one device
- Per-profile avatar color
- Active user picker from home screen
- Optional per-profile OpenHive account link

### Other
- Plate calculator (barbell presets + visual plate stack with IWF colors)
- Exercise library with search, category filter, and custom exercise creation

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native 0.81.5 / Expo SDK ~54 |
| State | Zustand 5 |
| Database | expo-sqlite v16 (WAL mode, synchronous open) |
| Secure storage | expo-secure-store |
| Health | react-native-health-connect v3.5.0 |
| Charts | react-native-gifted-charts |
| Navigation | @react-navigation/bottom-tabs + native-stack v7 |
| Engine | Hermes |

Android-only. Bare workflow (no Expo Go).

---

## Requirements

- Android API 26+ (Android 8.0)
- Health Connect — built into Android 14+; available as standalone app on Android 13
- Samsung Health (or any Health Connect-compatible app) for activity data

---

## Building

### Prerequisites
- Node 20+
- Java 21 (Gradle does not support Java 25+)
- Android SDK with platform-tools (adb)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Bundle JS
```bash
npx expo export:embed \
  --platform android \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res \
  --dev false
```

### Step 3 — Build APK
```bash
cd android
JAVA_HOME=/path/to/jdk-21 ./gradlew assembleDebug
```

### Step 4 — Install
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Health Connect Setup

HiveFit declares the following Health Connect permissions:

| Permission | Used for |
|---|---|
| READ_STEPS | Daily step count |
| READ_DISTANCE | Daily distance (km) |
| READ_HEART_RATE | Average heart rate |
| READ_TOTAL_CALORIES_BURNED | Daily calories (Samsung Health primary) |
| READ_ACTIVE_CALORIES_BURNED | Daily calories (fallback) |
| READ_EXERCISE | Exercise session history |
| READ_WEIGHT | Body weight sync |
| READ_BODY_FAT | Body fat % sync |
| READ_HEALTH_DATA_HISTORY | Historical data older than 30 days |

Grant permissions via **More → Health Connect** or through the Health Connect app directly.

### Android 14+ note
On Android 14+, `requestPermission()` returns immediately without showing a dialog (platform behaviour). HiveFit falls back to opening Health Connect settings, where you grant permissions manually. The app detects the grant on return via `AppState`.

### patch-package
`react-native-health-connect` v3.5.0 includes a patched native module (`patches/react-native-health-connect+3.5.0.patch`) that:
- Dispatches `ActivityResultLauncher.launch()` on the main thread (fixes silent empty return on Samsung devices)
- Uses the no-arg `createRequestPermissionResultContract()` on Android 14+ (framework-integrated Health Connect)

The patch is applied automatically via `postinstall`.

---

## Project Structure

```
hivefit/
├── App.js                    # Root: DB init, loading state, ErrorBoundary
├── index.js                  # Entry point
├── app.json                  # Expo config (package: com.hivefit)
├── patches/                  # patch-package patches
├── src/
│   ├── screens/
│   │   ├── Home/HomeScreen.js
│   │   ├── Workout/
│   │   │   ├── WorkoutListScreen.js
│   │   │   ├── ActiveWorkoutScreen.js
│   │   │   ├── ExerciseLibraryScreen.js
│   │   │   ├── WorkoutDetailScreen.js
│   │   │   └── PlateCalculatorScreen.js
│   │   ├── Progress/
│   │   │   ├── ProgressScreen.js
│   │   │   └── ExerciseProgressScreen.js
│   │   ├── Body/BodyScreen.js
│   │   └── More/
│   │       ├── MoreScreen.js
│   │       └── ProfileSettingsScreen.js
│   ├── store/
│   │   ├── userStore.js
│   │   └── workoutStore.js
│   ├── services/
│   │   ├── auth.js           # Per-profile OpenHive token (SecureStore)
│   │   └── healthConnect.js  # Health Connect data layer
│   ├── database/
│   │   ├── db.js             # All SQLite operations
│   │   └── schema.js         # CREATE TABLE + 38 seed exercises
│   ├── components/
│   │   ├── Screen.js         # Screen, Header, Card, Button, Pill
│   │   └── ErrorBoundary.js
│   ├── navigation/
│   │   └── AppNavigator.js   # Bottom tabs + nested stacks
│   ├── theme/
│   │   └── index.js          # colors, spacing, font, radius tokens
│   └── utils/
│       └── fitness.js        # estimate1RM, calculatePlates, formatDuration
└── android/
    └── app/src/main/
        ├── AndroidManifest.xml
        ├── java/.../MainActivity.kt
        └── java/.../MainApplication.kt
```

---

## Roadmap

- [ ] Phase 2: Write workout sessions back to Health Connect
- [ ] Phase 2: OpenHive palace file sync (workout summaries → local AI)
- [ ] Phase 3: AI chat shortcut from workout summary screen
- [ ] Phase 3: Food photo → calorie estimate via OpenHive image pipeline
- [ ] Play Store release (production keystore + signed APK)
