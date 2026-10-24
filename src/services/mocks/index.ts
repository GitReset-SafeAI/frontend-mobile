import type { AppServices, HotspotsRequest, HotspotsResult } from '../contracts';
import { searchDemoPlaces } from './fixtures/places';
import { demoHotspots } from './fixtures/safetyMap';
import { demoStatus } from './fixtures/status';
import { buildSyntheticComparison } from './fixtures/syntheticRoutes';

function withinBounds({ bounds }: HotspotsRequest, hotspot: HotspotsResult['hotspots'][number]) {
  const { southWest, northEast } = bounds;
  return (
    hotspot.center.latitude >= southWest.latitude &&
    hotspot.center.latitude <= northEast.latitude &&
    hotspot.center.longitude >= southWest.longitude &&
    hotspot.center.longitude <= northEast.longitude
  );
}

function matchesTimeBucket(
  hotspot: HotspotsResult['hotspots'][number],
  timeBucket: HotspotsRequest['timeBucket'],
) {
  return timeBucket === 'all' || hotspot.peakTimeBucket === null || hotspot.peakTimeBucket === timeBucket;
}

export const mockServices: AppServices = {
  status: { async getStatus() { return { ...demoStatus }; } },
  places: {
    async searchPlaces({ query, limit = 6 }) {
      return searchDemoPlaces(query, limit);
    },
  },
  safetyMap: {
    async getHotspots(request) {
      // Mirrors the server filters so the map behaves the same in both modes.
      const hotspots = demoHotspots.hotspots.filter(
        (hotspot) => withinBounds(request, hotspot) && matchesTimeBucket(hotspot, request.timeBucket),
      );
      return {
        ...demoHotspots,
        windowDays: request.windowDays ?? demoHotspots.windowDays,
        hotspots,
        evidenceLevel: hotspots.length === 0 ? 'insufficient' : demoHotspots.evidenceLevel,
      };
    },
    async compareRoutes(request) {
      const hotspots = demoHotspots.hotspots.filter((hotspot) =>
        matchesTimeBucket(hotspot, request.timeBucket),
      );
      return buildSyntheticComparison(
        request.origin,
        request.destination,
        hotspots,
        hotspots.length === 0 ? 'insufficient' : demoHotspots.evidenceLevel,
      );
    },
  },
};
