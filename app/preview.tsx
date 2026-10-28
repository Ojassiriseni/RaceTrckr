import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from '../components/map-view';

import { useRaceSettings } from '@/contexts/race-settings-context';
import { theme } from '@/constants/theme';

function parseCoordParams(p: Record<string, string | string[] | undefined>) {
  const gl = (k: string) => {
    const v = p[k];
    const s = Array.isArray(v) ? v[0] : v;
    return s != null && s !== '' ? Number(s) : NaN;
  };
  const slat = gl('startLat');
  const slng = gl('startLng');
  const elat = gl('endLat');
  const elng = gl('endLng');
  if ([slat, slng, elat, elng].every((n) => Number.isFinite(n))) {
    return {
      start: { latitude: slat, longitude: slng },
      end: { latitude: elat, longitude: elng },
    };
  }
  return null;
}

function isLapParam(p: Record<string, string | string[] | undefined>) {
  const v = p.lapMode;
  const s = Array.isArray(v) ? v[0] : v;
  return s === '1' || s === 'true';
}

function distanceKmBetween(points: Array<{ latitude: number; longitude: number }>) {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dLat = (b.latitude - a.latitude) * (Math.PI / 180);
    const dLng = (b.longitude - a.longitude) * (Math.PI / 180);
    const lat1 = a.latitude * (Math.PI / 180);
    const lat2 = b.latitude * (Math.PI / 180);

    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

    total += 2 * 6371 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  return total;
}

