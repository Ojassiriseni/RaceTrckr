import AsyncStorage from '@react-native-async-storage/async-storage';

import { type LocalLeaderboardRecord } from '@/lib/race-completion';
import { getRuns } from '@/lib/runs-storage';
import { supabase } from '@/lib/supabase';

export type LeaderboardScope = 'global' | 'friends' | 'nearby';
export type LeaderboardRange = 'all' | 'week' | 'today';

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string;
  vehicle: string;
  route: string;
  bestTime: number;
  deltaFromFirst: number;
  positionChange: number;
  avatar: string;
};

const LOCAL_LEADERBOARD_KEY = 'racetrckr_global_leaderboard_v1';

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

function normalizeDisplayName(value?: string) {
  if (!value) return 'Driver';
  return value.trim() || 'Driver';
}

export async function getAvailableRoutes(): Promise<string[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('routes').select('route_name');
      if (!error && Array.isArray(data)) {
        const names = data
          .map((row) => row.route_name)
          .filter((value): value is string => Boolean(value));
        if (names.length) return [...new Set(names)].sort();
      }
    } catch {
      // Fall back to the local cache below.
    }
  }

  const records = await readLocalLeaderboard();
  const names = records.map((record) => record.route).filter(Boolean);
  return Array.from(new Set(names)).sort();
}

export async function getLeaderboardEntries(options: {
  route?: string;
  scope?: LeaderboardScope;
  range?: LeaderboardRange;
  userId?: string;
} = {}): Promise<LeaderboardEntry[]> {
  const route = options.route ?? '';
  const scope = options.scope ?? 'global';
  const range = options.range ?? 'all';

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('races')
        .select('id,user_id,total_time,completed_at,route_id,profiles(username,display_name)')
        .eq('is_valid', true)
        .order('total_time', { ascending: true });

      if (!error && Array.isArray(data)) {
        const rows = data.map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return {
            userId: row.user_id,
            username: profile?.username ?? profile?.display_name ?? 'Driver',
            vehicle: 'Vehicle',
            route: row.route_id ? 'Route record' : 'Selected route',
            bestTime: Number(row.total_time) || 0,
            avatar: 'D',
          };
        });

        const filtered = rows.filter((row) => {
          if (scope === 'friends') return row.userId === options.userId || row.userId === 'local-user';
          if (scope === 'nearby') return row.userId === options.userId || row.userId === 'local-user';
          return true;
        });

        if (range === 'today') {
          return filtered.filter((row) => row.bestTime > 0).slice(0, 25).map((row, index) => ({
            ...row,
            rank: index + 1,
            deltaFromFirst: index === 0 ? 0 : row.bestTime - filtered[0].bestTime,
            positionChange: 0,
          }));
        }

        if (route) {
          return filtered.filter((row) => row.route === route).slice(0, 25).map((row, index) => ({
            ...row,
            rank: index + 1,
            deltaFromFirst: index === 0 ? 0 : row.bestTime - filtered[0].bestTime,
            positionChange: 0,
          }));
        }

        return filtered.slice(0, 25).map((row, index) => ({
          ...row,
          rank: index + 1,
          deltaFromFirst: index === 0 ? 0 : row.bestTime - filtered[0].bestTime,
          positionChange: 0,
        }));
      }
    } catch {
      // Continue to the local fallback below.
    }
  }

  const records = await readLocalLeaderboard();
  const visible = records.filter((record) => {
    if (scope === 'friends') return record.userId === options.userId || record.userId === 'local-user';
    if (scope === 'nearby') return record.userId === options.userId || record.userId === 'local-user';
    return true;
  });

  const routeFiltered = route
    ? visible.filter((record) => record.route === route)
    : visible;

  const byUser = new Map<string, LocalLeaderboardRecord>();

  for (const record of routeFiltered) {
    const current = byUser.get(record.userId);
    if (!current || record.finalTimeSec < current.finalTimeSec) {
      byUser.set(record.userId, record);
    }
  }

  const sorted = Array.from(byUser.values())
    .filter((record) => {
      if (range === 'today') {
        return Date.now() - record.finishedAt <= 24 * 60 * 60 * 1000;
      }
      if (range === 'week') {
        return Date.now() - record.finishedAt <= 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    })
    .sort((a, b) => a.finalTimeSec - b.finalTimeSec);

  const first = sorted[0]?.finalTimeSec ?? 0;

  return sorted.map((record, index) => ({
    rank: index + 1,
    userId: record.userId,
    username: normalizeDisplayName(record.email?.split('@')[0] ?? record.vehicle ?? 'Driver'),
    vehicle: record.vehicle ?? 'Vehicle',
    route: record.route,
    bestTime: record.finalTimeSec,
    deltaFromFirst: index === 0 ? 0 : record.finalTimeSec - first,
    positionChange: 0,
    avatar: (record.email ?? 'D').charAt(0).toUpperCase(),
  }));
}

export async function getPersonalBest(route?: string): Promise<number | null> {
  const uniqueUserId = 'local-user';
  const records = await readLocalLeaderboard();

  const filtered = records.filter((record) => {
    if (route && record.route !== route) return false;
    return record.userId === uniqueUserId || record.userId === 'local-user';
  });

  if (!filtered.length) {
    const allRuns = await getRuns(uniqueUserId);
    if (!allRuns.length) return null;
    const value = Math.min(...allRuns.map((run) => run.finalTimeSec));
    return Number.isFinite(value) ? value : null;
  }

  const best = Math.min(...filtered.map((record) => record.finalTimeSec));
  return Number.isFinite(best) ? best : null;
}
