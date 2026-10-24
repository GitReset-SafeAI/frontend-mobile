import { tokens } from '../../../shared/theme/tokens';

// Display metadata for issue categories. The vocabulary is owned by the
// incident-AI and integrity modules, so an unrecognised category must degrade
// to a neutral label rather than break or be dropped silently.

export interface IssueTypeDisplay {
  icon: string;
  color: string;
  labelKey: string;
}

const issueTypes: Record<string, IssueTypeDisplay> = {
  unwanted_touching: {
    icon: 'hand-back-right-outline',
    color: tokens.colors.status.error,
    labelKey: 'issues.unwanted_touching',
  },
  verbal_harassment: {
    icon: 'comment-alert-outline',
    color: tokens.colors.status.warning,
    labelKey: 'issues.verbal_harassment',
  },
  stalking: {
    icon: 'account-eye-outline',
    color: tokens.colors.status.error,
    labelKey: 'issues.stalking',
  },
  following: {
    icon: 'shoe-print',
    color: tokens.colors.status.error,
    labelKey: 'issues.following',
  },
  threatening_behaviour: {
    icon: 'alert-outline',
    color: tokens.colors.status.error,
    labelKey: 'issues.threatening_behaviour',
  },
  low_light: {
    icon: 'lightbulb-off-outline',
    color: tokens.colors.status.info,
    labelKey: 'issues.low_light',
  },
  isolated_area: {
    icon: 'road-variant',
    color: tokens.colors.status.info,
    labelKey: 'issues.isolated_area',
  },
};

const fallback: IssueTypeDisplay = {
  icon: 'map-marker-alert-outline',
  color: tokens.colors.status.unknown,
  labelKey: 'issues.other',
};

export function issueTypeDisplay(category: string): IssueTypeDisplay {
  return issueTypes[category] ?? fallback;
}

// Intensity drives opacity only. Colour alone never carries meaning, so every
// area is also labelled with its issue type and report count.
export function hotspotFill(intensity: number) {
  const alpha = Math.round(40 + Math.min(1, Math.max(0, intensity)) * 70)
    .toString(16)
    .padStart(2, '0');
  return `${tokens.colors.status.error}${alpha}`;
}
