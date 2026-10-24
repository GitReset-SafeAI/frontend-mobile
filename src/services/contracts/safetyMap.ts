import { z } from 'zod';

// Provisional Module 4 contract. The backend emits snake_case; these schemas
// validate the wire shape and expose camelCase models to the app.

export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Coordinate = z.infer<typeof coordinateSchema>;

// Mirrors incident_ai_analyses.reported_time, so the filter and the stored
// value are the same vocabulary and need no translation between modules.
export const timePeriodSchema = z.enum([
  'morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure',
]);
export const timePeriodFilterSchema = z.enum([
  'all', 'morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure',
]);

export type TimePeriod = z.infer<typeof timePeriodSchema>;
export type TimePeriodFilter = z.infer<typeof timePeriodFilterSchema>;

// Category vocabularies are owned by the incident-AI module
// (`incident_ai_analyses.IncidentCategory` and `SafetyConcernCategory`). They
// are kept as separate fields because OTHER and UNCLEAR appear in both. Accept
// any string so an added category cannot break the map.
export const incidentCategorySchema = z.string().min(1);
export const safetyConcernSchema = z.string().min(1);

// How well the underlying reports support what is shown. A hotspot is never
// presented as objective danger, and absence of reports is never safety.
export const evidenceLevelSchema = z.enum(['insufficient', 'limited', 'moderate']);

export type EvidenceLevel = z.infer<typeof evidenceLevelSchema>;

const hotspotWireSchema = z.object({
  id: z.string().min(1),
  center: coordinateSchema,
  // Aggregation floor. Precise incident coordinates are never published.
  radius_m: z.number().min(150),
  report_count: z.number().int().min(3),
  intensity: z.number().min(0).max(1),
  top_incident_categories: z.array(incidentCategorySchema).max(3),
  top_safety_concerns: z.array(safetyConcernSchema).max(3),
  peak_time_period: timePeriodSchema.nullable(),
  most_recent_report_days_ago: z.number().int().min(0),
  // Mean AI confidence across the reports behind this area. Reports marked
  // needs_review are excluded upstream and never reach here.
  mean_confidence: z.number().min(0).max(1),
  evidence_level: evidenceLevelSchema,
});

export const hotspotSchema = hotspotWireSchema.transform((hotspot) => ({
  id: hotspot.id,
  center: hotspot.center,
  radiusM: hotspot.radius_m,
  reportCount: hotspot.report_count,
  intensity: hotspot.intensity,
  topIncidentCategories: hotspot.top_incident_categories,
  topSafetyConcerns: hotspot.top_safety_concerns,
  peakTimePeriod: hotspot.peak_time_period,
  mostRecentReportDaysAgo: hotspot.most_recent_report_days_ago,
  meanConfidence: hotspot.mean_confidence,
  evidenceLevel: hotspot.evidence_level,
}));

export type Hotspot = z.infer<typeof hotspotSchema>;

export const hotspotsResultSchema = z
  .object({
    generated_at: z.string().min(1),
    window_days: z.number().int().positive(),
    min_reports_per_hotspot: z.number().int().min(3),
    hotspots: z.array(hotspotSchema),
    // Clusters withheld for falling under the aggregation floor. Surfaced so
    // the map can say areas were withheld rather than imply none exist.
    suppressed_area_count: z.number().int().min(0),
    evidence_level: evidenceLevelSchema,
  })
  .transform((result) => ({
    generatedAt: result.generated_at,
    windowDays: result.window_days,
    minReportsPerHotspot: result.min_reports_per_hotspot,
    hotspots: result.hotspots,
    suppressedAreaCount: result.suppressed_area_count,
    evidenceLevel: result.evidence_level,
  }));

export type HotspotsResult = z.infer<typeof hotspotsResultSchema>;

export interface BoundingBox {
  southWest: Coordinate;
  northEast: Coordinate;
}

export interface HotspotsRequest {
  bounds: BoundingBox;
  timePeriod: TimePeriodFilter;
  windowDays?: number;
}

// Route comparison is out of the initial required scope. It is contracted here
// so it can be added without changing the hotspot surface.

export const routeRoleSchema = z.enum([
  'fastest', 'lower-exposure', 'alternative', 'avoids-all',
]);
export const travelModeSchema = z.enum(['walking', 'driving']);

export type RouteRole = z.infer<typeof routeRoleSchema>;
export type TravelMode = z.infer<typeof travelModeSchema>;

const routeWireSchema = z.object({
  id: z.string().min(1),
  role: routeRoleSchema,
  duration_s: z.number().int().min(0),
  distance_m: z.number().min(0),
  geometry: z.array(coordinateSchema).min(2),
  // Relative indicator of proximity to reported-incident areas, not a safety
  // score and never a guarantee.
  exposure_score: z.number().min(0).max(100),
  hotspots_passed: z.number().int().min(0),
  // What was reported along this path, so every route can be explained rather
  // than only ranked.
  incident_categories: z.array(incidentCategorySchema).max(3),
  safety_concerns: z.array(safetyConcernSchema).max(3),
  // Relative to the fastest route; 0 for the fastest route itself.
  extra_duration_s: z.number().int().min(0),
});

export const routeSchema = routeWireSchema.transform((route) => ({
  id: route.id,
  role: route.role,
  durationSeconds: route.duration_s,
  distanceMeters: route.distance_m,
  geometry: route.geometry,
  exposureScore: route.exposure_score,
  hotspotsPassed: route.hotspots_passed,
  incidentCategories: route.incident_categories,
  safetyConcerns: route.safety_concerns,
  extraDurationSeconds: route.extra_duration_s,
}));

export type Route = z.infer<typeof routeSchema>;

export const routeComparisonResultSchema = z
  .object({
    routes: z.array(routeSchema).min(1).max(4),
    // Null when no route meaningfully lowers exposure within an acceptable
    // detour. Recommending nothing is a valid, honest answer.
    recommended_route_id: z.string().min(1).nullable(),
    // Always set when any route was found: the least-exposed option, named
    // even when it does not clear the bar for a recommendation.
    lowest_exposure_route_id: z.string().min(1).nullable(),
    // A route entering no reported area at all, offered however long it is.
    clear_route_id: z.string().min(1).nullable(),
    evidence_level: evidenceLevelSchema,
    travel_mode: travelModeSchema,
    // False when the routing service could not be reached and the geometry is
    // a straight-line approximation rather than real walking directions.
    uses_street_network: z.boolean(),
    // The routing service has only a car profile, so a walking path follows
    // the road network. Said plainly rather than implied away.
    pedestrian_profile_available: z.boolean(),
  })
  .transform((result) => ({
    routes: result.routes,
    recommendedRouteId: result.recommended_route_id,
    lowestExposureRouteId: result.lowest_exposure_route_id,
    clearRouteId: result.clear_route_id,
    evidenceLevel: result.evidence_level,
    travelMode: result.travel_mode,
    usesStreetNetwork: result.uses_street_network,
    pedestrianProfileAvailable: result.pedestrian_profile_available,
  }));

export type RouteComparisonResult = z.infer<typeof routeComparisonResultSchema>;

export interface RouteComparisonRequest {
  origin: Coordinate;
  destination: Coordinate;
  timePeriod: TimePeriodFilter;
  travelMode: TravelMode;
}

export interface SafetyMapService {
  getHotspots(request: HotspotsRequest): Promise<HotspotsResult>;
  compareRoutes(request: RouteComparisonRequest): Promise<RouteComparisonResult>;
}
