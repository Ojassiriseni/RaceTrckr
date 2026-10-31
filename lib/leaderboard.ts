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

function buildVehicleLabel(row: {
  vehicles?: { nickname?: string | null; make?: string | null; model?: string | null } | null;
}) {
  const vehicle = row.vehicles;
  if (vehicle?.nickname) return vehicle.nickname;
  if (vehicle?.make || vehicle?.model) return `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim() || 'Vehicle';
  return 'Vehicle';
}

function isWithinRange(dateValue: string | null, range: LeaderboardRange) {
  if (!dateValue) return true;
  const then = new Date(dateValue).getTime();
  if (!Number.isFinite(then)) return true;
  const diffMs = Date.now() - then;
  if (range === 'today') return diffMs <= 24 * 60 * 60 * 1000;
  if (range === 'week') return diffMs <= 7 * 24 * 60 * 60 * 1000;
  return true;
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
      const { data: raceRows, error: raceError } = await supabase
        .from('races')
        .select('id,user_id,total_time,completed_at,route_id,distance,vehicles!races_vehicle_id_fkey(id,nickname,make,model),routes(id,route_name)')
        .eq('is_valid', true)
        .order('total_time', { ascending: true });

      if (!raceError && Array.isArray(raceRows)) {
        const profileIds = [...new Set(raceRows.map((row) => row.user_id).filter(Boolean))];
        const { data: profiles, error: profileError } = profileIds.length
          ? await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', profileIds)
          : { data: [], error: null };

        if (!profileError) {
          const profileLookup = new Map<string, { username?: string | null; display_name?: string | null; avatar_url?: string | null }>();
          for (const profile of profiles ?? []) {
            profileLookup.set(profile.id, profile);
          }

          let rows = raceRows
            .filter((row) => isWithinRange(row.completed_at, range))
            .map((row) => {
              const profile = profileLookup.get(row.user_id);
              const routeData = Array.isArray((row as any).routes) ? (row as any).routes[0] : (row as any).routes;
              const vehicleData = Array.isArray((row as any).vehicles) ? (row as any).vehicles[0] : (row as any).vehicles;
              const routeName = routeData?.route_name ?? route ?? 'Selected route';
              const username = profile?.username ?? profile?.display_name ?? 'Driver';
              return {
                userId: row.user_id,
                username: normalizeDisplayName(username),
                vehicle: buildVehicleLabel({ vehicles: vehicleData }),
                route: routeName,
                bestTime: Number(row.total_time) || 0,
                completedAt: row.completed_at,
                avatar: (profile?.display_name ?? profile?.username ?? 'D').charAt(0).toUpperCase(),
              };
            });

          if (scope === 'friends' && options.userId) {
            const { data: friendships, error: friendshipsError } = await supabase
              .from('friendships')
              .select('requester_id, receiver_id')
              .or(`requester_id.eq.${options.userId},receiver_id.eq.${options.userId}`)
              .eq('status', 'accepted');

            if (!friendshipsError && Array.isArray(friendships)) {
              const friendIds = new Set<string>([options.userId]);
              for (const item of friendships) {
                friendIds.add(item.requester_id);
                friendIds.add(item.receiver_id);
              }
              rows = rows.filter((row) => friendIds.has(row.userId));
            }
          }

          if (route) {
            rows = rows.filter((row) => row.route === route);
          }

          const deduped = new Map<string, { userId: string; username: string; vehicle: string; route: string; bestTime: number; avatar: string; }>();
          for (const row of rows) {
            const existing = deduped.get(row.userId);
            if (!existing || row.bestTime < existing.bestTime) {
              deduped.set(row.userId, row);
            }
          }

          const sorted = Array.from(deduped.values()).sort((a, b) => a.bestTime - b.bestTime);
          const first = sorted[0]?.bestTime ?? 0;

          return sorted.map((entry, index) => ({
            rank: index + 1,
            userId: entry.userId,
            username: entry.username,
            vehicle: entry.vehicle,
            route: entry.route,
            bestTime: entry.bestTime,
            deltaFromFirst: index === 0 ? 0 : entry.bestTime - first,
            positionChange: 0,
            avatar: entry.avatar,
          }));
        }
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
