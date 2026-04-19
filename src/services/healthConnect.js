import {
  initialize,
  openHealthConnectSettings,
  getGrantedPermissions,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'BodyFat' },
];

let _initialized = false;

export async function initHealthConnect() {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      return { available: false, reason: 'Health Connect not available' };
    }
    await initialize();
    _initialized = true;
    return { available: true };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

// Opens Health Connect settings so user can grant permissions manually.
// Call only from a user interaction. After user returns to app, call checkHealthPermissions().
export async function requestHealthPermissions() {
  if (!_initialized) await initHealthConnect();
  openHealthConnectSettings();
}

// Safe to call anytime — checks already-granted permissions without a dialog
export async function checkHealthPermissions() {
  if (!_initialized) {
    const r = await initHealthConnect();
    if (!r.available) return false;
  }
  try {
    const granted = await getGrantedPermissions();
    return granted.length > 0;
  } catch {
    return false;
  }
}

function timeRange(daysBack = 1) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return {
    operator: 'between',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

export async function getTodaySteps() {
  try {
    const { records } = await readRecords('Steps', { timeRangeFilter: timeRange(1) });
    return records.reduce((sum, r) => sum + (r.count || 0), 0);
  } catch { return null; }
}

export async function getTodayCalories() {
  try {
    const { records } = await readRecords('ActiveCaloriesBurned', { timeRangeFilter: timeRange(1) });
    return Math.round(records.reduce((sum, r) => sum + (r.energy?.inKilocalories || 0), 0));
  } catch { return null; }
}

export async function getTodayDistance() {
  try {
    const { records } = await readRecords('Distance', { timeRangeFilter: timeRange(1) });
    const metres = records.reduce((sum, r) => sum + (r.distance?.inMeters || 0), 0);
    return Math.round(metres / 10) / 100; // km, 2dp
  } catch { return null; }
}

export async function getLatestHeartRate() {
  try {
    const { records } = await readRecords('HeartRate', { timeRangeFilter: timeRange(1) });
    if (!records.length) return null;
    const all = records.flatMap(r => r.samples || []);
    if (!all.length) return null;
    return Math.round(all.reduce((s, r) => s + r.beatsPerMinute, 0) / all.length);
  } catch { return null; }
}

export async function getLatestWeight() {
  try {
    const { records } = await readRecords('Weight', { timeRangeFilter: timeRange(90) });
    if (!records.length) return null;
    const latest = records.sort((a, b) => new Date(b.time) - new Date(a.time))[0];
    return Math.round(latest.weight.inKilograms * 10) / 10;
  } catch { return null; }
}

export async function getLatestBodyFat() {
  try {
    const { records } = await readRecords('BodyFat', { timeRangeFilter: timeRange(90) });
    if (!records.length) return null;
    const latest = records.sort((a, b) => new Date(b.time) - new Date(a.time))[0];
    return Math.round(latest.percentage * 10) / 10;
  } catch { return null; }
}

export async function getRecentExerciseSessions(days = 7) {
  try {
    const { records } = await readRecords('ExerciseSession', { timeRangeFilter: timeRange(days) });
    return records.map(r => ({
      id: r.metadata?.id,
      title: r.title || r.exerciseType,
      startTime: r.startTime,
      endTime: r.endTime,
      durationMins: Math.round((new Date(r.endTime) - new Date(r.startTime)) / 60000),
    }));
  } catch { return []; }
}

export async function getDashboardData() {
  const [steps, calories, distance, heartRate] = await Promise.all([
    getTodaySteps(),
    getTodayCalories(),
    getTodayDistance(),
    getLatestHeartRate(),
  ]);
  return { steps, calories, distance, heartRate };
}
