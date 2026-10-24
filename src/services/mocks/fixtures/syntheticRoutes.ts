import type {
  Coordinate,
  Hotspot,
  Route,
  RouteComparisonResult,
  RouteRole,
} from '../../contracts';

// Builds synthetic walking routes between any two points so the map can be
// explored during development. This is a stand-in for OpenStreetMap routing:
// the paths ignore the real street network and must never be shown as real
// walking directions.

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: Coordinate, b: Coordinate) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Quadratic bend away from the straight line, so alternatives are visibly
// different paths rather than the same line drawn twice.
function buildGeometry(origin: Coordinate, destination: Coordinate, bend: number): Coordinate[] {
  const steps = 6;
  const normalLat = -(destination.longitude - origin.longitude);
  const normalLon = destination.latitude - origin.latitude;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const offset = bend * 4 * t * (1 - t);
    return {
      latitude: origin.latitude + (destination.latitude - origin.latitude) * t + normalLat * offset,
      longitude:
        origin.longitude + (destination.longitude - origin.longitude) * t + normalLon * offset,
    };
  });
}

function pathLengthMeters(geometry: Coordinate[]) {
  return geometry.reduce(
    (total, point, index) => (index === 0 ? 0 : total + distanceMeters(geometry[index - 1], point)),
    0,
  );
}

function hotspotsOnPath(geometry: Coordinate[], hotspots: Hotspot[]) {
  return hotspots.filter((hotspot) =>
    geometry.some((point) => distanceMeters(point, hotspot.center) <= hotspot.radiusM),
  );
}

function buildRoute(
  id: string,
  role: RouteRole,
  origin: Coordinate,
  destination: Coordinate,
  bend: number,
  hotspots: Hotspot[],
): Omit<Route, 'extraDurationSeconds'> {
  const geometry = buildGeometry(origin, destination, bend);
  const distance = pathLengthMeters(geometry);
  const passed = hotspotsOnPath(geometry, hotspots);
  // Confidence weights the contribution: an area the AI was unsure about
  // pushes a route down less than one it understood clearly.
  const exposure = Math.min(
    100,
    Math.round(
      passed.reduce(
        (total, hotspot) => total + hotspot.intensity * hotspot.meanConfidence * 45,
        0,
      ),
    ),
  );
  return {
    id,
    role,
    // ~1.35 m/s walking pace.
    durationSeconds: Math.round(distance / 1.35),
    distanceMeters: Math.round(distance),
    geometry,
    exposureScore: exposure,
    hotspotsPassed: passed.length,
    incidentCategories: [
      ...new Set(passed.flatMap((hotspot) => hotspot.topIncidentCategories)),
    ].slice(0, 3),
    safetyConcerns: [
      ...new Set(passed.flatMap((hotspot) => hotspot.topSafetyConcerns)),
    ].slice(0, 3),
  };
}

export function buildSyntheticComparison(
  origin: Coordinate,
  destination: Coordinate,
  hotspots: Hotspot[],
  evidenceLevel: RouteComparisonResult['evidenceLevel'],
): RouteComparisonResult {
  const candidates = [
    buildRoute('mock-route-fastest', 'fastest', origin, destination, 0, hotspots),
    buildRoute('mock-route-lower-exposure', 'lower-exposure', origin, destination, 0.22, hotspots),
    buildRoute('mock-route-alternative', 'alternative', origin, destination, -0.3, hotspots),
  ];

  const fastest = candidates[0];
  const routes = candidates.map((route) => ({
    ...route,
    extraDurationSeconds: Math.max(0, route.durationSeconds - fastest.durationSeconds),
  }));

  // Same rule the backend applies. Exposure decays with distance, so a route
  // that enters no reported area still scores slightly above zero; without an
  // absolute floor a meaningless gap would recommend a real detour.
  const nothingToAvoid = fastest.hotspotsPassed === 0 || fastest.exposureScore < 5;
  const best = nothingToAvoid
    ? undefined
    : routes
        .slice(1)
        .filter(
          (route) =>
            route.exposureScore <= fastest.exposureScore * 0.75 &&
            fastest.exposureScore - route.exposureScore >= 5 &&
            route.extraDurationSeconds <= Math.max(300, fastest.durationSeconds * 0.3),
        )
        .sort((a, b) => a.exposureScore - b.exposureScore)[0];

  return {
    routes,
    recommendedRouteId: best?.id ?? null,
    evidenceLevel,
    // Mock geometry is a drawn line, never the street network.
    usesStreetNetwork: false,
  };
}