export default function Preview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { start, end } = params;
  const { settings } = useRaceSettings();
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  const lapMode = useMemo(
    () => isLapParam(params as Record<string, string | string[] | undefined>),
    [params.lapMode]
  );

  const [startCoord, setStartCoord] = useState<any>(null);
  const [endCoord, setEndCoord] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);

  const geocode = async (query: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    return data?.length
      ? {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }
      : null;
  };

  const getRoute = async (s: any, e: any) => {
    try {
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYzMzNiZTcwODI1ZDQ4Y2VhY2IzMDM4OWVjNmMzMmQ2IiwiaCI6Im11cm11cjY0In0=&start=${s.longitude},${s.latitude}&end=${e.longitude},${e.latitude}`
      );

      const data = await res.json();
      const feature = data?.features?.[0];

      if (!feature?.geometry?.coordinates) {
        setError('Route unavailable. Try another pair of locations.');
        setLoading(false);
        return;
      }

      const coords = feature.geometry.coordinates.map((c: any) => ({
        latitude: c[1],
        longitude: c[0],
      }));

      const distanceM = feature.properties?.summary?.distance ??
        distanceKmBetween(coords) * 1000;
      const durationSec = feature.properties?.summary?.duration ?? null;

      setRouteCoords(coords);
      setRouteDistanceKm(distanceM / 1000);
      setRouteDurationMin(durationSec ? durationSec / 60 : null);
      setLoading(false);
    } catch (err) {
      setError('Network issue while calculating the route.');
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      setRouteCoords([]);
      setRouteDistanceKm(null);
      setRouteDurationMin(null);

      const fromPins = parseCoordParams(
        params as Record<string, string | string[] | undefined>
      );

      if (fromPins) {
        setStartCoord(fromPins.start);
        setEndCoord(fromPins.end);
        if (isLapParam(params as Record<string, string | string[] | undefined>)) {
          setLoading(false);
          return;
        }
        await getRoute(fromPins.start, fromPins.end);
        return;
      }

      if (!start || !end) {
        setLoading(false);
        setError('Missing destination details.');
        return;
      }

      const s = await geocode(String(start));
      const e = await geocode(String(end));

      if (s) setStartCoord(s);
      if (e) setEndCoord(e);

      if (s && e) {
        await getRoute(s, e);
      } else {
        setError('Unable to match those addresses. Please try a more specific location.');
        setLoading(false);
      }
    };

    void load();
  }, [start, end, params.startLat, params.startLng, params.endLat, params.endLng, params.lapMode]);

  const samePointLap =
    lapMode &&
    startCoord &&
    endCoord &&
    startCoord.latitude === endCoord.latitude &&
    startCoord.longitude === endCoord.longitude;

  const handleStartRace = () => {
    const fromPins = parseCoordParams(params as Record<string, string | string[] | undefined>);
    const lap = isLapParam(params as Record<string, string | string[] | undefined>);

    if (!startCoord || !endCoord) {
      setError('Choose valid start and destination points before starting a run.');
      return;
    }

    router.push({
      pathname: '/race',
      params: fromPins
        ? {
            start: String(start ?? ''),
            end: String(end ?? ''),
            startLat: String(fromPins.start.latitude),
            startLng: String(fromPins.start.longitude),
            endLat: String(fromPins.end.latitude),
            endLng: String(fromPins.end.longitude),
            ...(lap ? { lapMode: '1' } : {}),
          }
        : { start, end },
    });
  };

  const region = startCoord ?? { latitude: 37.78825, longitude: -122.4324 };

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const points = routeCoords.length > 1
      ? routeCoords
      : [startCoord, endCoord].filter(Boolean);
    const hasDistinctPoints = points.length > 1 && points.some(
      (point, index) => index > 0 && (
        point.latitude !== points[0].latitude || point.longitude !== points[0].longitude
      )
    );
    if (hasDistinctPoints) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 72, right: 48, bottom: 300, left: 48 },
        animated: true
      });
    } else if (points.length > 0) {
      mapRef.current.animateToRegion({ ...points[0], latitudeDelta: 0.008, longitudeDelta: 0.008 }, 450);
    }
  }, [mapReady, routeCoords, startCoord, endCoord]);

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        key={`${startCoord?.latitude ?? 'default'}:${startCoord?.longitude ?? 'default'}`}
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor={theme.colors.primary} />
        )}

        {samePointLap && startCoord && (
          <>
            <Marker coordinate={startCoord} pinColor={theme.colors.purple} title="Lap line" />
            <Circle
              center={startCoord}
              radius={settings.lapInnerRadiusM}
              strokeWidth={2}
              strokeColor="rgba(167,139,250,0.95)"
              fillColor="rgba(167,139,250,0.18)"
            />
          </>
        )}

        {!samePointLap && startCoord && (
          <>
            <Marker coordinate={startCoord} pinColor={theme.colors.green} />
            <Circle
              center={startCoord}
              radius={settings.startRadiusM}
              strokeWidth={2}
              strokeColor="rgba(55,166,107,0.9)"
              fillColor="rgba(55,166,107,0.16)"
            />
          </>
        )}

        {!samePointLap && endCoord && (
          <>
            <Marker coordinate={endCoord} pinColor={theme.colors.red} />
            <Circle
              center={endCoord}
              radius={settings.endRadiusM}
              strokeWidth={2}
              strokeColor="rgba(224,82,82,0.9)"
              fillColor="rgba(224,82,82,0.14)"
            />
          </>
        )}
      </MapView>

      {lapMode && (
        <View style={styles.modeChip}>
          <Text style={styles.modeChipTitle}>Lap mode</Text>
          <Text style={styles.modeChipText}>Use the lap line as your start/finish reference.</Text>
        </View>
      )}

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Route preview</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Start</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{String(start ?? 'Route start')}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Destination</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{String(end ?? 'Route destination')}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statValue}>{routeDistanceKm != null ? `${routeDistanceKm.toFixed(1)} km` : '—'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>{routeDurationMin != null ? `${Math.max(1, Math.round(routeDurationMin))} min` : '—'}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.loadingText}>Calculating route…</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartRace}>
            <Text style={styles.primaryButtonText}>START RUN</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles: Record<string, any> = {
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  modeChip: {
    position: 'absolute',
    top: 54,
    left: 18,
    right: 18,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#6E57D3',
    backgroundColor: 'rgba(18, 20, 28, 0.9)',
  },
  modeChipTitle: {
    color: '#E9D5FF',
    fontWeight: '800',
    fontSize: 13,
  },
  modeChipText: {
    color: '#C4B5FD',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(8, 11, 15, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#1F2B36',
    maxHeight: '42%',
  },
  sheetContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: theme.colors.text,
    fontWeight: '800',
    fontSize: 22,
  },
  editButton: {
    backgroundColor: '#121B23',
    borderRadius: 999,
    borderColor: '#2A3745',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaRow: {
    marginBottom: 10,
  },
  metaLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#101821',
    borderColor: '#273442',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  loadingText: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  errorBox: {
    backgroundColor: 'rgba(224,82,82,0.08)',
    borderColor: 'rgba(224,82,82,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#F9B1B1',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#091015',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.2,
  },
};
