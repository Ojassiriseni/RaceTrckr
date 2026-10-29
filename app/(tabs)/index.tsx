import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { getRuns, type RaceRun } from '@/lib/runs-storage';
import { theme } from '@/constants/theme';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RaceRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadRuns = async () => {
      if (!user) {
        setRecentRuns([]);
        setLoadingRuns(false);
        return;
      }

      setLoadingRuns(true);
      const runs = await getRuns(user.userId);
      setRecentRuns(runs.slice(0, 4));
      setLoadingRuns(false);
    };

    void loadRuns();
  }, [user]);

  const searchPlaces = async (text: string, setFn: (next: any[]) => void) => {
    const clean = text.trim();
    if (clean.length < 2) {
      setFn([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(clean)}`;
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'RaceTrckr/1.0',
          },
        });

        const textBody = await res.text();
        if (!textBody || textBody.trim().startsWith('<')) {
          setFn([]);
          return;
        }

        const data = JSON.parse(textBody);
        setFn(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Search failed:', err);
        setFn([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const swapLocations = () => {
    setStartText(endText);
    setEndText(startText);
    setStartSuggestions(endSuggestions);
    setEndSuggestions(startSuggestions);
  };

  const goPreview = () => {
    if (!startText.trim() || !endText.trim()) return;

    router.push({
      pathname: '/preview',
      params: {
        start: startText.trim(),
        end: endText.trim(),
      },
    });
  };

  const overviewStats = useMemo(() => {
    if (!recentRuns.length) {
      return {
        totalRuns: 0,
        bestTime: '—',
        totalDistance: '—',
      };
    }

    const bestTime = Math.min(...recentRuns.map((run) => run.finalTimeSec));
    const distance = recentRuns.reduce((sum, run) => sum + (run.bestSpeedKmh || 0) * 0.2, 0);

    return {
      totalRuns: recentRuns.length,
      bestTime: `${bestTime.toFixed(1)}s`,
      totalDistance: `${Math.round(distance)} km`,
    };
  }, [recentRuns]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.wordmark}>RaceTrckr</Text>
          <TouchableOpacity style={styles.statusPill} onPress={() => router.push('/pin-setup')}>
            <Text style={styles.statusText}>{user ? 'GPS live' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#0C141A', '#070D13', '#050B12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <Text style={styles.eyebrow}>GPS</Text>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.heroTitle}>READY TO RUN?</Text>
          <Text style={styles.heroSubtitle}>Build your route. Record your run.</Text>

          <View style={styles.routeGraphic}>
            <View style={styles.routeGlow} />
            <View style={styles.routeLine} />
            <View style={styles.routeMarkerStart} />
            <View style={styles.routeMarkerEnd} />
            <View style={styles.routeHudStart} />
            <View style={styles.routeHudEnd} />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={goPreview}>
            <Text style={styles.primaryButtonText}>Create new run</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Route builder</Text>
            <TouchableOpacity onPress={swapLocations} style={styles.swapButton}>
              <Text style={styles.swapText}>Swap</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Start</Text>
          <TextInput
            value={startText}
            onChangeText={(value) => {
              setStartText(value);
              void searchPlaces(value, setStartSuggestions);
            }}
            placeholder="Start location"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            autoCapitalize="words"
          />
          {startSuggestions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={startSuggestions}
                keyExtractor={(item) => `${item.place_id ?? item.display_name}-start`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setStartText(item.display_name);
                      setStartSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          <Text style={styles.fieldLabel}>Destination</Text>
          <TextInput
            value={endText}
            onChangeText={(value) => {
              setEndText(value);
              void searchPlaces(value, setEndSuggestions);
            }}
            placeholder="Destination"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            autoCapitalize="words"
          />
          {endSuggestions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={endSuggestions}
                keyExtractor={(item) => `${item.place_id ?? item.display_name}-end`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setEndText(item.display_name);
                      setEndSuggestions([]);
                    }}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                  </TouchableOpacity>
                )}
                scrollEnabled={false}
              />
            </View>
          )}

          {isSearching ? (
            <View style={styles.inlineState}><ActivityIndicator size="small" color={theme.colors.primary} /><Text style={styles.inlineStateText}>Searching addresses…</Text></View>
          ) : null}

          <TouchableOpacity style={styles.secondaryButton} onPress={goPreview}>
            <Text style={styles.secondaryButtonText}>Preview route</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Performance overview</Text>
          {loadingRuns ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
          ) : recentRuns.length > 0 ? (
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{overviewStats.totalRuns}</Text>
                <Text style={styles.statLabel}>Runs</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{overviewStats.bestTime}</Text>
                <Text style={styles.statLabel}>Best</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{overviewStats.totalDistance}</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No runs yet</Text>
              <Text style={styles.emptyText}>Complete your first route to unlock telemetry, speed graphs, and personal bests.</Text>
            </View>
          )}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Recent runs</Text>
          {loadingRuns ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />
          ) : recentRuns.length > 0 ? (
            recentRuns.map((run) => (
              <TouchableOpacity
                key={run.id}
                style={styles.runRow}
                onPress={() => router.push({ pathname: '/preview', params: { start: run.route, end: run.route } }) }
              >
                <View style={styles.runHeader}>
                  <Text style={styles.runRoute} numberOfLines={1}>{run.route}</Text>
                  <Text style={styles.runTime}>{run.finalTimeSec.toFixed(1)}s</Text>
                </View>
                <Text style={styles.runMeta}>{new Date(run.finishedAt).toLocaleDateString()} • {run.mode === 'lap' ? 'lap mode' : 'route run'}</Text>
                <Text style={styles.runMeta}>Avg {run.avgSpeedKmh.toFixed(1)} km/h • Best {run.bestSpeedKmh.toFixed(1)} km/h</Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Your saved sessions will appear here after the first race is recorded.</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles: Record<string, any> = {
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 46,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  wordmark: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: '#111B23',
    borderColor: '#2B3B47',
    borderWidth: 1,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroCard: {
    borderColor: '#24333F',
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  routeGraphic: {
    height: 116,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2B3744',
    backgroundColor: '#0D151A',
    position: 'relative',
    marginBottom: 18,
    overflow: 'hidden',
  },
  routeGlow: {
    position: 'absolute',
    left: '16%',
    right: '16%',
    top: '28%',
    bottom: '28%',
    borderRadius: 999,
    backgroundColor: 'rgba(199,255,53,0.18)',
  },
  routeLine: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '50%',
    height: 4,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    transform: [{ translateY: -2 }],
  },
  routeMarkerStart: {
    position: 'absolute',
    left: '20%',
    top: '50%',
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderRadius: 999,
    backgroundColor: theme.colors.green,
    borderWidth: 3,
    borderColor: '#F4F6FA',
  },
  routeMarkerEnd: {
    position: 'absolute',
    right: '20%',
    top: '50%',
    width: 18,
    height: 18,
    marginRight: -9,
    marginTop: -9,
    borderRadius: 999,
    backgroundColor: theme.colors.red,
    borderWidth: 3,
    borderColor: '#F4F6FA',
  },
  routeHudStart: {
    position: 'absolute',
    left: 16,
    top: 18,
    width: 72,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(55,166,107,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(55,166,107,0.8)',
  },
  routeHudEnd: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    width: 72,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(224,82,82,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(224,82,82,0.8)',
  },
  heroPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  heroPill: {
    backgroundColor: '#0D171F',
    borderColor: '#2B3744',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroPillText: {
    color: theme.colors.muted,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17, 27, 34, 0.8)',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  primaryButtonText: {
    color: '#0E1215',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  panel: {
    backgroundColor: '#0F1A22',
    borderColor: '#233241',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  swapButton: {
    backgroundColor: '#141D27',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A3745',
  },
  swapText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fieldLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0A1117',
    borderColor: '#2A3947',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#0B1117',
    borderColor: '#2A3745',
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 160,
    marginBottom: 10,
    overflow: 'hidden',
  },
  suggestionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#18242E',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  suggestionText: {
    color: '#E8EEF6',
    fontSize: 14,
  },
  inlineState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  inlineStateText: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: '#121D28',
    borderColor: '#2D3845',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    letterSpacing: 1.4,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#0B1117',
    borderColor: '#263341',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    backgroundColor: '#0B1117',
    borderColor: '#24323E',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  runRow: {
    backgroundColor: '#0B1117',
    borderColor: '#22303D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  runRoute: {
    flex: 1,
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginRight: 10,
  },
  runTime: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  runMeta: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
};