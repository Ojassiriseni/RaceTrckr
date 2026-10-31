import { supabase } from '@/lib/supabase';

export type ProfileRecord = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
};

export type VehicleRecord = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number | null;
  nickname: string | null;
  image_url: string | null;
  created_at: string;
};

export type RouteRecord = {
  id: string;
  creator_id: string;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number | null;
  route_geometry: Record<string, unknown> | null;
  created_at: string;
};

export type RaceSubmissionRecord = {
  id: string;
  user_id: string;
  route_id: string | null;
  vehicle_id: string | null;
  total_time: number;
  average_speed: number | null;
  max_speed: number | null;
  distance: number | null;
  completed_at: string;
  is_valid: boolean;
  created_at: string;
};

export type RaceParticipantRecord = {
  id: string;
  race_id: string;
  user_id: string;
  finish_time: number | null;
  status: string;
  created_at: string;
};

export type LapRecord = {
  id: string;
  race_id: string;
  user_id: string;
  lap_number: number;
  lap_time: number;
  sector_times: unknown;
  created_at: string;
};

export type GhostReplayRecord = {
  id: string;
  race_id: string;
  user_id: string;
  storage_path: string;
  created_at: string;
};

export type FriendshipRecord = {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
};

export type ChallengeRecord = {
  id: string;
  creator_id: string;
  opponent_id: string;
  route_id: string;
  status: string;
  created_at: string;
};

const ensureClient = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
};

function buildDefaultUsername(email: string) {
  const local = email.split('@')[0]?.trim().toLowerCase() || 'driver';
  return `${local}_${Date.now().toString(36)}`;
}

