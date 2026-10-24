import type { AppServices, HotspotsRequest } from '../contracts';
import {
  hotspotsResultSchema,
  routeComparisonResultSchema,
} from '../contracts/safetyMap';
import { env } from '../../config/env';
import { ApiError } from './ApiError';
import { createApiClient } from './client';

const client = createApiClient(env.apiBaseUrl);

// The backend takes min_lon,min_lat,max_lon,max_lat; the app works in
// { latitude, longitude } throughout. The swap happens here, once.
function bboxParam({ bounds }: HotspotsRequest) {
  return [
    bounds.southWest.longitude,
    bounds.southWest.latitude,
    bounds.northEast.longitude,
    bounds.northEast.latitude,
  ].join(',');
}

export const apiServices: AppServices = {
  status: {
    async getStatus() {
      throw new ApiError('not-implemented', 'The backend status contract has not been agreed.');
    },
  },
  // Geocoding will be proxied by the backend so provider keys stay off the
  // device; no endpoint exists yet.
  places: {
    async searchPlaces() {
      throw new ApiError('not-implemented', 'The place search endpoint is not available yet.');
    },
  },
  safetyMap: {
    async getHotspots(request) {
      const query = new URLSearchParams({
        bbox: bboxParam(request),
        time_period: request.timePeriod,
      });
      if (request.windowDays) query.set('window_days', String(request.windowDays));
      return client.request(`/api/v1/safety-map/hotspots?${query}`, hotspotsResultSchema);
    },
    async compareRoutes(request) {
      return client.request('/api/v1/safety-map/routes/compare', routeComparisonResultSchema, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          time_period: request.timePeriod,
        }),
      });
    },
  },
};
