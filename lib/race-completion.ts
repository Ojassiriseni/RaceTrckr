import AsyncStorage from '@react-native-async-storage/async-storage';

import { saveRaceResult } from '@/lib/supabase-data';
import { appendRun, type RaceRun } from '@/lib/runs-storage';
import { supabase } from '@/lib/supabase';

export type RaceCompletionPayload = {
  userId: string;
  email?: string;
  route: string;
  vehicle?: string;
  finalTimeSec: number;
  avgSpeedKmh: number;
  bestSpeedKmh: number;
  finishedAt: number;
  mode?: RaceRun['mode'];
  lapCount?: number;
  lapTimesSec?: number[];
  bestLapSec?: number;
  distanceKm?: number;
  routeId?: string;
  startLocation?: string;
  endLocation?: string;
  routeGeometry?: Record<string, unknown> | null;
  ghostReplayPath?: string;
};

export type LocalLeaderboardRecord = RaceCompletionPayload & {
  id: string;
  createdAt: number;
};

const LOCAL_LEADERBOARD_KEY = 'racetrckr_global_leaderboard_v1';
const PENDING_UPLOADS_KEY = 'racetrckr_pending_race_uploads_v1';

async function readLocalLeaderboard(): Promise<LocalLeaderboardRecord[]> {
  const raw = await AsyncStorage.getItem(LOCAL_LEADERBOARD_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLocalLeaderboard(records: LocalLeaderboardRecord[]) {
  await AsyncStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(records));
}

async function readPendingUploads(): Promise<RaceCompletionPayload[]> {
  const raw = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writePendingUploads(payload: RaceCompletionPayload[]) {
  await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(payload));
}

export async function saveLeaderboardRecord(payload: RaceCompletionPayload) {
  const records = await readLocalLeaderboard();
  const nextRecord: LocalLeaderboardRecord = {
    ...payload,
    id: `${payload.userId}-${payload.finishedAt}-${payload.route}`,
    createdAt: payload.finishedAt,
  };

  const next = [...records, nextRecord]
    .sort((a, b) => a.finalTimeSec - b.finalTimeSec)
    .slice(0, 500);

  await writeLocalLeaderboard(next);
}

async function queueRaceUpload(payload: RaceCompletionPayload) {
  const pending = await readPendingUploads();
  const next = [...pending, payload];
  await writePendingUploads(next);
}

export async function syncPendingRaceUploads() {
  if (!supabase) return;

  const pending = await readPendingUploads();
  if (!pending.length) return;

  const remaining: RaceCompletionPayload[] = [];

  for (const payload of pending) {
    try {
      await saveRaceResult({
        userId: payload.userId,
        routeId: payload.routeId ?? null,
        routeName: payload.route,
        startLocation: payload.startLocation,
        endLocation: payload.endLocation,
        distanceKm: payload.distanceKm ?? null,
        totalTime: payload.finalTimeSec,
        averageSpeed: payload.avgSpeedKmh,
        maxSpeed: payload.bestSpeedKmh,
        completedAt: payload.finishedAt,
        routeGeometry: payload.routeGeometry ?? null,
        ghostReplayPath: payload.ghostReplayPath,
        lapEntries: (payload.lapTimesSec ?? []).map((lapTime, index) => ({
          lapNumber: index + 1,
          lapTime,
          sectorTimes: null,
        })),
      });
    } catch {
      remaining.push(payload);
    }
  }

  await writePendingUploads(remaining);
}

export async function submitCompletedRace(payload: RaceCompletionPayload): Promise<{ ok: true; queuedLocally: boolean }> {
  await appendRun(payload.userId, {
    route: payload.route,
    finalTimeSec: payload.finalTimeSec,
    avgSpeedKmh: payload.avgSpeedKmh,
    bestSpeedKmh: payload.bestSpeedKmh,
    finishedAt: payload.finishedAt,
    mode: payload.mode,
    lapCount: payload.lapCount,
    lapTimesSec: payload.lapTimesSec,
    bestLapSec: payload.bestLapSec,
  });

  await saveLeaderboardRecord(payload);

  if (supabase && payload.userId) {
    try {
      await saveRaceResult({
        userId: payload.userId,
        routeId: payload.routeId ?? null,
        routeName: payload.route,
        startLocation: payload.startLocation,
        endLocation: payload.endLocation,
        distanceKm: payload.distanceKm ?? null,
        totalTime: payload.finalTimeSec,
        averageSpeed: payload.avgSpeedKmh,
        maxSpeed: payload.bestSpeedKmh,
        completedAt: payload.finishedAt,
        routeGeometry: payload.routeGeometry ?? null,
        ghostReplayPath: payload.ghostReplayPath,
        lapEntries: (payload.lapTimesSec ?? []).map((lapTime, index) => ({
          lapNumber: index + 1,
          lapTime,
          sectorTimes: null,
        })),
      });

      return { ok: true, queuedLocally: false };
    } catch {
      await queueRaceUpload(payload);
      return { ok: true, queuedLocally: true };
    }
  }

  return { ok: true, queuedLocally: true };
}
