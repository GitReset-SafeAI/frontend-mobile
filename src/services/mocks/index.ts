import type { AppServices, HotspotsRequest, HotspotsResult } from '../contracts';
import { mockAuth, mockContacts } from './accounts';
import { analyseSyntheticReport, sampleTranscript } from './fixtures/analysis';
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

function matchesTimePeriod(
  hotspot: HotspotsResult['hotspots'][number],
  timePeriod: HotspotsRequest['timePeriod'],
) {
  return timePeriod === 'all' || hotspot.peakTimePeriod === null || hotspot.peakTimePeriod === timePeriod;
}

// Simulated latency makes loading and processing states visible in demos. Tests skip it.
const mockLatencyMs = process.env.NODE_ENV === 'test' ? 0 : 1200;
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

export const mockServices: AppServices = {
  auth: mockAuth,
  contacts: mockContacts,
  reports: {
    async submitReport(submission) {
      await wait(mockLatencyMs);
      return {
        reportId: `mock-${Date.now().toString(36)}`,
        analysis: analyseSyntheticReport(submission),
      };
    },
    async transcribeVoice() {
      await wait(mockLatencyMs);
      return { text: sampleTranscript };
    },
  },
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
        (hotspot) => withinBounds(request, hotspot) && matchesTimePeriod(hotspot, request.timePeriod),
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
        matchesTimePeriod(hotspot, request.timePeriod),
      );
      return buildSyntheticComparison(
        request.origin,
        request.destination,
        hotspots,
        hotspots.length === 0 ? 'insufficient' : demoHotspots.evidenceLevel,
        request.travelMode,
      );
    },
  },
};
