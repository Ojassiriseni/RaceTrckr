import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';

import { useRaceSettings } from '@/contexts/race-settings-context';

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

function isLapParam(p: Record<string, string | string[] | undefined>) {
  const v = p.lapMode;
  const s = Array.isArray(v) ? v[0] : v;
  return s === '1' || s === 'true';
}

export default function Preview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { start, end } = params;
  const { settings } = useRaceSettings();

  const lapMode = useMemo(
    () => isLapParam(params as Record<string, string | string[] | undefined>),
    [params.lapMode]
  );

  const [startCoord, setStartCoord] = useState<any>(null);
  const [endCoord, setEndCoord] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  const geocode = async (query: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    return data?.length
      ? {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
      : null;
  };

  const getRoute = async (s: any, e: any) => {
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYzMzNiZTcwODI1ZDQ4Y2VhY2IzMDM4OWVjNmMzMmQ2IiwiaCI6Im11cm11cjY0In0=&start=${s.longitude},${s.latitude}&end=${e.longitude},${e.latitude}`
    );

    const data = await res.json();

    const coords = data.features[0].geometry.coordinates.map((c: any) => ({
      latitude: c[1],
      longitude: c[0]
    }));

    setRouteCoords(coords);
  };

  useEffect(() => {
    const load = async () => {
      const fromPins = parseCoordParams(
        params as Record<string, string | string[] | undefined>
      );
      if (fromPins) {
        setStartCoord(fromPins.start);
        setEndCoord(fromPins.end);
        if (isLapParam(params as Record<string, string | string[] | undefined>)) {
          setRouteCoords([]);
          return;
        }
        getRoute(fromPins.start, fromPins.end);
        return;
      }

      if (!start || !end) return;

      const s = await geocode(start as string);
      const e = await geocode(end as string);

      if (s) setStartCoord(s);
      if (e) setEndCoord(e);

      if (s && e) getRoute(s, e);
    };

    load();
  }, [start, end, params.startLat, params.startLng, params.endLat, params.endLng, params.lapMode]);

  const samePointLap =
    lapMode &&
    startCoord &&
    endCoord &&
    startCoord.latitude === endCoord.latitude &&
    startCoord.longitude === endCoord.longitude;

  return (
    <View style={{ flex: 1 }}>
      <MapView style={{ flex: 1 }}>
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#38bdf8"
          />
        )}

        {samePointLap && (
          <>
            <Marker coordinate={startCoord} pinColor="#a855f7" title="Lap line" />
            <Circle
              center={startCoord}
              radius={settings.lapInnerRadiusM}
              strokeWidth={2}
              strokeColor="rgba(168,85,247,.95)"
              fillColor="rgba(168,85,247,.22)"
            />
          </>
        )}

        {!samePointLap && startCoord && (
          <>
            <Marker coordinate={startCoord} pinColor="green" />
            <Circle
              center={startCoord}
              radius={settings.startRadiusM}
              strokeWidth={2}
              strokeColor="rgba(34,197,94,.85)"
              fillColor="rgba(34,197,94,.15)"
            />
          </>
        )}

        {!samePointLap && endCoord && (
          <>
            <Marker coordinate={endCoord} pinColor="red" />
            <Circle
              center={endCoord}
              radius={settings.endRadiusM}
              strokeWidth={2}
              strokeColor="rgba(239,68,68,.85)"
              fillColor="rgba(239,68,68,.15)"
            />
          </>
        )}
      </MapView>

      {lapMode && (
        <View
          style={{
            position: 'absolute',
            top: 48,
            left: 16,
            right: 16,
            backgroundColor: 'rgba(15,23,42,0.92)',
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#7c3aed'
          }}
        >
          <Text style={{ color: '#e9d5ff', fontWeight: '800' }}>Lap mode</Text>
          <Text style={{ color: '#c4b5fd', fontSize: 13, marginTop: 4 }}>
            Cross the line, complete your lap, cross again for lap times. Tap “End
            run” when done.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => {
          const fromPins = parseCoordParams(
            params as Record<string, string | string[] | undefined>
          );
          const lap = isLapParam(params as Record<string, string | string[] | undefined>);
          router.push({
            pathname: '/race',
            params: fromPins
              ? {
                  start: String(start),
                  end: String(end),
                  startLat: String(fromPins.start.latitude),
                  startLng: String(fromPins.start.longitude),
                  endLat: String(fromPins.end.latitude),
                  endLng: String(fromPins.end.longitude),
                  ...(lap ? { lapMode: '1' } : {})
                }
              : { start, end }
          });
        }}
        style={{
          position: 'absolute',
          bottom: 40,
          alignSelf: 'center',
          backgroundColor: '#22c55e',
          padding: 16,
          borderRadius: 16,
          width: '80%'
        }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '800' }}>START RACE</Text>
      </TouchableOpacity>
    </View>
  );
}
