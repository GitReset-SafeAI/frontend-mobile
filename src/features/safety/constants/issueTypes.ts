import type { Hotspot, Route } from '../../../services/contracts';
import { tokens } from '../../../shared/theme/tokens';

// Display metadata for the incident-AI vocabularies
// (`incident_ai_analyses.IncidentCategory` and `SafetyConcernCategory`).
// OTHER and UNCLEAR exist in both enums, so the two are kept apart. An
// unrecognised code must degrade to a neutral label rather than break or be
// dropped silently.

export interface IssueDisplay {
  key: string;
  icon: string;
  color: string;
  labelKey: string;
}

type DisplayMeta = Omit<IssueDisplay, 'key' | 'labelKey'>;

const incidentCategories: Record<string, DisplayMeta> = {
  UNWANTED_FOLLOWING: { icon: 'shoe-print', color: tokens.colors.status.error },
  VERBAL_SEXUAL_HARASSMENT: { icon: 'comment-alert-outline', color: tokens.colors.status.error },
  UNWANTED_PHYSICAL_CONTACT: { icon: 'hand-back-right-outline', color: tokens.colors.status.error },
  THREATENING_BEHAVIOUR: { icon: 'alert-outline', color: tokens.colors.status.error },
  UNCOMFORTABLE_STARING: { icon: 'eye-outline', color: tokens.colors.status.warning },
  OTHER: { icon: 'map-marker-alert-outline', color: tokens.colors.status.warning },
  UNCLEAR: { icon: 'help-circle-outline', color: tokens.colors.status.unknown },
};

const safetyConcerns: Record<string, DisplayMeta> = {
  POOR_STREET_LIGHTING: { icon: 'lightbulb-off-outline', color: tokens.colors.status.info },
  ISOLATED_OR_DESERTED_ROAD: { icon: 'road-variant', color: tokens.colors.status.info },
  UNSAFE_BUS_STOP: { icon: 'bus-stop', color: tokens.colors.status.info },
  FEELING_UNSAFE_WITHOUT_CONFIRMED_INCIDENT: {
    icon: 'account-alert-outline',
    color: tokens.colors.status.unknown,
  },
  PREVIOUS_SAFETY_CONCERNS_AT_LOCATION: {
    icon: 'history',
    color: tokens.colors.status.unknown,
  },
  OTHER: { icon: 'information-outline', color: tokens.colors.status.unknown },
  UNCLEAR: { icon: 'help-circle-outline', color: tokens.colors.status.unknown },
};

const unknownMeta: DisplayMeta = {
  icon: 'map-marker-alert-outline',
  color: tokens.colors.status.unknown,
};

function toDisplay(
  kind: 'incident' | 'concern',
  code: string,
  table: Record<string, DisplayMeta>,
): IssueDisplay {
  const known = table[code] !== undefined;
  return {
    key: `${kind}:${code}`,
    ...(table[code] ?? unknownMeta),
    labelKey: known ? `issues.${kind}.${code}` : `issues.${kind}.UNKNOWN`,
  };
}

export function incidentCategoryDisplay(code: string) {
  return toDisplay('incident', code, incidentCategories);
}

export function safetyConcernDisplay(code: string) {
  return toDisplay('concern', code, safetyConcerns);
}

// Reported incidents are listed before contextual concerns so the more serious
// signal is read first.
export function hotspotIssues(hotspot: Hotspot): IssueDisplay[] {
  return [
    ...hotspot.topIncidentCategories.map(incidentCategoryDisplay),
    ...hotspot.topSafetyConcerns.map(safetyConcernDisplay),
  ];
}

export function routeIssues(route: Route): IssueDisplay[] {
  return [
    ...route.incidentCategories.map(incidentCategoryDisplay),
    ...route.safetyConcerns.map(safetyConcernDisplay),
  ];
}

// Intensity drives opacity only. Colour alone never carries meaning, so every
// area is also labelled with its issue types and report count.
export function hotspotFill(intensity: number) {
  const alpha = Math.round(40 + Math.min(1, Math.max(0, intensity)) * 70)
    .toString(16)
    .padStart(2, '0');
  return `${tokens.colors.status.error}${alpha}`;
}

export function hotspotMarkerColor(hotspot: Hotspot) {
  return hotspotIssues(hotspot)[0]?.color ?? tokens.colors.status.unknown;
}

// Reported as a band, not a percentage: a mean of AI confidence scores does not
// justify two-decimal precision in the interface.
export function confidenceLabelKey(meanConfidence: number) {
  if (meanConfidence >= 0.75) return 'map.confidence.high';
  if (meanConfidence >= 0.5) return 'map.confidence.moderate';
  return 'map.confidence.low';
}
