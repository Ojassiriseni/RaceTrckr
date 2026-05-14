import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'racetrckr_race_settings_v1';

export type RaceSettings = {
  /** Sprint: distance (m) to start line / lap map: green zone size hint */
  startRadiusM: number;
  /** Sprint: finish line trigger distance (m) */
  endRadiusM: number;
  /** Lap mode: distance (m) to count as “inside” the line */
  lapInnerRadiusM: number;
  /** Lap mode: must be farther than this (m) to count as “outside” (hysteresis) */
  lapOuterRadiusM: number;
};

export const DEFAULT_RACE_SETTINGS: RaceSettings = {
  startRadiusM: 120,
  endRadiusM: 120,
  lapInnerRadiusM: 105,
  lapOuterRadiusM: 155
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function clampRaceSettings(input: RaceSettings): RaceSettings {
  let startRadiusM = clamp(Math.round(input.startRadiusM), 15, 400);
  let endRadiusM = clamp(Math.round(input.endRadiusM), 15, 400);
  let lapInnerRadiusM = clamp(Math.round(input.lapInnerRadiusM), 15, 300);
  let lapOuterRadiusM = clamp(Math.round(input.lapOuterRadiusM), 25, 500);

  if (lapOuterRadiusM < lapInnerRadiusM + 20) {
    lapOuterRadiusM = lapInnerRadiusM + 20;
  }
  if (lapOuterRadiusM > 500) lapOuterRadiusM = 500;

  return {
    startRadiusM,
    endRadiusM,
    lapInnerRadiusM,
    lapOuterRadiusM
  };
}

export async function loadRaceSettings(): Promise<RaceSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RACE_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<RaceSettings>;
    const merged: RaceSettings = {
      ...DEFAULT_RACE_SETTINGS,
      ...parsed
    };
    return clampRaceSettings(merged);
  } catch {
    return { ...DEFAULT_RACE_SETTINGS };
  }
}

export async function saveRaceSettings(settings: RaceSettings): Promise<void> {
  const c = clampRaceSettings(settings);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}
