import {
  Accuracy,
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';
import { useCallback, useState } from 'react';

import type { Coordinate } from '../../services/contracts';

// Foreground, on-demand location only. Nothing is requested until the user
// explicitly asks for their current position, and no position is stored or
// sent anywhere by this hook.
export function useCurrentLocation() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'denied' | 'unavailable'>('idle');

  const request = useCallback(async (): Promise<Coordinate | null> => {
    setStatus('loading');
    try {
      const permission = await requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return null;
      }
      const position = await getCurrentPositionAsync({ accuracy: Accuracy.Balanced });
      setStatus('idle');
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      // Never surface raw platform errors; they can be noisy and unhelpful.
      setStatus('unavailable');
      return null;
    }
  }, []);

  return { status, request };
}
