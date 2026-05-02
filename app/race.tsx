import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Text,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const leaderboardStore = {
  data: [] as any[],

  add(entry: any) {
    this.data.push(entry);
    this.data.sort((a, b) => b.avgSpeed - a.avgSpeed);
    this.data = this.data.slice(0, 10); // top 10
  },

  get() {
    return this.data;
  }
};

export default function Race() {
  const { start, end } = useLocalSearchParams();

  const [location, setLocation] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [startCoord, setStartCoord] = useState<any>(null);
  const [endCoord, setEndCoord] = useState<any>(null);
  const [path, setPath] = useState<any[]>([]);

  const [loadingRoute, setLoadingRoute] = useState(true);
  const [error, setError] = useState('');

  const [avgSpeed, setAvgSpeed] = useState(0);
  const [bestSpeed, setBestSpeed] = useState(0);

  const speedAnim = useRef(new Animated.Value(0)).current;
  const prevLoc = useRef<any>(null);

  const speeds = useRef<number[]>([]);

  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      const text = await res.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const geocode = async (query: string) => {
    const data = await safeFetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );

    if (!data || !data.length) return null;

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

  useEffect(() => {
    const load = async () => {
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
  }, []);

  useEffect(() => {
    let sub: any;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 800 },
        (loc) => {
          const c = loc.coords;
          setLocation(c);
          setPath(p => [...p, c]);

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

          Animated.timing(speedAnim, {
            toValue: speed,
            duration: 300,
            useNativeDriver: false
          }).start();
        }
      );
    })();

    return () => sub && sub.remove();
  }, []);

  useEffect(() => {
    if (!loadingRoute && speeds.current.length > 5) {
      leaderboardStore.add({
        route: `${start} → ${end}`,
        avgSpeed: avgSpeed.toFixed(2),
        bestSpeed: bestSpeed.toFixed(2),
        time: speeds.current.length
      });
    }
  }, [loadingRoute]);

  
  const speedWidth = speedAnim.interpolate({
    inputRange: [0, 140],
    outputRange: ['0%', '90%']
  });

  if (loadingRoute) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
        <ActivityIndicator color="#38bdf8" size="large" />
        <Text style={{ color:'white', marginTop:10 }}>Loading route...</Text>
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
        {startCoord && <Marker coordinate={startCoord} pinColor="green" />}
        {endCoord && <Marker coordinate={endCoord} pinColor="red" />}
      </MapView>

      
      <LinearGradient
        colors={['#000000cc','transparent']}
        style={{ position:'absolute', top:0, width:'100%', padding:20 }}
      >
        <Text style={{ color:'white', fontSize:28, fontWeight:'900' }}>
          SPEED TRACKER
        </Text>

        <Text style={{ color:'#38bdf8' }}>
          Avg: {avgSpeed.toFixed(1)} km/h | Best: {bestSpeed.toFixed(1)} km/h
        </Text>
      </LinearGradient>

      
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
        backgroundColor:'#0f172a',
        padding:10,
        borderRadius:12
      }}>
        <Text style={{ color:'white', fontWeight:'bold', marginBottom:6 }}>
          Leaderboard
        </Text>

        <FlatList
          data={leaderboardStore.get()}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <Text style={{ color:'#94a3b8', fontSize:12 }}>
              {index + 1}. {item.avgSpeed} km/h
            </Text>
          )}
        />
      </View>

    </View>
  );
}