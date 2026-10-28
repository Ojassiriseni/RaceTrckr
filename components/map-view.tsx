import React, { forwardRef } from 'react';
import NativeMapView, { Circle, Marker, Polyline } from 'react-native-maps';

type Coordinate = { latitude: number; longitude: number };
type MapProps = React.ComponentProps<typeof NativeMapView> & {
	userLocation?: Coordinate | null;
};

const MapView = forwardRef<any, MapProps>(function MapView({
	children,
	userLocation,
	showsUserLocation,
	...props
}, ref) {
	return (
		<NativeMapView
			ref={ref}
			{...props}
			showsUserLocation={userLocation ? false : showsUserLocation}
		>
			{children}
			{userLocation && (
				<Marker coordinate={userLocation} pinColor="#4285F4" title="Your location" />
			)}
		</NativeMapView>
	);
});

export { Circle, Marker, Polyline };
export default MapView;
