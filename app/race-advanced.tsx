import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useRaceSettings } from '@/contexts/race-settings-context';
import { DEFAULT_RACE_SETTINGS } from '@/lib/race-settings';

function Field({
  label,
  hint,
  value,
  onChangeText
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#e2e8f0', fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>{hint}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholderTextColor="#475569"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 12,
          padding: 14,
          color: '#fff',
          fontSize: 16,
          borderWidth: 1,
          borderColor: '#334155'
        }}
      />
    </View>
  );
}

export default function RaceAdvancedScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetToDefaults } = useRaceSettings();
  const [startS, setStartS] = useState(String(settings.startRadiusM));
  const [endS, setEndS] = useState(String(settings.endRadiusM));
  const [lapInS, setLapInS] = useState(String(settings.lapInnerRadiusM));
  const [lapOutS, setLapOutS] = useState(String(settings.lapOuterRadiusM));

  useEffect(() => {
    setStartS(String(settings.startRadiusM));
    setEndS(String(settings.endRadiusM));
    setLapInS(String(settings.lapInnerRadiusM));
    setLapOutS(String(settings.lapOuterRadiusM));
  }, [settings]);

  const parseM = (s: string, fallback: number) => {
    const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const apply = () => {
    updateSettings({
      startRadiusM: parseM(startS, settings.startRadiusM),
      endRadiusM: parseM(endS, settings.endRadiusM),
      lapInnerRadiusM: parseM(lapInS, settings.lapInnerRadiusM),
      lapOuterRadiusM: parseM(lapOutS, settings.lapOuterRadiusM)
    });
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#050816' }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
        <Text style={{ color: '#94a3b8', fontSize: 15, lineHeight: 22, marginBottom: 20 }}>
          All distances are in meters. Values are clamped to safe ranges. Lap outer
          must stay at least 20 m beyond lap inner so GPS jitter does not double-count
          crossings.
        </Text>

        <Field
          label="Start zone radius"
          hint="Sprint: how close you must be to the green start pin to trigger. Shown as the green circle when placing pins."
          value={startS}
          onChangeText={setStartS}
        />
        <Field
          label="Finish zone radius"
          hint="Sprint: how close you must be to the red finish pin to end the run."
          value={endS}
          onChangeText={setEndS}
        />
        <Field
          label="Lap line — inner radius"
          hint="Lap mode: distance at which you are considered on the line (inside)."
          value={lapInS}
          onChangeText={setLapInS}
        />
        <Field
          label="Lap line — outer radius"
          hint="Lap mode: you must move farther than this to be off the line before the next crossing can count."
          value={lapOutS}
          onChangeText={setLapOutS}
        />

        <TouchableOpacity
          onPress={apply}
          style={{
            backgroundColor: '#38bdf8',
            paddingVertical: 16,
            borderRadius: 14,
            marginTop: 8
          }}
        >
          <Text style={{ color: '#0f172a', textAlign: 'center', fontWeight: '900', fontSize: 16 }}>
            Save & close
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            resetToDefaults();
            setStartS(String(DEFAULT_RACE_SETTINGS.startRadiusM));
            setEndS(String(DEFAULT_RACE_SETTINGS.endRadiusM));
            setLapInS(String(DEFAULT_RACE_SETTINGS.lapInnerRadiusM));
            setLapOutS(String(DEFAULT_RACE_SETTINGS.lapOuterRadiusM));
            router.back();
          }}
          style={{
            marginTop: 16,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#475569'
          }}
        >
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontWeight: '700' }}>
            Reset to defaults & close
          </Text>
        </TouchableOpacity>
      </ScrollView>
  );
}