export async function ensureProfile(userId: string, email: string, overrides?: Partial<ProfileRecord>) {
  const client = ensureClient();
  const username = overrides?.username ?? buildDefaultUsername(email);
  const displayName = overrides?.display_name ?? username;

  const { data, error } = await client
    .from('profiles')
    .upsert(
      {
        id: userId,
        username,
        display_name: displayName,
        avatar_url: overrides?.avatar_url ?? null,
        bio: overrides?.bio ?? null,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as ProfileRecord;
}

export async function getProfile(userId: string) {
  const client = ensureClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRecord | null;
}

export async function saveVehicle(userId: string, input: Partial<VehicleRecord> & { make: string; model: string }, vehicleId?: string) {
  const client = ensureClient();
  const payload = {
    id: vehicleId,
    user_id: userId,
    make: input.make,
    model: input.model,
    year: input.year ?? null,
    nickname: input.nickname ?? null,
    image_url: input.image_url ?? null,
  };

  const { data, error } = await client
    .from('vehicles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data as VehicleRecord;
}

export async function getVehicles(userId: string) {
  const client = ensureClient();
  const { data, error } = await client.from('vehicles').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as VehicleRecord[];
}

export async function deleteVehicle(vehicleId: string) {
  const client = ensureClient();
  const { error } = await client.from('vehicles').delete().eq('id', vehicleId);
  if (error) throw error;
}

export async function saveRoute(input: Partial<RouteRecord> & { creator_id: string; route_name: string; start_location: string; end_location: string }, routeId?: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('routes')
    .upsert(
      {
        id: routeId,
        creator_id: input.creator_id,
        route_name: input.route_name,
        start_location: input.start_location,
        end_location: input.end_location,
        distance: input.distance ?? null,
        route_geometry: input.route_geometry ?? null,
      },
      { onConflict: 'creator_id,route_name' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as RouteRecord;
}

export async function getRoutes(userId?: string) {
  const client = ensureClient();
  let query = client.from('routes').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('creator_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RouteRecord[];
}

export async function getRouteByName(routeName: string, creatorId?: string) {
  const client = ensureClient();
  let query = client.from('routes').select('*').eq('route_name', routeName);
  if (creatorId) query = query.eq('creator_id', creatorId);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return (data && data[0]) as RouteRecord | undefined;
}

export async function saveRaceResult(input: {
  userId: string;
  routeId?: string | null;
  vehicleId?: string | null;
  routeName?: string;
  startLocation?: string;
  endLocation?: string;
  distanceKm?: number | null;
  totalTime: number;
  averageSpeed?: number | null;
  maxSpeed?: number | null;
  completedAt?: string | number | Date;
  isValid?: boolean;
  routeGeometry?: Record<string, unknown> | null;
  participants?: string[];
  lapEntries?: Array<{ lapNumber: number; lapTime: number; sectorTimes?: Record<string, unknown> | null }>;
  ghostReplayPath?: string;
}) {
  const client = ensureClient();

  let routeId = input.routeId ?? null;
  if (!routeId && input.routeName) {
    const routeRecord = await saveRoute(
      {
        creator_id: input.userId,
        route_name: input.routeName,
        start_location: input.startLocation ?? 'Start',
        end_location: input.endLocation ?? 'Finish',
        distance: input.distanceKm ?? null,
        route_geometry: input.routeGeometry ?? null,
      }
    );
    routeId = routeRecord.id;
  }

  const { data: race, error: raceError } = await client
    .from('races')
    .insert({
      route_id: routeId,
      user_id: input.userId,
      vehicle_id: input.vehicleId ?? null,
      total_time: input.totalTime,
      average_speed: input.averageSpeed ?? null,
      max_speed: input.maxSpeed ?? null,
      distance: input.distanceKm ?? null,
      completed_at: input.completedAt ? new Date(input.completedAt).toISOString() : new Date().toISOString(),
      is_valid: input.isValid ?? true,
    })
    .select('*')
    .single();

  if (raceError) throw raceError;

  const participantIds = (input.participants ?? [input.userId]).filter(Boolean);
  if (participantIds.length) {
    const participantRows = participantIds.map((personId) => ({
      race_id: race.id,
      user_id: personId,
      finish_time: personId === input.userId ? input.totalTime : null,
      status: personId === input.userId ? 'finished' : 'pending',
    }));

    const { error: participantError } = await client.from('race_participants').upsert(participantRows, {
      onConflict: 'race_id,user_id',
      ignoreDuplicates: false,
    });

    if (participantError) throw participantError;
  }

  if (input.lapEntries?.length) {
    const lapRows = input.lapEntries.map((lap) => ({
      race_id: race.id,
      user_id: input.userId,
      lap_number: lap.lapNumber,
      lap_time: lap.lapTime,
      sector_times: lap.sectorTimes ?? null,
    }));

    const { error: lapError } = await client.from('laps').upsert(lapRows, {
      onConflict: 'race_id,user_id,lap_number',
      ignoreDuplicates: false,
    });

    if (lapError) throw lapError;
  }

  if (input.ghostReplayPath) {
    const { error: replayError } = await client.from('ghost_replays').insert({
      race_id: race.id,
      user_id: input.userId,
      storage_path: input.ghostReplayPath,
    });

    if (replayError) throw replayError;
  }

  return race as RaceSubmissionRecord;
}

export async function getRaceResultsForUser(userId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('races')
    .select('*')
    .eq('user_id', userId)
    .eq('is_valid', true)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as RaceSubmissionRecord[];
}

export async function saveGhostReplay(raceId: string, userId: string, storagePath: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('ghost_replays')
    .insert({ race_id: raceId, user_id: userId, storage_path: storagePath })
    .select('*')
    .single();
  if (error) throw error;
  return data as GhostReplayRecord;
}

export async function getGhostReplays(raceId: string) {
  const client = ensureClient();
  const { data, error } = await client.from('ghost_replays').select('*').eq('race_id', raceId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GhostReplayRecord[];
}

export async function createFriendship(requesterId: string, receiverId: string, status = 'pending') {
  const client = ensureClient();
  const { data, error } = await client
    .from('friendships')
    .upsert(
      {
        requester_id: requesterId,
        receiver_id: receiverId,
        status,
      },
      { onConflict: 'requester_id,receiver_id' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data as FriendshipRecord;
}

export async function acceptFriendship(requesterId: string, receiverId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('requester_id', requesterId)
    .eq('receiver_id', receiverId)
    .select('*')
    .single();

  if (error) throw error;
  return data as FriendshipRecord;
}

export async function getFriendships(userId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('friendships')
    .select('*')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as FriendshipRecord[];
}

export async function createChallenge(input: { creatorId: string; opponentId: string; routeId: string; status?: string }) {
  const client = ensureClient();
  const { data, error } = await client
    .from('challenges')
    .insert({
      creator_id: input.creatorId,
      opponent_id: input.opponentId,
      route_id: input.routeId,
      status: input.status ?? 'pending',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as ChallengeRecord;
}

export async function getChallenges(userId: string) {
  const client = ensureClient();
  const { data, error } = await client
    .from('challenges')
    .select('*')
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ChallengeRecord[];
}

export async function updateProfile(userId: string, updates: Partial<Pick<ProfileRecord, 'username' | 'display_name' | 'avatar_url' | 'bio'>>) {
  const client = ensureClient();
  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data as ProfileRecord;
}
