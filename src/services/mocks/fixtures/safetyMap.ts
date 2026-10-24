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
      top_incident_categories: ['UNWANTED_FOLLOWING', 'VERBAL_SEXUAL_HARASSMENT'],
      top_safety_concerns: [],
      peak_time_period: 'evening',
      most_recent_report_days_ago: 2,
      mean_confidence: 0.88,
      evidence_level: 'moderate',
    },
    {
      id: 'demo-hotspot-2',
      center: { latitude: 6.8929, longitude: 79.8552 },
      radius_m: 160,
      report_count: 6,
      intensity: 0.55,
      top_incident_categories: [],
      top_safety_concerns: ['POOR_STREET_LIGHTING', 'ISOLATED_OR_DESERTED_ROAD'],
      peak_time_period: 'night',
      most_recent_report_days_ago: 4,
      mean_confidence: 0.61,
      evidence_level: 'limited',
    },
    {
      id: 'demo-hotspot-3',
      center: { latitude: 6.9355, longitude: 79.85 },
      radius_m: 220,
      report_count: 12,
      intensity: 0.64,
      top_incident_categories: ['UNWANTED_PHYSICAL_CONTACT', 'VERBAL_SEXUAL_HARASSMENT'],
      top_safety_concerns: ['UNSAFE_BUS_STOP'],
      peak_time_period: 'afternoon',
      most_recent_report_days_ago: 5,
      mean_confidence: 0.79,
      evidence_level: 'moderate',
    },
    {
      id: 'demo-hotspot-4',
      center: { latitude: 6.8649, longitude: 79.8997 },
      radius_m: 150,
      report_count: 5,
      intensity: 0.41,
      top_incident_categories: ['UNCOMFORTABLE_STARING'],
      top_safety_concerns: [],
      peak_time_period: 'night',
      most_recent_report_days_ago: 11,
      mean_confidence: 0.54,
      evidence_level: 'limited',
    },
    {
      id: 'demo-hotspot-5',
      center: { latitude: 6.8884, longitude: 79.8619 },
      radius_m: 150,
      report_count: 3,
      intensity: 0.18,
      top_incident_categories: [],
      top_safety_concerns: ['POOR_STREET_LIGHTING'],
      peak_time_period: null,
      most_recent_report_days_ago: 24,
      mean_confidence: 0.42,
      evidence_level: 'limited',
    },
  ],
} as const;

// Parsed at module load so a fixture can never drift from the contract.
export const demoHotspots = hotspotsResultSchema.parse(demoHotspotsWire);

const demoRouteComparisonWire = {
  recommended_route_id: 'demo-route-lower-exposure',
  lowest_exposure_route_id: 'demo-route-lower-exposure',
  clear_route_id: null,
  origin_in_reported_area: false,
  destination_in_reported_area: false,
  evidence_level: 'limited',
  travel_mode: 'walking',
  // Demo geometry is drawn, never the street network.
  uses_street_network: false,
  pedestrian_profile_available: false,
  routes: [
    {
      id: 'demo-route-fastest',
      role: 'fastest',
      duration_s: 720,
      distance_m: 940,
      exposure_score: 68,
      hotspots_passed: 2,
      incident_categories: ['UNWANTED_FOLLOWING'],
      safety_concerns: ['POOR_STREET_LIGHTING'],
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
      incident_categories: [],
      safety_concerns: ['POOR_STREET_LIGHTING'],
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
      incident_categories: ['VERBAL_SEXUAL_HARASSMENT'],
      safety_concerns: [],
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
  lowest_exposure_route_id: demoRouteComparisonWire.routes[0].id,
  clear_route_id: null,
  origin_in_reported_area: false,
  destination_in_reported_area: false,
});
