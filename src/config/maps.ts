export interface MapConfiguration {
  provider: 'platform-default';
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

// Country overview only; this is not a user's or an incident's location.
export const mapsConfig: MapConfiguration = {
  provider: 'platform-default',
  initialRegion: {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 3.5,
    longitudeDelta: 3.5,
  },
};
