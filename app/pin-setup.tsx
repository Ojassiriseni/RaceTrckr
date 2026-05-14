import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { useRaceSettings } from '@/contexts/race-settings-context';

type PinMode = 'segment' | 'lap';
type SegmentTarget = 'start' | 'finish';

export default function PinSetup() {
  const router = useRouter();
  const { settings } = useRaceSettings();
  const startR = settings.startRadiusM;
  const endR = settings.endRadiusM;
  const lapInnerR = settings.lapInnerRadiusM;

  const [pinMode, setPinMode] = useState<PinMode>('segment');
  const [segmentTarget, setSegmentTarget] = useState<SegmentTarget>('start');
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>(
    'unknown'
  );
  const mapRef = useRef<MapView>(null);
  const didFitUser = useRef(false);
  const [current, setCurrent] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [startCoord, setStartCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [endCoord, setEndCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setStartCoord(null);
    setEndCoord(null);
    setSegmentTarget('start');
  }, [pinMode]);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermission('denied');
        setError('Location permission is required to drop pins where you stand.');
        return;
      }
      setPermission('granted');

      try {
        const snap = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
        const { latitude, longitude } = snap.coords;
        setCurrent({ latitude, longitude });
      } catch {
        // watch will populate
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          setCurrent({ latitude, longitude });
        }
      );
    })();

    return () => sub?.remove();
  }, []);

  const captureHere = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude
    };
  }, []);

  const onMapPress = useCallback(
    (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const coord = e.nativeEvent.coordinate;
      if (pinMode === 'lap') {
        setStartCoord(coord);
        setEndCoord(coord);
        return;
      }
      if (segmentTarget === 'start') {
        setStartCoord(coord);
        setSegmentTarget('finish');
      } else {
        setEndCoord(coord);
      }
    },
    [pinMode, segmentTarget]
  );

  const setStartHere = async () => {
    const c = await captureHere();
    if (c) {
      setStartCoord(c);
      if (pinMode === 'segment') setSegmentTarget('finish');
    }
  };

  const setFinishHere = async () => {
    const c = await captureHere();
    if (c) setEndCoord(c);
  };

  const setLapLineHere = async () => {
    const c = await captureHere();
    if (c) {
      setStartCoord(c);
      setEndCoord(c);
    }
  };

  const goPreview = () => {
    if (pinMode === 'lap') {
      if (!startCoord) return;
      router.push({
        pathname: '/preview',
        params: {
          start: 'Lap line',
          end: 'Lap line',
          lapMode: '1',
          startLat: String(startCoord.latitude),
          startLng: String(startCoord.longitude),
          endLat: String(startCoord.latitude),
          endLng: String(startCoord.longitude)
        }
      });
      return;
    }
    if (!startCoord || !endCoord) return;
    router.push({
      pathname: '/preview',
      params: {
        start: 'Pinned start',
        end: 'Pinned finish',
        startLat: String(startCoord.latitude),
        startLng: String(startCoord.longitude),
        endLat: String(endCoord.latitude),
        endLng: String(endCoord.longitude)
      }
    });
  };

  const canPreview =
    pinMode === 'lap' ? Boolean(startCoord) : Boolean(startCoord && endCoord);

  useEffect(() => {
    if (!current || didFitUser.current) return;
    mapRef.current?.animateToRegion(
      {
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008
      },
      500
    );
    didFitUser.current = true;
  }, [current]);

  if (permission === 'unknown') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Getting location…</Text>
      </View>
    );
  }

  if (permission === 'denied') {
    return (
      <View style={[styles.centered, { padding: 24 }]}>
        <Text style={{ color: '#f87171', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  const lapLineSet =
    pinMode === 'lap' &&
    startCoord &&
    endCoord &&
    startCoord.latitude === endCoord.latitude &&
    startCoord.longitude === endCoord.longitude;

  const placementHint =
    pinMode === 'lap'
      ? 'Tap the map to place the lap line (purple). Circles show trigger size from Race zones settings.'
      : segmentTarget === 'start'
        ? 'Tap the map to place START (green). After that, you will place FINISH (red).'
        : 'Tap the map to place FINISH (red). Or switch back to start below.';

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: current?.latitude ?? 37.78825,
          longitude: current?.longitude ?? -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
        onPress={onMapPress}
      >
        {pinMode === 'lap' && lapLineSet && (
          <>
            <Marker coordinate={startCoord} title="Lap line" pinColor="#a855f7" />
            <Circle
              center={startCoord}
              radius={lapInnerR}
              strokeWidth={2}
              strokeColor="rgba(168,85,247,.95)"
              fillColor="rgba(168,85,247,.22)"
            />
          </>
        )}
        {pinMode === 'segment' && startCoord && (
          <>
            <Marker coordinate={startCoord} pinColor="green" title="Start" />
            <Circle
              center={startCoord}
              radius={startR}
              strokeWidth={2}
              strokeColor="rgba(34,197,94,.9)"
              fillColor="rgba(34,197,94,.2)"
            />
          </>
        )}
        {pinMode === 'segment' && endCoord && (
          <>
            <Marker coordinate={endCoord} pinColor="red" title="Finish" />
            <Circle
              center={endCoord}
              radius={endR}
              strokeWidth={2}
              strokeColor="rgba(239,68,68,.9)"
              fillColor="rgba(239,68,68,.2)"
            />
          </>
        )}
      </MapView>

      <View style={styles.overlayRoot} pointerEvents="box-none">
        <View style={styles.topPanel} pointerEvents="auto">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '800' }}>
              Place pins
            </Text>
            <Pressable
              onPress={() => router.push('/race-advanced')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
                paddingHorizontal: 10
              })}
            >
              <Text style={{ color: '#38bdf8', fontWeight: '700', fontSize: 13 }}>
                Race zones →
              </Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setPinMode('segment')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: pinMode === 'segment' ? '#38bdf8' : '#0f172a',
                borderWidth: 1,
                borderColor: pinMode === 'segment' ? '#7dd3fc' : '#334155'
              }}
            >
              <Text
                style={{
                  color: pinMode === 'segment' ? '#0f172a' : '#94a3b8',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: 13
                }}
              >
                A → B
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPinMode('lap')}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: pinMode === 'lap' ? '#a855f7' : '#0f172a',
                borderWidth: 1,
                borderColor: pinMode === 'lap' ? '#c084fc' : '#334155'
              }}
            >
              <Text
                style={{
                  color: pinMode === 'lap' ? '#0f172a' : '#94a3b8',
                  textAlign: 'center',
                  fontWeight: '800',
                  fontSize: 13
                }}
              >
                Lap track
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              marginTop: 12,
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: '#334155'
            }}
          >
            <Text style={{ color: '#fbbf24', fontWeight: '800', fontSize: 13, marginBottom: 6 }}>
              Tap the map to drop pins
            </Text>
            <Text style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 19 }}>{placementHint}</Text>
          </View>

          {pinMode === 'segment' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setSegmentTarget('start')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: segmentTarget === 'start' ? '#166534' : '#0f172a',
                  borderWidth: 1,
                  borderColor: segmentTarget === 'start' ? '#22c55e' : '#334155'
                }}
              >
                <Text
                  style={{
                    color: segmentTarget === 'start' ? '#fff' : '#94a3b8',
                    textAlign: 'center',
                    fontWeight: '800',
                    fontSize: 12
                  }}
                >
                  Placing: Start
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSegmentTarget('finish')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: segmentTarget === 'finish' ? '#991b1b' : '#0f172a',
                  borderWidth: 1,
                  borderColor: segmentTarget === 'finish' ? '#f87171' : '#334155'
                }}
              >
                <Text
                  style={{
                    color: segmentTarget === 'finish' ? '#fff' : '#94a3b8',
                    textAlign: 'center',
                    fontWeight: '800',
                    fontSize: 12
                  }}
                >
                  Placing: Finish
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} pointerEvents="box-none" />

        <View style={styles.bottomPanel} pointerEvents="auto">
          <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textAlign: 'center' }}>
            Optional: use GPS at your feet instead of a map tap
          </Text>
          {pinMode === 'segment' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={setStartHere}
                style={{
                  flex: 1,
                  backgroundColor: '#14532d',
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#22c55e'
                }}
              >
                <Text style={{ color: '#dcfce7', textAlign: 'center', fontWeight: '800', fontSize: 12 }}>
                  GPS → Start
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={setFinishHere}
                style={{
                  flex: 1,
                  backgroundColor: '#7f1d1d',
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#f87171'
                }}
              >
                <Text style={{ color: '#fee2e2', textAlign: 'center', fontWeight: '800', fontSize: 12 }}>
                  GPS → Finish
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={setLapLineHere}
              style={{
                backgroundColor: '#5b21b6',
                paddingVertical: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#c084fc'
              }}
            >
              <Text style={{ color: '#faf5ff', textAlign: 'center', fontWeight: '800' }}>
                GPS → Lap line
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goPreview}
            disabled={!canPreview}
            style={{
              backgroundColor: canPreview ? '#38bdf8' : 'rgba(56,189,248,0.35)',
              paddingVertical: 16,
              borderRadius: 14,
              marginTop: 12
            }}
          >
            <Text style={{ color: '#0f172a', textAlign: 'center', fontWeight: '900' }}>
              Preview route
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#050816'
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between'
  },
  topPanel: {
    padding: 16,
    paddingTop: 56,
    backgroundColor: 'rgba(5,8,22,0.92)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16
  },
  bottomPanel: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(5,8,22,0.92)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  }
});
