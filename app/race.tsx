import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

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


  const speedAnim = useRef(new Animated.Value(0)).current;
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

          Animated.timing(speedAnim, {
            toValue: speed,
            duration: 300,
            useNativeDriver: false
          }).start();
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

  const speedWidth = speedAnim.interpolate({
    inputRange: [0, 140],
    outputRange: ['0%', '90%']
  });

  if (loadingRoute) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <Text style={{ color:'white', marginTop:10 }}>
          {lapMode ? 'Loading lap track…' : 'Loading route...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
        <Text style={{ color:'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1 }}>

      <MapView style={{ flex:1 }}>
        <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#38bdf8" />
        <Polyline coordinates={path} strokeWidth={3} strokeColor="#22c55e" />

        {location && <Marker coordinate={location} />}
       
        

        {lapMode && startCoord ? (
          <>
            <Marker coordinate={startCoord} pinColor="#a855f7" />
            <Circle
              center={startCoord}
              radius={lapInnerM}
              strokeWidth={2}
              strokeColor="rgba(168,85,247,.95)"
              fillColor="rgba(168,85,247,.18)"
            />
          </>
        ) : (
          <>
            {startCoord && (
              <>
                <Marker coordinate={startCoord} pinColor="green" />
                <Circle
                  center={startCoord}
                  radius={startZoneM}
                  strokeWidth={2}
                  strokeColor="rgba(34,197,94,.9)"
                  fillColor="rgba(34,197,94,.2)"
                />
              </>
            )}
            {endCoord && (
              <>
                <Marker coordinate={endCoord} pinColor="red" />
                <Circle
                  center={endCoord}
                  radius={endZoneM}
                  strokeWidth={2}
                  strokeColor="rgba(239,68,68,.9)"
                  fillColor="rgba(239,68,68,.2)"
                />
              </>
            )}
          </>
        )}
      </MapView>

      
      <LinearGradient
        colors={['#000000cc','transparent']}
        style={{ position:'absolute', top:0, width:'100%', padding:20 }}
      >
        <Text style={{ color:'white', fontSize:28, fontWeight:'900' }}>
          speed trckr
        </Text>

        {!armed && pinCoords && (
          <Text style={{ color: '#fbbf24', marginTop: 6, fontWeight: '700' }}>
            {lapMode
              ? 'Tap “Arm race” when ready — leave the purple zone once, then each time you cross it counts (first crossing starts the session).'
              : 'Tap “Arm race” when you are ready — crossing the green zone starts the clock.'}
          </Text>
        )}

        {lapMode && armed && !finished && startTime && (
          <Text style={{ color: '#c4b5fd', marginTop: 6, fontWeight: '700' }}>
            Lap {lapTimesSec.length + 1}
            {lapTimesSec.length > 0
              ? ` · Last ${lapTimesSec[lapTimesSec.length - 1].toFixed(1)}s`
              : ''}
          </Text>
        )}
        
        <Text style={{ color:'#38bdf8' }}>
          Time: {(elapsedTime/1000).toFixed(1)}s
        </Text>

        <Text style={{ color:'#38bdf8' }}>
          Avg: {avgSpeed.toFixed(1)} km/h | Best: {bestSpeed.toFixed(1)} km/h
        </Text>
      </LinearGradient>

      {!armed && pinCoords && !finished && (
        <TouchableOpacity
          onPress={() => {
            if (lapMode) resetLapTracking();
            setArmed(true);
          }}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 200,
            alignSelf: 'center',
            backgroundColor: '#f59e0b',
            paddingVertical: 16,
            paddingHorizontal: 28,
            borderRadius: 16,
            minWidth: '72%',
            borderWidth: 1,
            borderColor: '#fbbf24'
          }}
        >
          <Text style={{ color: '#0f172a', textAlign: 'center', fontWeight: '900', fontSize: 16 }}>
            Arm race
          </Text>
        </TouchableOpacity>
      )}

      {lapMode && armed && !finished && startTime != null && (
        <TouchableOpacity
          onPress={() => {
            if (finishTriggered.current || startTime == null) return;
            const total = Date.now() - startTime;
            const laps = [...lapTimesSecRef.current];
            const n = laps.length;
            const label =
              n === 0
                ? 'Lap track (session)'
                : `Lap track (${n} lap${n === 1 ? '' : 's'})`;
            commitFinish(total, laps, label, avgSpeed, bestSpeed);
          }}
          activeOpacity={0.85}
          style={{
            position: 'absolute',
            bottom: 200,
            alignSelf: 'center',
            backgroundColor: '#7c3aed',
            paddingVertical: 16,
            paddingHorizontal: 28,
            borderRadius: 16,
            minWidth: '72%',
            borderWidth: 1,
            borderColor: '#c4b5fd'
          }}
        >
          <Text style={{ color: '#faf5ff', textAlign: 'center', fontWeight: '900', fontSize: 16 }}>
            End run
          </Text>
        </TouchableOpacity>
      )}

      
      <View style={{
        position:'absolute',
        bottom:100,
        width:'100%',
        alignItems:'center'
      }}>
        <View style={{
          width:'85%',
          height:16,
          backgroundColor:'#111827',
          borderRadius:20,
          overflow:'hidden'
        }}>
          <Animated.View style={{
            height:'100%',
            width:speedWidth,
            backgroundColor:'#38bdf8'
          }} />
        </View>

        <Text style={{ color:'white', marginTop:10 }}>
          Current Speed
        </Text>
      </View>

      
      <View style={{
        position:'absolute',
        right:10,
        top:120,
        width:160,
        backgroundColor:'rgba(15,23,42,0.6)',
        backdropFilter:'blur(10px)',
        borderRadius:16,
        borderWidth:1,
        borderColor:'rgba(255,255,255,.08)',
        padding:10,
      }}>
        <Text style={{ color:'white', fontWeight:'bold', marginBottom:6 }}>
          Leaderboard
        </Text>

        <FlatList
          data={leaderboardStore.get()}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={{marginBottom:8}}>
              <Text
                style={{
                  color:'#ffffff',
                  fontSize:12,
                  fontWeight:'700'
                }}
                numberOfLines={1}
              >
                #{index+1} {item.route}
              </Text>
              <Text style={{color:'#38bdf8',fontSize:12}}>
                Time: {item.time}s
              </Text>
              <Text style={{color:'#38bdf8',fontSize:12}}>
                Avg Speed: {item.avgSpeed} km/h
              </Text>
              {item.bestLapSec != null && item.bestLapSec !== '' && (
                <Text style={{ color: '#c4b5fd', fontSize: 11 }}>
                  Best lap: {item.bestLapSec}s
                </Text>
              )}
            </View>
          )}
        />
        
      </View>
      {finished && (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.92)',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    <Text
      style={{
        color: 'white',
        fontSize: 42,
        fontWeight: '900'
      }}
    >
      FINISHED
    </Text>

    <Text
      style={{
        color: '#38bdf8',
        fontSize: 20,
        marginTop: 15
      }}
    >
      Final Time: {(finalTime / 1000).toFixed(1)}s
    </Text>

    <Text
      style={{
        color: '#94a3b8',
        marginTop: 8
      }}
    >
      Avg Speed: {avgSpeed.toFixed(1)} km/h
    </Text>

    <Text
      style={{
        color: '#94a3b8',
        marginTop: 5
      }}
    >
      Best Speed: {bestSpeed.toFixed(1)} km/h
    </Text>

    {lapMode && lapTimesSec.length > 0 && (
      <>
        <Text
          style={{
            color: '#c4b5fd',
            fontSize: 16,
            fontWeight: '800',
            marginTop: 20,
            alignSelf: 'flex-start',
            marginLeft: '7%'
          }}
        >
          Lap times
        </Text>
        <ScrollView
          style={{ maxHeight: 200, width: '86%', marginTop: 8 }}
          showsVerticalScrollIndicator
        >
          {lapTimesSec.map((t, i) => (
            <Text
              key={`${i}-${t}`}
              style={{
                color: '#e2e8f0',
                paddingVertical: 5,
                fontSize: 15,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,.06)'
              }}
            >
              Lap {i + 1}: {t.toFixed(2)}s
            </Text>
          ))}
        </ScrollView>
        <Text style={{ color: '#a78bfa', fontSize: 16, marginTop: 10, fontWeight: '700' }}>
          Best lap: {Math.min(...lapTimesSec).toFixed(2)}s
        </Text>
      </>
    )}

    {lapMode && lapTimesSec.length === 0 && (
      <Text style={{ color: '#64748b', marginTop: 16, fontSize: 14 }}>
        No completed laps (session time only).
      </Text>
    )}
  </View>
  
)}
</View>
  );
}
