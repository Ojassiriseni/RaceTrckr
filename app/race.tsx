import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from '../components/map-view';

import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRaceSettings } from '@/contexts/race-settings-context';
import { appendRun } from '@/lib/runs-storage';

const leaderboardStore = {
  data: [] as any[],

  add(entry: any) {
    this.data.push(entry);
    this.data.sort((a, b) => b.avgSpeed - a.avgSpeed);
    this.data = this.data.slice(0, 10); 
  },

  get() {
    return this.data;
  }
};

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
      end: { latitude: elat, longitude: elng }
    };
  }
  return null;
}

export default function Race() {
  const params = useLocalSearchParams();
  const { start, end } = params;
  const { user } = useAuth();
  const { settings } = useRaceSettings();
  const startZoneM = settings.startRadiusM;
  const endZoneM = settings.endRadiusM;
  const lapInnerM = settings.lapInnerRadiusM;
  const lapOuterM = settings.lapOuterRadiusM;

  const pinCoords = useMemo(
    () => parseCoordParams(params as Record<string, string | string[] | undefined>),
    [params.startLat, params.startLng, params.endLat, params.endLng]
  );

  const lapMode = useMemo(() => {
    const v = params.lapMode;
    const s = Array.isArray(v) ? v[0] : v;
    return s === '1' || s === 'true';
  }, [params.lapMode]);

  const [location, setLocation] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [startCoord, setStartCoord] = useState<any>(null);
  const [endCoord, setEndCoord] = useState<any>(null);
  const [path, setPath] = useState<any[]>([]);

  const [loadingRoute, setLoadingRoute] = useState(true);
  const [error, setError] = useState('');

  const [avgSpeed, setAvgSpeed] = useState(0);
  const [bestSpeed, setBestSpeed] = useState(0);

  const [startTime, setStartTime] = useState<number|null>(null);
  const [elapsedTime,setElapsedTime] = useState(0);
 
  const [finished, setFinished] = useState(false);
  const [finalTime,setFinalTime] = useState(0);
  const finishTriggered = useRef(false);

  const [lapTimesSec, setLapTimesSec] = useState<number[]>([]);
  const lapTimesSecRef = useRef<number[]>([]);
  const seenOutsideAfterArmRef = useRef(false);
  const zoneInsideRef = useRef(false);
  const currentLapStartRef = useRef<number | null>(null);

  const [armed, setArmed] = useState(
    () => !parseCoordParams(params as Record<string, string | string[] | undefined>)
  );

  const resetLapTracking = () => {
    seenOutsideAfterArmRef.current = false;
    zoneInsideRef.current = false;
    currentLapStartRef.current = null;
    lapTimesSecRef.current = [];
    setLapTimesSec([]);
  };

  const commitFinish = useCallback(
    (
      totalMs: number,
      lapsSnapshot: number[],
      label: string,
      avgKmh: number,
      bestKmh: number
    ) => {
      finishTriggered.current = true;
      setFinished(true);
      setFinalTime(totalMs);

      const totalSec = totalMs / 1000;
      const bestLap =
        lapsSnapshot.length > 0 ? Math.min(...lapsSnapshot) : undefined;

      leaderboardStore.add({
        route: label,
        avgSpeed: avgKmh.toFixed(1),
        bestSpeed: bestKmh.toFixed(1),
        time: totalSec.toFixed(1),
        lapCount: lapsSnapshot.length,
        bestLapSec: bestLap?.toFixed(2)
      });

      if (user) {
        void appendRun(user.userId, {
          route: label,
          finalTimeSec: totalSec,
          avgSpeedKmh: avgKmh,
          bestSpeedKmh: bestKmh,
          finishedAt: Date.now(),
          mode: lapMode ? 'lap' : 'sprint',
          lapCount: lapMode ? lapsSnapshot.length : undefined,
          lapTimesSec: lapMode && lapsSnapshot.length ? lapsSnapshot : undefined,
          bestLapSec: bestLap
        });
      }
    },
    [user, lapMode]
  );


  const prevLoc = useRef<any>(null);

  const delay = (ms:number)=> new Promise(r=> setTimeout(r,ms));

  const speeds = useRef<number[]>([]);

  const safeFetch = async (url: string) => {
  try {
    const res = await fetch(url);

    const text = await res.text();

    // 🚨 Block HTML or non-JSON responses
    if (!text || text.trim().startsWith('<')) {
      console.log('❌ Blocked / HTML response');
      return null;
    }

    // 🚨 Try parse safely
    try {
      return JSON.parse(text);
    } catch (err) {
      console.log('❌ Not JSON response:', text.slice(0, 50));
      return null;
    }

  } catch (err) {
    console.log('❌ Fetch error:', err);
    return null;
  }
};
  const getDistance = (a:any,b:any)=>{
    const dx = a.latitude - b.latitude;
    const dy = a.longitude - b.longitude;

    return Math.sqrt(dx*dx+dy*dy)*111000;
  }

  const geocode = async (query: string) => {
    
    await delay(500);
  const data = await safeFetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  );

  if (!Array.isArray(data) || data.length === 0) return null;

  return {
    latitude: parseFloat(data[0].lat),
    longitude: parseFloat(data[0].lon)
  };
};

  const getRoute = async (s: any, e: any) => {
    const data = await safeFetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYzMzNiZTcwODI1ZDQ4Y2VhY2IzMDM4OWVjNmMzMmQ2IiwiaCI6Im11cm11cjY0In0=&start=${s.longitude},${s.latitude}&end=${e.longitude},${e.latitude}`
    );

    if (!data?.features) {
      setError('Route failed');
      setLoadingRoute(false);
      return;
    }

    const coords = data.features[0].geometry.coordinates.map((c: any) => ({
      latitude: c[1],
      longitude: c[0]
    }));

    setRouteCoords(coords);
    setLoadingRoute(false);
  };

  const skipRouteLoading = () => {
    setRouteCoords([]);
    setLoadingRoute(false);
  };

  useEffect(() => {
    const load = async () => {
      const fromPins = parseCoordParams(
        params as Record<string, string | string[] | undefined>
      );
      const v = params.lapMode;
      const isLap = (Array.isArray(v) ? v[0] : v) === '1' || (Array.isArray(v) ? v[0] : v) === 'true';

      if (fromPins) {
        setStartCoord(fromPins.start);
        setEndCoord(fromPins.end);
        if (isLap) {
          skipRouteLoading();
          return;
        }
        getRoute(fromPins.start, fromPins.end);
        return;
      }

      if (!start || !end) {
        setError('Missing start or finish');
        setLoadingRoute(false);
        return;
      }

      const s = await geocode(String(start));
      const e = await geocode(String(end));

      if (!s || !e) {
        setError('Location not found');
        setLoadingRoute(false);
        return;
      }

      setStartCoord(s);
      setEndCoord(e);
      getRoute(s, e);
    };

    load();
  }, [start, end, params.startLat, params.startLng, params.endLat, params.endLng, params.lapMode]);

  useEffect(() => {
    let sub: any;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 800 },
        (loc) => {
          if (finished) return;
          const c = loc.coords;
          setLocation(c);
          setPath((p) => [...p, c]);

          if (lapMode && armed && startCoord) {
            const d = getDistance(c, startCoord);
            if (!seenOutsideAfterArmRef.current && d > lapOuterM) {
              seenOutsideAfterArmRef.current = true;
            }
            const prev = zoneInsideRef.current;
            let inZ = prev;
            if (prev && d > lapOuterM) inZ = false;
            else if (!prev && d < lapInnerM) inZ = true;
            zoneInsideRef.current = inZ;
            const crossedIn = !prev && inZ;

            if (seenOutsideAfterArmRef.current && crossedIn) {
              const now = Date.now();
              if (currentLapStartRef.current == null) {
                currentLapStartRef.current = now;
                setStartTime(now);
              } else if (!finishTriggered.current) {
                const lapSec = (now - currentLapStartRef.current) / 1000;
                currentLapStartRef.current = now;
                const next = [...lapTimesSecRef.current, lapSec];
                lapTimesSecRef.current = next;
                setLapTimesSec(next);
              }
            }
          } else if (!lapMode) {
            if (armed && !startTime && startCoord) {
              const distToStart = getDistance(c, startCoord);
              if (distToStart < startZoneM) {
                setStartTime(Date.now());
              }
            }
          }

          if (startTime) {
            setElapsedTime(Date.now() - startTime);
          }

          let speed = 0;

          if (prevLoc.current) {
            const dx = c.latitude - prevLoc.current.latitude;
            const dy = c.longitude - prevLoc.current.longitude;
            const dist = Math.sqrt(dx * dx + dy * dy);

            speed = dist * 111000 * 3.6; // km/h
          }

          prevLoc.current = c;

          speeds.current.push(speed);

          const avg =
            speeds.current.reduce((a, b) => a + b, 0) /
            speeds.current.length;

          setAvgSpeed(avg);
          setBestSpeed(Math.max(...speeds.current));

          if (
            !lapMode &&
            !finishTriggered.current &&
            startTime &&
            endCoord
          ) {
            const dist = getDistance(c, endCoord);
            if (dist < endZoneM) {
              const final = Date.now() - startTime;
              const bestKmh = speeds.current.length
                ? Math.max(...speeds.current)
                : 0;
              commitFinish(
                final,
                [],
                `${start} → ${end}`,
                avg,
                bestKmh
              );
            }
          }

        }
      );
    })();

    return () => sub && sub.remove();
  }, [
    startTime,
    finished,
    startCoord,
    endCoord,
    armed,
    user?.userId,
    lapMode,
    start,
    end,
    commitFinish,
    startZoneM,
    endZoneM,
    lapInnerM,
    lapOuterM
  ]);

  const displaySpeed = Math.min(170, Math.max(0, avgSpeed * 1.2 || 0));
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapCenter = startCoord ?? location ?? { latitude: 37.78825, longitude: -122.4324 };
  const routeLabel = lapMode ? 'Lap session' : `${String(start ?? 'Start')} → ${String(end ?? 'Finish')}`;

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const coordinates = routeCoords.length > 1
      ? routeCoords
      : [startCoord, endCoord].filter(Boolean);
    const hasDistinctPoints = coordinates.length > 1 && coordinates.some(
      (point, index) => index > 0 && (
        point.latitude !== coordinates[0].latitude || point.longitude !== coordinates[0].longitude
      )
    );
    if (hasDistinctPoints) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 48, bottom: 230, left: 48 },
        animated: true
      });
    } else if (coordinates.length > 0) {
      mapRef.current.animateToRegion({ ...coordinates[0], latitudeDelta: 0.012, longitudeDelta: 0.012 }, 450);
    } else if (location) {
      mapRef.current.animateToRegion({ ...location, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 450);
    }
  }, [mapReady, routeCoords, startCoord, endCoord]);

  if (loadingRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <Text style={{ color: theme.colors.text, marginTop: 12, fontWeight: '700' }}>
          {lapMode ? 'Loading lap track…' : 'Loading route…'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.red, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{ latitude: mapCenter.latitude, longitude: mapCenter.longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }}
        userLocation={location ? { latitude: location.latitude, longitude: location.longitude } : null}
        showsUserLocation
        onMapReady={() => setMapReady(true)}
      >
        {routeCoords.length > 1 && <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor={theme.colors.primary} />}
        {path.length > 1 && <Polyline coordinates={path} strokeWidth={4} strokeColor="#42A5F5" />}
        {lapMode && startCoord ? (
          <>
            <Marker coordinate={startCoord} pinColor={theme.colors.purple} title="Lap line" />
            <Circle center={startCoord} radius={lapInnerM} strokeWidth={2} strokeColor={theme.colors.purple} fillColor="rgba(167,139,250,0.18)" />
          </>
        ) : (
          <>
            {startCoord && <Marker coordinate={startCoord} pinColor={theme.colors.green} title="Start" />}
            {endCoord && <Marker coordinate={endCoord} pinColor={theme.colors.red} title="Finish" />}
            {startCoord && <Circle center={startCoord} radius={startZoneM} strokeWidth={2} strokeColor={theme.colors.green} fillColor="rgba(55,166,107,0.12)" />}
            {endCoord && <Circle center={endCoord} radius={endZoneM} strokeWidth={2} strokeColor={theme.colors.red} fillColor="rgba(224,82,82,0.12)" />}
          </>
        )}
      </MapView>

      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', paddingTop: 56, paddingBottom: 22, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(7,12,17,0.9)', borderColor: theme.colors.border, borderWidth: 1, borderRadius: 18, padding: 14 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ color: theme.colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' }}>{lapMode ? 'Lap mode' : 'Sprint mode'}</Text>
            <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: 16, fontWeight: '800', marginTop: 4 }}>{routeLabel}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Recenter map"
            onPress={() => {
              const center = location ?? startCoord;
              if (center) mapRef.current?.animateToRegion({ ...center, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 450);
            }}
            style={{ backgroundColor: theme.colors.panelSoft, borderColor: theme.colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 }}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '800' }}>CENTER</Text>
          </TouchableOpacity>
        </View>

        <View pointerEvents="auto" style={{ backgroundColor: 'rgba(7,12,17,0.94)', borderColor: theme.colors.border, borderWidth: 1, borderRadius: 24, padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
            <View>
              <Text style={{ color: theme.colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Live speed</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
                <Text style={{ color: theme.colors.text, fontSize: 48, fontWeight: '900', letterSpacing: -2 }}>{Math.round(displaySpeed)}</Text>
                <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '800', marginLeft: 7 }}>KM/H</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', paddingBottom: 7 }}>
              <Text style={{ color: theme.colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>ELAPSED</Text>
              <Text style={{ color: theme.colors.primary, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 4 }}>{((finished ? finalTime : elapsedTime) / 1000).toFixed(1)}s</Text>
            </View>
          </View>

          <View style={{ height: 5, borderRadius: 999, backgroundColor: '#25313D', overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ width: `${Math.min(90, (displaySpeed / 170) * 90)}%`, height: '100%', backgroundColor: theme.colors.primary, borderRadius: 999 }} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[{ label: 'Average', value: `${avgSpeed.toFixed(1)} km/h` }, { label: 'Top speed', value: `${bestSpeed.toFixed(1)} km/h` }, ...(lapMode ? [{ label: 'Laps', value: String(lapTimesSec.length) }] : [])].map((stat) => (
              <View key={stat.label} style={{ flex: 1, backgroundColor: theme.colors.panel, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, padding: 11 }}>
                <Text style={{ color: theme.colors.muted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.label}</Text>
                <Text numberOfLines={1} style={{ color: theme.colors.text, fontSize: 13, fontWeight: '800', marginTop: 6 }}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {lapMode && lapTimesSec.length > 0 && (
            <Text style={{ color: theme.colors.muted, fontSize: 12, marginBottom: 14 }}>Last lap {lapTimesSec[lapTimesSec.length - 1].toFixed(2)}s · Best lap {Math.min(...lapTimesSec).toFixed(2)}s</Text>
          )}

          {!armed && pinCoords && !finished ? (
            <TouchableOpacity onPress={() => { if (lapMode) resetLapTracking(); setArmed(true); }} activeOpacity={0.85} style={{ backgroundColor: theme.colors.primary, borderRadius: 15, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.ink, fontWeight: '900', letterSpacing: 1.1 }}>ARM RUN</Text>
            </TouchableOpacity>
          ) : lapMode && armed && !finished && startTime != null ? (
            <TouchableOpacity onPress={() => {
              if (finishTriggered.current || startTime == null) return;
              const total = Date.now() - startTime;
              const laps = [...lapTimesSecRef.current];
              const label = laps.length === 0 ? 'Lap track (session)' : `Lap track (${laps.length} lap${laps.length === 1 ? '' : 's'})`;
              commitFinish(total, laps, label, avgSpeed, bestSpeed);
            }} activeOpacity={0.85} style={{ backgroundColor: theme.colors.purple, borderRadius: 15, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#130D1B', fontWeight: '900', letterSpacing: 1.1 }}>END RUN</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {finished && (
        <View style={{ position: 'absolute', left: 18, right: 18, top: '35%', backgroundColor: '#0A1118', borderColor: theme.colors.primary, borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 2 }}>RUN COMPLETE</Text>
          <Text style={{ color: theme.colors.text, fontSize: 38, fontWeight: '900', marginTop: 8 }}>{(finalTime / 1000).toFixed(1)}s</Text>
          <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Avg {avgSpeed.toFixed(1)} km/h · Best {bestSpeed.toFixed(1)} km/h</Text>
        </View>
      )}
    </View>
  );
}
