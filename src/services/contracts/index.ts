import type { SafetyMapService } from './safetyMap';
import type { StatusService } from './status';

export type { ServiceStatus, StatusService } from './status';
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
  TimeBucket,
  TimeBucketFilter,
} from './safetyMap';

export interface AppServices {
  status: StatusService;
  safetyMap: SafetyMapService;
}
