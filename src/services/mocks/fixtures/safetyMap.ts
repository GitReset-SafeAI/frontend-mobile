import {
  hotspotsResultSchema,
  routeComparisonResultSchema,
} from '../../contracts/safetyMap';

// SYNTHETIC DEMO DATA. These clusters and routes are invented for interface
// development and do not represent real reports, real incidents, or real risk
// at any of these locations. They must never be presented as actual
// harassment patterns.

const demoHotspotsWire = {
  generated_at: '2026-10-23T18:00:00Z',
  window_days: 30,
  min_reports_per_hotspot: 3,
  suppressed_area_count: 4,
  evidence_level: 'limited',
  hotspots: [
    {
      id: 'demo-hotspot-1',
      center: { latitude: 6.8905, longitude: 79.8565 },
      radius_m: 180,
      report_count: 9,
      intensity: 0.82,
      top_categories: ['following', 'verbal_harassment'],
      peak_time_bucket: 'evening',
      most_recent_report_days_ago: 2,
      evidence_level: 'moderate',
    },
    {
      id: 'demo-hotspot-2',
      center: { latitude: 6.8929, longitude: 79.8552 },
      radius_m: 160,
      report_count: 6,
      intensity: 0.55,
      top_categories: ['low_light', 'isolated_area'],
      peak_time_bucket: 'night',
      most_recent_report_days_ago: 4,
      evidence_level: 'limited',
    },
    {
      id: 'demo-hotspot-3',
      center: { latitude: 6.9355, longitude: 79.85 },
      radius_m: 220,
      report_count: 12,
      intensity: 0.64,
      top_categories: ['unwanted_touching', 'verbal_harassment'],
      peak_time_bucket: 'day',
      most_recent_report_days_ago: 5,
      evidence_level: 'moderate',
    },
    {
      id: 'demo-hotspot-4',
      center: { latitude: 6.8649, longitude: 79.8997 },
      radius_m: 150,
      report_count: 5,
      intensity: 0.41,
      top_categories: ['stalking'],
      peak_time_bucket: 'night',
      most_recent_report_days_ago: 11,
      evidence_level: 'limited',
    },
    {
      id: 'demo-hotspot-5',
      center: { latitude: 6.8884, longitude: 79.8619 },
      radius_m: 150,
      report_count: 3,
      intensity: 0.18,
      top_categories: ['low_light'],
      peak_time_bucket: null,
      most_recent_report_days_ago: 24,
      evidence_level: 'limited',
    },
  ],
} as const;

// Parsed at module load so a fixture can never drift from the contract.
export const demoHotspots = hotspotsResultSchema.parse(demoHotspotsWire);

const demoRouteComparisonWire = {
  recommended_route_id: 'demo-route-lower-exposure',
  evidence_level: 'limited',
  routes: [
    {
      id: 'demo-route-fastest',
      role: 'fastest',
      duration_s: 720,
      distance_m: 940,
      exposure_score: 68,
      hotspots_passed: 2,
      issue_categories: ['following', 'low_light'],
      extra_duration_s: 0,
      geometry: [
        { latitude: 6.8872, longitude: 79.8597 },
        { latitude: 6.8888, longitude: 79.858 },
        { latitude: 6.8905, longitude: 79.8565 },
        { latitude: 6.8929, longitude: 79.8552 },
        { latitude: 6.8951, longitude: 79.8541 },
      ],
    },
    {
      id: 'demo-route-lower-exposure',
      role: 'lower-exposure',
      duration_s: 900,
      distance_m: 1180,
      exposure_score: 24,
      hotspots_passed: 1,
      issue_categories: ['low_light'],
      extra_duration_s: 180,
      geometry: [
        { latitude: 6.8872, longitude: 79.8597 },
        { latitude: 6.8884, longitude: 79.8619 },
        { latitude: 6.8912, longitude: 79.8627 },
        { latitude: 6.8938, longitude: 79.8604 },
        { latitude: 6.8949, longitude: 79.8568 },
        { latitude: 6.8951, longitude: 79.8541 },
      ],
    },
    {
      id: 'demo-route-alternative',
      role: 'alternative',
      duration_s: 1020,
      distance_m: 1320,
      exposure_score: 47,
      hotspots_passed: 1,
      issue_categories: ['verbal_harassment'],
      extra_duration_s: 300,
      geometry: [
        { latitude: 6.8872, longitude: 79.8597 },
        { latitude: 6.8861, longitude: 79.8561 },
        { latitude: 6.8889, longitude: 79.8531 },
        { latitude: 6.8925, longitude: 79.8521 },
        { latitude: 6.8951, longitude: 79.8541 },
      ],
    },
  ],
} as const;

export const demoRouteComparison = routeComparisonResultSchema.parse(demoRouteComparisonWire);

// Second scenario: an honest "nothing better was found" result.
export const demoRouteComparisonWithoutRecommendation = routeComparisonResultSchema.parse({
  ...demoRouteComparisonWire,
  routes: [demoRouteComparisonWire.routes[0]],
  recommended_route_id: null,
});
