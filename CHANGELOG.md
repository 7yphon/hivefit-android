# Changelog

All notable changes to HiveFit are documented here.

---

## [1.0.0] — 2026-04-19

Phase 1 complete. Full workout logging, PR tracking, body metrics, Health Connect integration, multi-user profiles, and OpenHive auth.

### Added
- **Workout logging** — create workouts, log sets (weight/reps/RPE), rest timer with vibration, live elapsed timer, PR flash banner, workout notes, long-press to delete sets
- **Workout history** — grouped by month, detail view, navigation to any past session
- **PR tracking** — PR board per exercise (Epley 1RM), per-exercise progress screen with rep-count grid and session history, YouTube form link
- **Body metrics** — manual entry and Health Connect sync; weight, body fat %, muscle mass, BMR, BMI, visceral fat; history with source tracking
- **Health Connect integration** — steps, calories (total + active fallback), distance, heart rate, weight, body fat, exercise sessions; dashboard card on Home screen
- **Pull-to-refresh** and auto-refresh on app foreground resume for Health Connect data
- **Health Connect re-auth** — More screen button to open HC settings and re-grant permissions; AppState listener detects grant on return
- **Multi-user profiles** — separate profiles with avatar colors, active user picker, per-profile data isolation
- **OpenHive auth** — optional per-profile login to OpenHive; token stored in SecureStore per user
- **Exercise library** — 38 seed exercises, category filter, search, custom exercise creation
- **Plate calculator** — barbell preset selector, target weight, visual plate stack with IWF standard colors
- **Dark amber theme** — matches OpenHive color palette (`#f59e0b` primary, near-black background)
- **Error boundary** — catches render errors with fallback UI
- **Bottom tab navigation** — Home / Workout / Progress / Body / More with nested stacks

### Fixed
- Health Connect permission dialog not appearing on Samsung Galaxy A54 (Android 14+) — patched `HealthConnectPermissionDelegate` to dispatch `ActivityResultLauncher.launch()` on main thread via `withContext(Dispatchers.Main)`
- Health Connect using wrong provider contract on Android 14+ — switched to no-arg `createRequestPermissionResultContract()` for framework-integrated Health Connect
- `lateinit property requestPermission has not been initialized` crash — added `setPermissionDelegate(this)` to `MainActivity.onCreate()`
- HiveFit not appearing in Health Connect app list — added `VIEW_PERMISSION_USAGE` + `HEALTH_PERMISSIONS` intent filter to `MainActivity` per Android Health Connect codelab
- Calories reading zero from Samsung Health — added `READ_TOTAL_CALORIES_BURNED` permission (Samsung Health writes `TotalCaloriesBurned`, not `ActiveCaloriesBurned`)
- `requestHealthPermissions()` hanging indefinitely — removed `Linking.sendIntent` (promise could hang); simplified to `openHealthConnectSettings()` with AppState resume handling
- Safe area insets on devices with notch/cutout
- SQLite WAL mode and synchronous open for stability

### Technical
- `patch-package` applied via `postinstall` to persist native module fix across `npm install`
- `minSdkVersion` hardcoded to 26 (Health Connect minimum)
- `READ_HEALTH_DATA_HISTORY` manifest permission for body metric history older than 30 days
- All data local-first (SQLite) — no cloud sync in Phase 1
- 1RM consistent across all features using Epley formula
- Per-user token security: SecureStore with `openhive_token_<userId>` keys, never in SQLite
