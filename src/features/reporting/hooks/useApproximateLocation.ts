import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import type { ApproximateLocation } from '../../../services/contracts';

export type LocationStatus = 'idle' | 'locating' | 'denied' | 'unavailable';

// Two decimals is roughly 1 km, so a report never carries a precise point.
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

// Permission is requested only when the user taps "Use my current location", and only for
// foreground use. The exact position is rounded immediately and never stored or logged.
export function useApproximateLocation(onLocated: (location: ApproximateLocation) => void) {
  const [status, setStatus] = useState<LocationStatus>('idle');

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onLocated({
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
        source: 'device',
      });
      setStatus('idle');
    } catch {
      setStatus('unavailable');
    }
  }, [onLocated]);

  return { status, locate };
}
