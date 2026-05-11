import {
  initialize,
  requestPermission,
  openHealthConnectSettings,
  getGrantedPermissions,
  readRecords,
  aggregateRecord,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'TotalCaloriesBurned' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'BodyFat' },
];

async function ensureInitialized() {
  const status = await getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
    throw new Error('Health Connect not available on this device');
  }
  await initialize();
}

export async function initHealthConnect() {
  try {
    await ensureInitialized();
    return { available: true };
  } catch (e) {
    return { available: false, reason: e.message };
  }
}

// On Android 14+ requestPermission returns empty immediately (platform behaviour).
// Falls back to HC settings; AppState listener handles permission check on resume.
export async function requestHealthPermissions() {
  await ensureInitialized();
  let result = [];
  try {
    result = await requestPermission(PERMISSIONS) || [];
  } catch {}
  if (result.length === 0) {
    openHealthConnectSettings();
  }
  return result;
}

// Safe to call anytime — checks already-granted permissions without a dialog
export async function checkHealthPermissions() {
  try {
    await ensureInitialized();
    const granted = await getGrantedPermissions();
    return granted.length > 0;
  } catch {
    return false;
  }
}

// Rolling window — for weight/body fat lookbacks
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

// Midnight-to-now — for "today" stats so we don't bleed yesterday's data
function todayTimeRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    operator: 'between',
    startTime: start.toISOString(),
    endTime: new Date().toISOString(),
  };
}

// Samsung Health package — filter to prevent double-counting with other HC sources
const SAMSUNG_HEALTH = ['com.sec.android.app.shealth'];

export async function getTodaySteps() {
  try {
    const result = await aggregateRecord({ recordType: 'Steps', timeRangeFilter: todayTimeRange(), dataOriginFilter: SAMSUNG_HEALTH });
    return result.COUNT_TOTAL ?? null;
  } catch { return null; }
}

export async function getTodayCalories() {
  try {
    // ActiveCaloriesBurned matches Samsung Health's display; TotalCaloriesBurned includes BMR
    const active = await aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: todayTimeRange(), dataOriginFilter: SAMSUNG_HEALTH });
    if (active.ENERGY_TOTAL != null) return Math.round(active.ENERGY_TOTAL.inKilocalories);
    const total = await aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter: todayTimeRange(), dataOriginFilter: SAMSUNG_HEALTH });
    return total.ENERGY_TOTAL != null ? Math.round(total.ENERGY_TOTAL.inKilocalories) : null;
  } catch { return null; }
}

export async function getTodayDistance() {
  try {
    const result = await aggregateRecord({ recordType: 'Distance', timeRangeFilter: todayTimeRange(), dataOriginFilter: SAMSUNG_HEALTH });
    if (result.DISTANCE_TOTAL == null) return null;
    return Math.round(result.DISTANCE_TOTAL.inMeters / 10) / 100; // km, 2dp
  } catch { return null; }
}

export async function getLatestHeartRate() {
  try {
    const { records } = await readRecords('HeartRate', { timeRangeFilter: timeRange(1) });
    if (!records.length) return null;
    // Sort by time descending, take the most recent sample
    const sorted = [...records].sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    const samples = sorted[0]?.samples || [];
    if (!samples.length) return null;
    return Math.round(samples[samples.length - 1].beatsPerMinute);
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

export async function getWeightHistory(days = 365) {
  try {
    const { records } = await readRecords('Weight', { timeRangeFilter: timeRange(days) });
    return records.map(r => ({
      date: r.time.substring(0, 10),
      time: r.time,
      weight_kg: Math.round(r.weight.inKilograms * 10) / 10,
    })).sort((a, b) => a.time.localeCompare(b.time));
  } catch { return []; }
}

export async function getBodyFatHistory(days = 365) {
  try {
    const { records } = await readRecords('BodyFat', { timeRangeFilter: timeRange(days) });
    return records.map(r => ({
      date: r.time.substring(0, 10),
      time: r.time,
      body_fat_pct: Math.round(r.percentage * 10) / 10,
    })).sort((a, b) => a.time.localeCompare(b.time));
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
