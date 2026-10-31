import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getAvailableRoutes, getLeaderboardEntries, type LeaderboardEntry, type LeaderboardRange, type LeaderboardScope } from '@/lib/leaderboard';

const formatDuration = (seconds: number) => {
  const absolute = Math.abs(seconds);
  const minutes = Math.floor(absolute / 60);
  const secs = absolute - minutes * 60;
  return `${minutes}:${secs.toFixed(1).padStart(4, '0')}`;
};

const scopeLabels: LeaderboardScope[] = ['global', 'friends', 'nearby'];
const rangeLabels: LeaderboardRange[] = ['all', 'week', 'today'];

export default function LeaderboardTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [range, setRange] = useState<LeaderboardRange>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [routes, setRoutes] = useState<string[]>([]);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const availableRoutes = await getAvailableRoutes();
      setRoutes(availableRoutes);
      if (!selectedRoute && availableRoutes.length) {
        setSelectedRoute(availableRoutes[0]);
      }

      const nextEntries = await getLeaderboardEntries({
        route: selectedRoute || undefined,
        scope,
        range,
        userId: user?.userId,
      });
      setEntries(nextEntries);
    } finally {
      setLoading(false);
    }
  }, [range, scope, selectedRoute, user?.userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const podium = useMemo(() => entries.slice(0, 3), [entries]);
  const rankingList = useMemo(() => entries.slice(3), [entries]);

  const currentUserBest = useMemo(() => {
    if (!user) return null;
    return entries.find((entry) => entry.userId === user.userId) ?? null;
  }, [entries, user]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>RaceTrckr</Text>
            <Text style={styles.title}>Leaderboard</Text>
          </View>

          <View style={styles.avatarShell}>
            <Text style={styles.avatarText}>{user ? user.email.charAt(0).toUpperCase() : 'D'}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Compete. Improve. Dominate.</Text>

        {routes.length > 0 && (
          <View style={styles.routeSelector}>
            <Text style={styles.sectionLabel}>Route</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['all', ...routes].map((route) => {
                const isSelected = route === 'all' ? !selectedRoute : route === selectedRoute;
                const label = route === 'all' ? 'All routes' : route;
                return (
                  <TouchableOpacity
                    key={route}
                    onPress={() => setSelectedRoute(route === 'all' ? '' : route)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.filterGroup}>
          <Text style={styles.sectionLabel}>Community</Text>
          <View style={styles.chipRow}>
            {scopeLabels.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setScope(item)}
                style={[styles.chip, scope === item && styles.chipActive]}
              >
                <Text style={[styles.chipText, scope === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.sectionLabel}>Window</Text>
          <View style={styles.chipRow}>
            {rangeLabels.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setRange(item)}
                style={[styles.chip, range === item && styles.chipActive]}
              >
                <Text style={[styles.chipText, range === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No competitors yet</Text>
            <Text style={styles.emptyText}>Submit a valid route run to unlock this leaderboard.</Text>
          </View>
        ) : (
          <>
            <View style={styles.podiumRow}>
              {podium.map((entry, index) => (
                <View
                  key={`${entry.userId}-${entry.route}-${index}`}
                  style={[
                    styles.podiumCard,
                    index === 0 && styles.podiumGold,
                    index === 1 && styles.podiumSilver,
                    index === 2 && styles.podiumBronze,
                  ]}
                >
                  <Text style={styles.podiumPlace}>#{index + 1}</Text>
                  <View style={styles.podiumAvatar}>
                    <Text style={styles.podiumAvatarText}>{entry.avatar}</Text>
                  </View>
                  <Text style={styles.podiumName}>{entry.username}</Text>
                  <Text style={styles.podiumVehicle}>{entry.vehicle}</Text>
                  <Text style={styles.podiumTime}>{formatDuration(entry.bestTime)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Selected route</Text>
              <Text style={styles.summaryValue}>{selectedRoute || 'All routes'}</Text>
              <Text style={styles.summaryMeta}>
                {currentUserBest ? `Your best: ${formatDuration(currentUserBest.bestTime)}` : 'No personal best yet'}
              </Text>
            </View>

            <View style={styles.listWrap}>
              {rankingList.map((entry) => (
                <View
                  key={`${entry.userId}-${entry.route}`}
                  style={[
                    styles.row,
                    user?.userId === entry.userId && styles.currentUserRow,
                  ]}
                >
                  <View style={styles.rankWrap}>
                    <Text style={styles.rankText}>{entry.rank}</Text>
                  </View>

                  <View style={styles.userCell}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{entry.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.username}>{entry.username}</Text>
                      <Text style={styles.vehicleText}>{entry.vehicle}</Text>
                    </View>
                  </View>

                  <View style={styles.timeCell}>
                    <Text style={styles.timeText}>{formatDuration(entry.bestTime)}</Text>
                    <Text style={styles.differenceText}>+{formatDuration(entry.deltaFromFirst)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 52,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  brand: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1.3,
    textTransform: 'uppercase' as const,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900' as const,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    marginTop: 8,
    marginBottom: 18,
  },
  avatarShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarText: {
    color: theme.colors.text,
    fontWeight: '800' as const,
  },
  routeSelector: {
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  filterGroup: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row' as const,
    gap: 8,
    paddingRight: 10,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'capitalize' as const,
  },
  chipTextActive: {
    color: '#0B1116',
  },
  loadingWrap: {
    paddingTop: 32,
    alignItems: 'center' as const,
  },
  emptyState: {
    backgroundColor: theme.colors.panel,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center' as const,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800' as const,
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.muted,
    fontSize: 14,
    textAlign: 'center' as const,
  },
  podiumRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
    marginTop: 8,
    marginBottom: 18,
    gap: 8,
  },
  podiumCard: {
    flex: 1,
    backgroundColor: theme.colors.panel,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  podiumGold: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  podiumSilver: {
    borderColor: '#C0C0C0',
    backgroundColor: 'rgba(192, 192, 192, 0.12)',
  },
  podiumBronze: {
    borderColor: '#CD7F32',
    backgroundColor: 'rgba(205, 127, 50, 0.10)',
  },
  podiumPlace: {
    color: theme.colors.text,
    fontWeight: '800' as const,
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151C24',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 8,
  },
  podiumAvatarText: {
    color: theme.colors.text,
    fontWeight: '800' as const,
  },
  podiumName: {
    color: theme.colors.text,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
  podiumVehicle: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  podiumTime: {
    color: theme.colors.primary,
    fontWeight: '800' as const,
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  summaryLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '800' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800' as const,
    marginTop: 4,
    marginBottom: 4,
  },
  summaryMeta: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  listWrap: {
    gap: 10,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(15, 24, 31, 0.95)',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentUserRow: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 77, 77, 0.08)',
  },
  rankWrap: {
    width: 32,
    alignItems: 'center' as const,
  },
  rankText: {
    color: theme.colors.text,
    fontWeight: '800' as const,
  },
  userCell: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingLeft: 8,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A2632',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  avatarSmallText: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: '800' as const,
  },
  username: {
    color: theme.colors.text,
    fontWeight: '700' as const,
  },
  vehicleText: {
    color: theme.colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  timeCell: {
    alignItems: 'flex-end' as const,
  },
  timeText: {
    color: theme.colors.text,
    fontWeight: '800' as const,
  },
  differenceText: {
    color: theme.colors.primary,
    fontSize: 11,
    marginTop: 2,
  },
};
