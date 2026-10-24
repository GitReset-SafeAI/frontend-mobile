import type { TimePeriod } from '../../../services/contracts';

// Same boundaries as the backend's normalize_reported_time, so a report filed
// "now" falls in the period the map defaults to.
export function currentTimePeriod(now: Date = new Date()): TimePeriod {
  const hour = now.getHours();
  if (hour < 5) return 'late_night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}
