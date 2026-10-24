import type { HotspotsRequest } from './contracts';

// Map panning must not create an unbounded number of cache entries.
function boundsKey({ bounds }: HotspotsRequest) {
  return [
    bounds.southWest.latitude.toFixed(2),
    bounds.southWest.longitude.toFixed(2),
    bounds.northEast.latitude.toFixed(2),
    bounds.northEast.longitude.toFixed(2),
  ].join(',');
}

export const queryKeys = {
  serviceStatus: ['service-status'] as const,
  hotspots: (request: HotspotsRequest) =>
    ['hotspots', boundsKey(request), request.timeBucket, request.windowDays ?? 'default'] as const,
};
