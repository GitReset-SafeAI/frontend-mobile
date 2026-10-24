// Approximate district centres (about 2-decimal precision). Used only as a coarse, privacy-friendly
// alternative to device location. Display names live in the `reporting` i18n namespace.
export const districts = [
  { id: 'colombo', latitude: 6.93, longitude: 79.86 },
  { id: 'gampaha', latitude: 7.09, longitude: 80.01 },
  { id: 'kalutara', latitude: 6.59, longitude: 79.96 },
  { id: 'kandy', latitude: 7.29, longitude: 80.63 },
  { id: 'matale', latitude: 7.47, longitude: 80.62 },
  { id: 'nuwara_eliya', latitude: 6.95, longitude: 80.79 },
  { id: 'galle', latitude: 6.05, longitude: 80.22 },
  { id: 'matara', latitude: 5.95, longitude: 80.55 },
  { id: 'hambantota', latitude: 6.12, longitude: 81.12 },
  { id: 'jaffna', latitude: 9.66, longitude: 80.03 },
  { id: 'kilinochchi', latitude: 9.38, longitude: 80.38 },
  { id: 'mannar', latitude: 8.98, longitude: 79.9 },
  { id: 'vavuniya', latitude: 8.75, longitude: 80.5 },
  { id: 'mullaitivu', latitude: 9.27, longitude: 80.81 },
  { id: 'batticaloa', latitude: 7.71, longitude: 81.69 },
  { id: 'ampara', latitude: 7.3, longitude: 81.68 },
  { id: 'trincomalee', latitude: 8.59, longitude: 81.22 },
  { id: 'kurunegala', latitude: 7.49, longitude: 80.36 },
  { id: 'puttalam', latitude: 8.04, longitude: 79.84 },
  { id: 'anuradhapura', latitude: 8.31, longitude: 80.4 },
  { id: 'polonnaruwa', latitude: 7.94, longitude: 81.02 },
  { id: 'badulla', latitude: 6.99, longitude: 81.06 },
  { id: 'monaragala', latitude: 6.87, longitude: 81.35 },
  { id: 'ratnapura', latitude: 6.68, longitude: 80.4 },
  { id: 'kegalle', latitude: 7.25, longitude: 80.35 },
] as const;

export type DistrictId = (typeof districts)[number]['id'];
