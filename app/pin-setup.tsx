import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Circle, Marker } from '../components/map-view';

import { theme } from '@/constants/theme';
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
  const mapRef = useRef<any>(null);
  const didFitUser = useRef(false);
  const [mapReady, setMapReady] = useState(false);
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
    let sub: Location.LocationSubscription | undefined;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermission('denied');
          setError('Location access is off. You can still tap the map to place pins.');
          return;
        }
        setPermission('granted');

        const snap = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest
        });
        const { latitude, longitude } = snap.coords;
        setCurrent({ latitude, longitude });
      } catch {
        // The map stays usable for manual placement if GPS is unavailable.
      }

      try {
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
      } catch {
        // GPS is optional; map taps still work without it.
      }
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
    if (!current || !mapReady || didFitUser.current || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008
      },
      500
    );
    didFitUser.current = true;
  }, [current, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !startCoord || !endCoord) return;
    if (startCoord.latitude === endCoord.latitude && startCoord.longitude === endCoord.longitude) {
      mapRef.current.animateToRegion({ ...startCoord, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 450);
    } else {
      mapRef.current.fitToCoordinates([startCoord, endCoord], {
        edgePadding: { top: 220, right: 56, bottom: 250, left: 56 },
        animated: true
      });
    }
  }, [startCoord, endCoord, mapReady]);

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
    <View style={{ flex: 1, backgroundColor: '#090b0f' }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        mapType="standard"
        showsUserLocation
        showsMyLocationButton={false}
        userLocation={current}
        loadingEnabled
        loadingBackgroundColor="#090b0f"
        loadingIndicatorColor="#c7ff35"
        initialRegion={{
          latitude: current?.latitude ?? 37.78825,
          longitude: current?.longitude ?? -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
        onMapReady={() => {
          console.log('[RaceTrckr] Place-points map is ready');
          setMapReady(true);
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
        <LinearGradient
          colors={['rgba(8,11,17,0.96)', 'rgba(8,11,17,0.82)', 'rgba(8,11,17,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topPanel}
          pointerEvents="auto"
        >
          {permission === 'denied' && (
            <Text style={styles.warningText}>{error}</Text>
          )}

          <View style={styles.topRow}>
            <View>
              <Text style={styles.kicker}>Route setup</Text>
              <Text style={styles.title}>Arm screen</Text>
            </View>

            <Pressable
              onPress={() => router.push('/race-advanced')}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, styles.zoneButton]}
            >
              <Text style={styles.zoneButtonText}>Race zones</Text>
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => {
                setStartCoord(null);
                setEndCoord(null);
                setSegmentTarget('start');
                setPinMode('segment');
              }}
              style={[styles.modeButton, pinMode === 'segment' && styles.modeButtonActive]}
            >
              <Text style={[styles.modeButtonText, pinMode === 'segment' && styles.modeButtonTextActive]}>
                A → B
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setStartCoord(null);
                setEndCoord(null);
                setSegmentTarget('start');
                setPinMode('lap');
              }}
              style={[styles.modeButton, pinMode === 'lap' && styles.lapModeButtonActive]}
            >
              <Text style={[styles.modeButtonText, pinMode === 'lap' && styles.lapModeButtonTextActive]}>
                Lap line
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardLabel}>Map target</Text>
            <Text style={styles.cardText}>{placementHint}</Text>
          </View>

          {pinMode === 'segment' && (
            <View style={styles.segmentRow}>
              <TouchableOpacity
                onPress={() => setSegmentTarget('start')}
                style={[styles.segmentTarget, segmentTarget === 'start' && styles.startTargetActive]}
              >
                <Text style={[styles.segmentTargetText, segmentTarget === 'start' && styles.segmentTargetTextActive]}>
                  Start pin
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSegmentTarget('finish')}
                style={[styles.segmentTarget, segmentTarget === 'finish' && styles.finishTargetActive]}
              >
                <Text style={[styles.segmentTargetText, segmentTarget === 'finish' && styles.segmentTargetTextActive]}>
                  Finish pin
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        <View style={{ flex: 1 }} pointerEvents="box-none" />

        <LinearGradient
          colors={['rgba(8,11,17,0)', 'rgba(8,11,17,0.82)', 'rgba(8,11,17,0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomPanel}
          pointerEvents="auto"
        >
          <Text style={styles.helperText}>Use your GPS or tap the map to set the route</Text>

          {pinMode === 'segment' ? (
            <View style={styles.gpsRow}>
              <TouchableOpacity onPress={setStartHere} style={[styles.gpsButton, styles.startButton]}>
                <Text style={styles.gpsButtonText}>GPS → start</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={setFinishHere} style={[styles.gpsButton, styles.finishButton]}>
                <Text style={styles.gpsButtonText}>GPS → finish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={setLapLineHere} style={[styles.gpsButton, styles.lapButton]}>
              <Text style={styles.gpsButtonText}>GPS → lap line</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goPreview}
            disabled={!canPreview}
            style={[styles.previewButton, !canPreview && styles.previewButtonDisabled]}
          >
            <Text style={styles.previewButtonText}>Preview route</Text>
          </TouchableOpacity>
        </LinearGradient>
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
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between'
  },
  topPanel: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: 'rgba(10,14,18,0.9)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  bottomPanel: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    paddingTop: 16,
    backgroundColor: 'rgba(10,14,18,0.92)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 10,
    letterSpacing: 1.7,
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  title: {
    color: '#f4f7fb',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 4
  },
  zoneButton: {
    backgroundColor: 'rgba(199, 255, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(199, 255, 53, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  zoneButtonText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14
  },
  modeButton: {
    flex: 1,
    backgroundColor: 'rgba(23,29,38,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    borderRadius: 12,
    paddingVertical: 10
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  lapModeButtonActive: {
    backgroundColor: '#a78bfa',
    borderColor: '#d9c7ff'
  },
  modeButtonText: {
    color: '#dfe7f1',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  modeButtonTextActive: {
    color: '#08131b'
  },
  lapModeButtonTextActive: {
    color: '#130d1b'
  },
  infoCard: {
    marginTop: 12,
    backgroundColor: 'rgba(19,25,32,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  cardLabel: {
    color: theme.colors.primary,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4
  },
  cardText: {
    color: '#ecf3ff',
    fontSize: 13,
    lineHeight: 18
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10
  },
  segmentTarget: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(19,25,32,0.9)',
    borderColor: 'rgba(148,163,184,0.22)'
  },
  startTargetActive: {
    backgroundColor: 'rgba(34,197,94,0.16)',
    borderColor: 'rgba(74,222,128,0.7)'
  },
  finishTargetActive: {
    backgroundColor: 'rgba(239,68,68,0.16)',
    borderColor: 'rgba(248,113,113,0.7)'
  },
  segmentTargetText: {
    color: '#dfe7f1',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  segmentTargetTextActive: {
    color: '#ffffff'
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 10
  },
  gpsButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1
  },
  startButton: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(74,222,128,0.8)'
  },
  finishButton: {
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(248,113,113,0.8)'
  },
  lapButton: {
    backgroundColor: 'rgba(167,139,250,0.18)',
    borderColor: 'rgba(216,199,255,0.85)'
  },
  gpsButtonText: {
    color: '#edf7ff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  previewButton: {
    backgroundColor: '#dfeeff',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#9bb9ff'
  },
  previewButtonDisabled: {
    backgroundColor: 'rgba(223,238,255,0.38)',
    borderColor: 'rgba(155,185,255,0.3)'
  },
  previewButtonText: {
    color: '#08131b',
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase'
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.6
  }
});
