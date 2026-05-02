import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function Preview() {
  const router = useRouter();
  const { start, end } = useLocalSearchParams();

  const [startCoord, setStartCoord] = useState<any>(null);
  const [endCoord, setEndCoord] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);

  const[finished,setFinished]=useState(false);
  const[finalTime,setFinalTime]=useState(0);
  //const finishTriggered =  useRef(false);
/*
  const getDistance=(a,b)=>{
    const dx = a.latitude-b.latitutde;
    const dy = a.longitude - b.longitude;
  }
  */
  
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
      if (!start || !end) return;

      const s = await geocode(start as string);
      const e = await geocode(end as string);

      if (s) setStartCoord(s);
      if (e) setEndCoord(e);

      if (s && e) getRoute(s, e);
    };

    load();
  }, []);

  return (
    <View style={{ flex:1 }}>

      <MapView style={{ flex:1 }}>
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#38bdf8"
          />
        )}

        {startCoord && (
          <Marker coordinate={startCoord} pinColor="green" />
        )}

        {endCoord && (
          <Marker coordinate={endCoord} pinColor="red" />
        )}
      </MapView>

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/race',
            params: { start, end }
          })
        }
        style={{
          position:'absolute',
          bottom:40,
          alignSelf:'center',
          backgroundColor:'#22c55e',
          padding:16,
          borderRadius:16,
          width:'80%'
        }}
      >
        <Text style={{ textAlign:'center', fontWeight:'800' }}>
          START RACE 
        </Text>
      </TouchableOpacity>

    </View>
  );
}