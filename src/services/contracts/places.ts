import { z } from 'zod';

import { coordinateSchema } from './safetyMap';

// Place lookup for the journey planner. Geocoding is a third-party service, so
// the real implementation belongs behind the backend rather than calling a
// provider straight from the app: it keeps provider keys off the device and
// lets one cache serve every user.

export const placeSuggestionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Area or district line shown under the name, as in a familiar map app.
  context: z.string(),
  coordinate: coordinateSchema,
});

export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;

export interface PlaceSearchRequest {
  query: string;
  limit?: number;
}

export interface PlacesService {
  searchPlaces(request: PlaceSearchRequest): Promise<PlaceSuggestion[]>;
}
