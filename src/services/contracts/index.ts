import type { AuthService, ContactService } from './account';
import type { ReportService } from './incident';
import type { PlacesService } from './places';
import type { SafetyMapService } from './safetyMap';
import type { StatusService } from './status';

export type {
  AuthService,
  ContactInput,
  ContactRelationship,
  ContactService,
  EmergencyContact,
  LogInInput,
  SignUpInput,
  User,
} from './account';
export type {
  ApproximateLocation,
  ConfidenceLevel,
  CrowdLevel,
  IncidentAnalysis,
  IncidentCategory,
  IncidentTime,
  LightingLevel,
  NearbyAnswer,
  ReportReceipt,
  ReportService,
  ReportSubmission,
  SeverityLevel,
  VoiceTranscript,
} from './incident';
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
  reports: ReportService;
  auth: AuthService;
  contacts: ContactService;
}
