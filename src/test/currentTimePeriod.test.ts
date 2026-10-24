import { currentTimePeriod } from '../features/safety/utils/currentTimePeriod';

describe('current time period', () => {
  // Boundaries must match the backend's normalize_reported_time exactly, or a
  // report filed now lands in a different period than the map defaults to.
  it.each([
    [0, 'late_night'], [4, 'late_night'],
    [5, 'morning'], [11, 'morning'],
    [12, 'afternoon'], [16, 'afternoon'],
    [17, 'evening'], [20, 'evening'],
    [21, 'night'], [23, 'night'],
  ])('maps %i:00 to %s', (hour, expected) => {
    const moment = new Date(2026, 9, 23, hour, 30);
    expect(currentTimePeriod(moment)).toBe(expected);
  });
});
