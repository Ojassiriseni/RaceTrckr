import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { theme } from '@/constants/theme';
import { useRaceSettings } from '@/contexts/race-settings-context';
import { type RaceSettings } from '@/lib/race-settings';

function Field({
  label,
  hint,
  value,
  onChangeText,
}: {
  label: string;
  hint: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldHint}>{hint}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        placeholderTextColor={theme.colors.muted}
        style={styles.fieldInput}
      />
    </View>
  );
}

export default function RaceAdvancedScreen() {
  const router = useRouter();
  const { settings, updateSettings, resetToDefaults } = useRaceSettings();
  const [draft, setDraft] = useState<Partial<Record<keyof RaceSettings, string>>>({});

  const parseM = (s: string, fallback: number) => {
    const n = parseInt(s.replace(/[^0-9-]/g, ''), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const apply = () => {
    updateSettings({
      startRadiusM: parseM(draft.startRadiusM ?? String(settings.startRadiusM), settings.startRadiusM),
      endRadiusM: parseM(draft.endRadiusM ?? String(settings.endRadiusM), settings.endRadiusM),
      lapInnerRadiusM: parseM(draft.lapInnerRadiusM ?? String(settings.lapInnerRadiusM), settings.lapInnerRadiusM),
      lapOuterRadiusM: parseM(draft.lapOuterRadiusM ?? String(settings.lapOuterRadiusM), settings.lapOuterRadiusM),
    });
    router.back();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.note}>
        All distances are in meters. Values are clamped to safe ranges. Lap outer must stay at
        least 20 m beyond lap inner so GPS jitter does not double-count crossings.
      </Text>

      <View style={styles.panel}>
        <Field
          label="Start zone radius"
          hint="Sprint: how close you must be to the green start pin to trigger. Shown as the green circle when placing pins."
          value={draft.startRadiusM ?? String(settings.startRadiusM)}
          onChangeText={(value) => setDraft((current) => ({ ...current, startRadiusM: value }))}
        />
        <Field
          label="Finish zone radius"
          hint="Sprint: how close you must be to the red finish pin to end the run."
          value={draft.endRadiusM ?? String(settings.endRadiusM)}
          onChangeText={(value) => setDraft((current) => ({ ...current, endRadiusM: value }))}
        />
        <Field
          label="Lap line — inner radius"
          hint="Lap mode: distance at which you are considered on the line (inside)."
          value={draft.lapInnerRadiusM ?? String(settings.lapInnerRadiusM)}
          onChangeText={(value) => setDraft((current) => ({ ...current, lapInnerRadiusM: value }))}
        />
        <Field
          label="Lap line — outer radius"
          hint="Lap mode: you must move farther than this to be off the line before the next crossing can count."
          value={draft.lapOuterRadiusM ?? String(settings.lapOuterRadiusM)}
          onChangeText={(value) => setDraft((current) => ({ ...current, lapOuterRadiusM: value }))}
        />
      </View>

      <TouchableOpacity onPress={apply} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Save &amp; close</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          resetToDefaults();
          setDraft({});
          router.back();
        }}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryButtonText}>Reset to defaults &amp; close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  note: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 18,
  },
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: theme.colors.text,
    fontWeight: '800',
    marginBottom: 6,
    fontSize: 15,
  },
  fieldHint: {
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  fieldInput: {
    backgroundColor: theme.colors.ink,
    borderRadius: 12,
    padding: 14,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  primaryButtonText: {
    color: theme.colors.ink,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panelSoft,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '700',
  },
});
