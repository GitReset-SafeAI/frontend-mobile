import { selectServices } from '../services';
import { ApiError } from '../services/api/ApiError';
import type { HotspotsRequest } from '../services/contracts';
import { hotspotSchema } from '../services/contracts/safetyMap';
import { buildSyntheticComparison } from '../services/mocks/fixtures/syntheticRoutes';
import { queryKeys } from '../services/queryKeys';

const colomboBounds: HotspotsRequest = {
  bounds: {
    southWest: { latitude: 6.82, longitude: 79.82 },
    northEast: { latitude: 6.98, longitude: 79.93 },
  },
  timePeriod: 'all',
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
      timePeriod: 'night',
    });

    for (const hotspot of result.hotspots) {
      expect(hotspot.peakTimePeriod === null || hotspot.peakTimePeriod === 'night').toBe(true);
    }
  });

  it('explains every route, not only the recommended one', async () => {
    const result = await selectServices('mock').safetyMap.compareRoutes({
      origin: { latitude: 6.8872, longitude: 79.8597 },
      destination: { latitude: 6.8951, longitude: 79.8541 },
      timePeriod: 'night',
      travelMode: 'walking',
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
      timePeriod: 'all',
      travelMode: 'walking',
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
      intensity: 0.9, top_categories: [], peak_time_period: null,
      most_recent_report_days_ago: 0, evidence_level: 'limited',
    };
    expect(hotspotSchema.safeParse(tooPrecise).success).toBe(false);
  });

  it('weights a low-confidence area less when scoring routes', () => {
    const origin = { latitude: 6.89, longitude: 79.855 };
    const destination = { latitude: 6.892, longitude: 79.857 };
    const area = {
      id: 'a', center: { latitude: 6.891, longitude: 79.856 }, radiusM: 400,
      reportCount: 9, intensity: 0.8, topIncidentCategories: ['UNWANTED_FOLLOWING'],
      topSafetyConcerns: [], peakTimePeriod: null, mostRecentReportDaysAgo: 1,
      meanConfidence: 0.9, evidenceLevel: 'moderate' as const,
    };

    const confident = buildSyntheticComparison(origin, destination, [area], 'moderate');
    const unsure = buildSyntheticComparison(
      origin, destination, [{ ...area, meanConfidence: 0.3 }], 'moderate',
    );

    const score = (result: typeof confident) =>
      result.routes.find((route) => route.role === 'fastest')!.exposureScore;
    expect(score(unsure)).toBeLessThan(score(confident));
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

  it('fails explicitly in API mode rather than serving synthetic data', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    try {
      // No base URL is configured in tests, so the adapter must refuse before
      // any request, and must never fall back to the mock fixtures.
      await expect(selectServices('api').safetyMap.getHotspots(colomboBounds)).rejects.toMatchObject({
        kind: 'configuration', name: 'ApiError',
      } satisfies Partial<ApiError>);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally { fetchSpy.mockRestore(); }
  });
});

describe('route recommendation restraint', () => {
  it('recommends nothing when the fastest route already avoids everything', () => {
    const origin = { latitude: 6.80, longitude: 79.80 };
    const destination = { latitude: 6.81, longitude: 79.81 };
    // A reported area nowhere near any candidate route.
    const faraway = {
      id: 'far', center: { latitude: 7.5, longitude: 80.5 }, radiusM: 200,
      reportCount: 9, intensity: 0.9, topIncidentCategories: ['UNWANTED_FOLLOWING'],
      topSafetyConcerns: [], peakTimePeriod: null, mostRecentReportDaysAgo: 1,
      meanConfidence: 0.9, evidenceLevel: 'moderate' as const,
    };

    const result = buildSyntheticComparison(origin, destination, [faraway], 'limited');

    expect(result.routes.every((route) => route.hotspotsPassed === 0)).toBe(true);
    // Nothing to avoid means no detour is worth suggesting.
    expect(result.recommendedRouteId).toBeNull();
  });
});

describe('clear route', () => {
  it('offers a route through nothing even when it takes much longer', () => {
    const origin = { latitude: 6.8872, longitude: 79.8597 };
    const destination = { latitude: 6.8951, longitude: 79.8541 };
    const onTheDirectLine = {
      id: 'mid', center: { latitude: 6.89115, longitude: 79.8569 }, radiusM: 200,
      reportCount: 9, intensity: 0.9, topIncidentCategories: ['UNWANTED_FOLLOWING'],
      topSafetyConcerns: [], peakTimePeriod: null, mostRecentReportDaysAgo: 1,
      meanConfidence: 0.9, evidenceLevel: 'moderate' as const,
    };

    const result = buildSyntheticComparison(origin, destination, [onTheDirectLine], 'moderate');
    const fastest = result.routes.find((route) => route.role === 'fastest')!;

    if (result.clearRouteId === null) {
      // Valid only when nothing avoided the area; the fastest must then be hit.
      expect(fastest.hotspotsPassed).toBeGreaterThan(0);
      return;
    }

    const clear = result.routes.find((route) => route.id === result.clearRouteId)!;
    expect(clear.hotspotsPassed).toBe(0);
    // The whole point: it is offered without a time limit applied to it.
    expect(clear.durationSeconds).toBeGreaterThanOrEqual(fastest.durationSeconds);
  });
});
