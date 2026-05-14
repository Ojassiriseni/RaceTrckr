import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  clampRaceSettings,
  DEFAULT_RACE_SETTINGS,
  loadRaceSettings,
  saveRaceSettings,
  type RaceSettings
} from '@/lib/race-settings';

type RaceSettingsContextValue = {
  settings: RaceSettings;
  updateSettings: (partial: Partial<RaceSettings>) => void;
  resetToDefaults: () => void;
};

const RaceSettingsContext = createContext<RaceSettingsContextValue | null>(null);

export function RaceSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RaceSettings>(DEFAULT_RACE_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    loadRaceSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<RaceSettings>) => {
    setSettings((prev) => {
      const next = clampRaceSettings({ ...prev, ...partial });
      void saveRaceSettings(next);
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const next = { ...DEFAULT_RACE_SETTINGS };
    void saveRaceSettings(next);
    setSettings(next);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetToDefaults }),
    [settings, updateSettings, resetToDefaults]
  );

  return (
    <RaceSettingsContext.Provider value={value}>
      {children}
    </RaceSettingsContext.Provider>
  );
}

export function useRaceSettings() {
  const ctx = useContext(RaceSettingsContext);
  if (!ctx) throw new Error('useRaceSettings must be used within RaceSettingsProvider');
  return ctx;
}
