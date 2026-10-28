import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

type Coordinate = { latitude: number; longitude: number };
type Region = Coordinate & { latitudeDelta: number; longitudeDelta: number };

type MapViewHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: Coordinate[], options?: { edgePadding?: { top: number; right: number; bottom: number; left: number }; animated?: boolean }) => void;
};

type MapViewProps = ViewProps & {
  children?: React.ReactNode;
  initialRegion?: Region;
  onPress?: (event: { nativeEvent: { coordinate: Coordinate } }) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  userLocation?: Coordinate | null;
  onMapReady?: () => void;
  mapType?: string;
  loadingEnabled?: boolean;
  loadingBackgroundColor?: string;
  loadingIndicatorColor?: string;
};

type MapModules = {
  L: any;
  RL: any;
  MapController: React.ComponentType<{
    mapRef: React.MutableRefObject<any>;
    initialRegion?: Region;
    onPress?: MapViewProps['onPress'];
    onMapReady?: MapViewProps['onMapReady'];
  }>;
};

let loadedMapModules: MapModules | null = null;

function zoomForRegion(region: Region) {
  return Math.max(2, Math.min(18, Math.round(Math.log2(360 / region.longitudeDelta))));
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { children, initialRegion, onPress, onMapReady, userLocation, style, showsUserLocation: _showsUserLocation, showsMyLocationButton: _showsMyLocationButton, mapType: _mapType, loadingEnabled: _loadingEnabled, loadingBackgroundColor: _loadingBackgroundColor, loadingIndicatorColor: _loadingIndicatorColor, ...viewProps },
  ref
) {
  const mapRef = useRef<any>(null);
  const [modules, setModules] = useState<MapModules | null>(null);
  const region = initialRegion ?? {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06
  };

  useEffect(() => {
    let active = true;
    const stylesheetId = 'leaflet-css';
    if (!document.getElementById(stylesheetId)) {
      const link = document.createElement('link');
      link.id = stylesheetId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    void Promise.all([import('leaflet'), import('react-leaflet')]).then(([leafletModule, RL]) => {
      const L = (leafletModule as any).default ?? leafletModule;
      function MapController({ mapRef: targetRef, initialRegion: firstRegion, onPress: handlePress, onMapReady: handleMapReady }: {
        mapRef: React.MutableRefObject<any>;
        initialRegion?: Region;
        onPress?: MapViewProps['onPress'];
        onMapReady?: MapViewProps['onMapReady'];
      }) {
        const map = RL.useMap();
        targetRef.current = map;
        React.useEffect(() => {
          const timer = setTimeout(() => {
            map.invalidateSize();
            handleMapReady?.();
          }, 0);
          return () => clearTimeout(timer);
        }, [map, handleMapReady]);
        React.useEffect(() => {
          if (firstRegion) {
            map.setView([firstRegion.latitude, firstRegion.longitude], zoomForRegion(firstRegion), { animate: false });
          }
        }, [map, firstRegion?.latitude, firstRegion?.longitude, firstRegion?.longitudeDelta]);
        RL.useMapEvents({
          click: (event) => handlePress?.({
            nativeEvent: { coordinate: { latitude: event.latlng.lat, longitude: event.latlng.lng } }
          })
        });
        return null;
      }

      const loaded = { L, RL, MapController } as MapModules;
      loadedMapModules = loaded;
      if (active) setModules(loaded);
    }).catch((error) => console.error('Unable to load web map:', error));

    return () => { active = false; };
  }, []);

  useImperativeHandle(ref, () => ({
    animateToRegion: (nextRegion, duration = 500) => {
      mapRef.current?.flyTo(
        [nextRegion.latitude, nextRegion.longitude],
        zoomForRegion(nextRegion),
        { duration: duration / 1000 }
      );
    },
    fitToCoordinates: (coordinates, options) => {
      if (coordinates.length < 1) return;
      const bounds = coordinates.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]);
      mapRef.current?.fitBounds(bounds, {
        paddingTopLeft: [options?.edgePadding?.left ?? 24, options?.edgePadding?.top ?? 24],
        paddingBottomRight: [options?.edgePadding?.right ?? 24, options?.edgePadding?.bottom ?? 24],
        animate: options?.animated ?? true
      });
    }
  }), []);

  if (!modules) return <View {...viewProps} style={[styles.map, style]} />;

  const { RL, MapController } = modules;

  return (
    <View {...viewProps} style={[styles.map, style]}>
      {React.createElement(
        RL.MapContainer,
        {
          center: [region.latitude, region.longitude],
          zoom: zoomForRegion(region),
          style: styles.leafletMap,
          zoomControl: true,
          attributionControl: true
        },
        React.createElement(RL.TileLayer, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }),
        React.createElement(MapController, { mapRef, initialRegion, onPress, onMapReady }),
        userLocation && React.createElement(RL.Marker, {
          position: [userLocation.latitude, userLocation.longitude],
          icon: modules.L.divIcon({
            className: 'race-trackr-user-location',
            html: '<span style="display:block;width:14px;height:14px;border:3px solid white;border-radius:50%;background:#4285f4;box-shadow:0 0 0 7px rgba(66,133,244,.24)"></span>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          }),
          title: 'Your location',
          zIndexOffset: 1000
        }),
        children
      )}
    </View>
  );
});

export function Marker({
  coordinate,
  pinColor = '#2563eb',
  title
}: {
  coordinate: Coordinate;
  pinColor?: string;
  title?: string;
}) {
  const safeColor = /^#[\da-f]{3,8}$/i.test(pinColor) || /^[a-z]+$/i.test(pinColor)
    ? pinColor
    : '#2563eb';
  if (!loadedMapModules) return null;
  const { L, RL } = loadedMapModules;
  const icon = L.divIcon({
    className: 'race-trackr-marker',
    html: `<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:${safeColor};box-shadow:0 2px 6px #0008"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return React.createElement(RL.Marker, { position: [coordinate.latitude, coordinate.longitude], icon, title });
}

export function Polyline({
  coordinates,
  strokeWidth = 3,
  strokeColor = '#38bdf8'
}: {
  coordinates: Coordinate[];
  strokeWidth?: number;
  strokeColor?: string;
}) {
  if (coordinates.length < 2) return null;
  if (!loadedMapModules) return null;
  return React.createElement(loadedMapModules.RL.Polyline, {
    positions: coordinates.map(({ latitude, longitude }) => [latitude, longitude]) as [number, number][],
    pathOptions: { color: strokeColor, weight: strokeWidth }
  });
}

export function Circle({
  center,
  radius,
  strokeWidth = 2,
  strokeColor = '#38bdf8',
  fillColor = 'transparent'
}: {
  center: Coordinate;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
}) {
  if (!loadedMapModules) return null;
  return React.createElement(loadedMapModules.RL.Circle, {
    center: [center.latitude, center.longitude],
    radius,
    pathOptions: { color: strokeColor, weight: strokeWidth, fillColor }
  });
}

const styles = StyleSheet.create({
  map: { flex: 1, minHeight: 240 },
  leafletMap: { width: '100%', height: '100%' }
});

export default MapView;
