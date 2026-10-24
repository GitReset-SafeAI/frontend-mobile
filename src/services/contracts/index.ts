import type { PlacesService } from './places';
import type { SafetyMapService } from './safetyMap';
import type { StatusService } from './status';

export type { ServiceStatus, StatusService } from './status';
export type { PlaceSearchRequest, PlacesService, PlaceSuggestion } from './places';
export type {
  BoundingBox,
  Coordinate,
  EvidenceLevel,
  Hotspot,
  HotspotsRequest,
  HotspotsResult,
  Route,
  RouteComparisonRequest,
  RouteComparisonResult,
  RouteRole,
  SafetyMapService,
  TimePeriod,
  TimePeriodFilter,
  TravelMode,
} from './safetyMap';

export interface AppServices {
  status: StatusService;
  safetyMap: SafetyMapService;
  places: PlacesService;
}
