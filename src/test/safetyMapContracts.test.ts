import { selectServices } from '../services';
import { ApiError } from '../services/api/ApiError';
import type { HotspotsRequest } from '../services/contracts';
import { hotspotSchema } from '../services/contracts/safetyMap';
import { queryKeys } from '../services/queryKeys';

const colomboBounds: HotspotsRequest = {
  bounds: {
    southWest: { latitude: 6.82, longitude: 79.82 },
    northEast: { latitude: 6.98, longitude: 79.93 },
  },
  timeBucket: 'all',
};

describe('safety map contract', () => {
  it('returns aggregated hotspots that respect the privacy floor', async () => {
    const result = await selectServices('mock').safetyMap.getHotspots(colomboBounds);

    expect(result.hotspots.length).toBeGreaterThan(0);
    for (const hotspot of result.hotspots) {
      expect(hotspot.reportCount).toBeGreaterThanOrEqual(result.minReportsPerHotspot);
      expect(hotspot.radiusM).toBeGreaterThanOrEqual(150);
      // No raw report content may reach the map.
      expect(Object.keys(hotspot)).not.toContain('description');
    }
  });

  it('reports insufficient evidence instead of an empty-looking safe area', async () => {
    const result = await selectServices('mock').safetyMap.getHotspots({
      ...colomboBounds,
      bounds: {
        southWest: { latitude: 8.0, longitude: 80.5 },
        northEast: { latitude: 8.1, longitude: 80.6 },
      },
    });

    expect(result.hotspots).toHaveLength(0);
    expect(result.evidenceLevel).toBe('insufficient');
  });

  it('filters hotspots by time bucket', async () => {
    const result = await selectServices('mock').safetyMap.getHotspots({
      ...colomboBounds,
      timeBucket: 'night',
    });

    for (const hotspot of result.hotspots) {
      expect(hotspot.peakTimeBucket === null || hotspot.peakTimeBucket === 'night').toBe(true);
    }
  });

  it('explains every route, not only the recommended one', async () => {
    const result = await selectServices('mock').safetyMap.compareRoutes({
      origin: { latitude: 6.8872, longitude: 79.8597 },
      destination: { latitude: 6.8951, longitude: 79.8541 },
      timeBucket: 'night',
    });

    const fastest = result.routes.find((route) => route.role === 'fastest');
    expect(fastest).toBeDefined();
    expect(fastest?.extraDurationSeconds).toBe(0);
    for (const route of result.routes) {
      // OTHER and UNCLEAR exist in both vocabularies, so the two stay apart.
      expect(route.incidentCategories.length).toBe(new Set(route.incidentCategories).size);
      expect(route.safetyConcerns.length).toBe(new Set(route.safetyConcerns).size);
      expect(route.geometry.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('recommends a route only when it is genuinely lower exposure', async () => {
    const result = await selectServices('mock').safetyMap.compareRoutes({
      origin: { latitude: 6.8872, longitude: 79.8597 },
      destination: { latitude: 6.8951, longitude: 79.8541 },
      timeBucket: 'all',
    });

    if (result.recommendedRouteId === null) return;
    const fastest = result.routes.find((route) => route.role === 'fastest');
    const recommended = result.routes.find((route) => route.id === result.recommendedRouteId);
    expect(recommended).toBeDefined();
    // A recommendation must be a real improvement, and is never sold as faster.
    expect(recommended!.exposureScore).toBeLessThan(fastest!.exposureScore);
    expect(recommended!.durationSeconds).toBeGreaterThanOrEqual(fastest!.durationSeconds);
  });

  it('rejects a response that exposes precise incident coordinates', () => {
    const tooPrecise = {
      id: 'x', center: { latitude: 6.9, longitude: 79.86 }, radius_m: 20, report_count: 1,
      intensity: 0.9, top_categories: [], peak_time_bucket: null,
      most_recent_report_days_ago: 0, evidence_level: 'limited',
    };
    expect(hotspotSchema.safeParse(tooPrecise).success).toBe(false);
  });

  it('keeps query keys stable across small map pans', () => {
    const panned: HotspotsRequest = {
      ...colomboBounds,
      bounds: {
        southWest: { latitude: 6.8201, longitude: 79.8203 },
        northEast: { latitude: 6.9804, longitude: 79.9302 },
      },
    };
    expect(queryKeys.hotspots(panned)).toEqual(queryKeys.hotspots(colomboBounds));
  });

  it('fails explicitly in API mode without fetching', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    try {
      await expect(selectServices('api').safetyMap.getHotspots(colomboBounds)).rejects.toMatchObject({
        kind: 'not-implemented', name: 'ApiError',
      } satisfies Partial<ApiError>);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
});
