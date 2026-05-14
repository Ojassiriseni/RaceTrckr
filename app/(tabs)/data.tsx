import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { shareJsonExport } from '@/lib/export-runs';
import { buildExportPayload, getRuns, type RaceRun } from '@/lib/runs-storage';

export default function DataTab() {
  const { user, loading: authLoading } = useAuth();
  const [runs, setRuns] = useState<RaceRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setRuns([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await getRuns(user.userId);
    setRuns(list);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const onExport = async () => {
    if (!user || runs.length === 0) {
      Alert.alert('Nothing to export', 'Finish a race while signed in to build history.');
      return;
    }
    setExporting(true);
    try {
      const payload = buildExportPayload(user.email, runs);
      await shareJsonExport('runs', JSON.stringify(payload, null, 2));
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <View style={screen}>
        <ActivityIndicator color="#38bdf8" size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[screen, pad]}>
        <Text style={title}>Your data</Text>
        <Text style={muted}>
          Sign in from the Profile tab to save races and view them here.
        </Text>
      </View>
    );
  }

  const bestTime =
    runs.length > 0
      ? Math.min(...runs.map((r) => r.finalTimeSec))
      : null;

  return (
    <View style={[screen, pad]}>
      <Text style={title}>Your data</Text>
      <Text style={sub}>{user.email}</Text>

      <View style={statsRow}>
        <View style={statBox}>
          <Text style={statNum}>{runs.length}</Text>
          <Text style={statLabel}>runs saved</Text>
        </View>
        <View style={statBox}>
          <Text style={statNum}>
            {bestTime != null ? `${bestTime.toFixed(1)}s` : '—'}
          </Text>
          <Text style={statLabel}>best time</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onExport}
        disabled={exporting || runs.length === 0}
        style={[
          exportBtn,
          (exporting || runs.length === 0) && { opacity: 0.45 }
        ]}
      >
        {exporting ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <Text style={exportBtnText}>Export JSON</Text>
        )}
      </TouchableOpacity>
      <Text style={hint}>
        Opens the share sheet so you can save to Files, AirDrop, or cloud storage.
      </Text>

      {loading ? (
        <ActivityIndicator color="#38bdf8" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          style={{ marginTop: 16, flex: 1 }}
          data={runs}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={muted}>
              No saved runs yet. Complete a race on the map screen while logged in.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={card}>
              <Text style={route} numberOfLines={2}>
                {item.route}
              </Text>
              <Text style={row}>
                Time:{' '}
                <Text style={accent}>{item.finalTimeSec.toFixed(1)}s</Text>
                {' · '}
                Avg {item.avgSpeedKmh.toFixed(1)} km/h
                {' · '}
                Best {item.bestSpeedKmh.toFixed(1)} km/h
              </Text>
              {item.mode === 'lap' && item.lapCount != null && (
                <Text style={[row, { marginTop: 4 }]}>
                  Laps: <Text style={accent}>{item.lapCount}</Text>
                  {item.bestLapSec != null && (
                    <>
                      {' · '}
                      Best lap <Text style={accent}>{item.bestLapSec.toFixed(2)}s</Text>
                    </>
                  )}
                </Text>
              )}
              <Text style={date}>
                {new Date(item.finishedAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const screen = { flex: 1 as const, backgroundColor: '#050816' };
const pad = { padding: 20, paddingTop: 56 };
const title = {
  color: '#fff',
  fontSize: 28,
  fontWeight: '800' as const,
  marginBottom: 4
};
const sub = { color: '#94a3b8', fontSize: 14, marginBottom: 20 };
const muted = { color: '#94a3b8', fontSize: 15, lineHeight: 22 };
const statsRow = { flexDirection: 'row' as const, gap: 12, marginBottom: 16 };
const statBox = {
  flex: 1,
  backgroundColor: '#0f172a',
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
  borderColor: '#1e293b'
};
const statNum = { color: '#38bdf8', fontSize: 22, fontWeight: '800' as const };
const statLabel = { color: '#64748b', fontSize: 12, marginTop: 4 };
const exportBtn = {
  backgroundColor: '#38bdf8',
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: 'center' as const
};
const exportBtnText = { color: '#0f172a', fontWeight: '800' as const, fontSize: 16 };
const hint = { color: '#64748b', fontSize: 12, marginTop: 8 };
const card = {
  backgroundColor: '#0f172a',
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#1e293b'
};
const route = { color: '#e2e8f0', fontWeight: '700' as const, marginBottom: 6 };
const row = { color: '#94a3b8', fontSize: 13 };
const accent = { color: '#38bdf8' };
const date = { color: '#475569', fontSize: 11, marginTop: 6 };
