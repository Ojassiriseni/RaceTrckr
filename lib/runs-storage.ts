import AsyncStorage from '@react-native-async-storage/async-storage';

const runsKey = (userId: string) => `racetrckr_runs_${userId}`;

export type RaceRun = {
  id: string;
  route: string;
  finalTimeSec: number;
  avgSpeedKmh: number;
  bestSpeedKmh: number;
  finishedAt: number;
  mode?: 'sprint' | 'lap';
  lapCount?: number;
  lapTimesSec?: number[];
  bestLapSec?: number;
};

const MAX_RUNS = 500;

export async function getRuns(userId: string): Promise<RaceRun[]> {
  const raw = await AsyncStorage.getItem(runsKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendRun(
  userId: string,
  run: Omit<RaceRun, 'id'> & { id?: string }
): Promise<void> {
  const runs = await getRuns(userId);
  const id =
    run.id ??
    `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  runs.unshift({
    id,
    route: run.route,
    finalTimeSec: run.finalTimeSec,
    avgSpeedKmh: run.avgSpeedKmh,
    bestSpeedKmh: run.bestSpeedKmh,
    finishedAt: run.finishedAt,
    ...(run.mode ? { mode: run.mode } : {}),
    ...(run.lapCount != null ? { lapCount: run.lapCount } : {}),
    ...(run.lapTimesSec ? { lapTimesSec: run.lapTimesSec } : {}),
    ...(run.bestLapSec != null ? { bestLapSec: run.bestLapSec } : {})
  });
  await AsyncStorage.setItem(
    runsKey(userId),
    JSON.stringify(runs.slice(0, MAX_RUNS))
  );
}

export function buildExportPayload(email: string, runs: RaceRun[]) {
  return {
    app: 'RaceTrckr',
    exportedAt: new Date().toISOString(),
    userEmail: email,
    runCount: runs.length,
    runs
  };
}
