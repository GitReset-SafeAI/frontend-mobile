import { z } from 'zod';

import { authenticatedRequest } from '../auth/accessToken';
import { coordinateSchema } from '../contracts/safetyMap';
import { ApiError } from './ApiError';

export interface LocationFix {
  position: z.infer<typeof coordinateSchema>;
  accuracy_m: number;
}

const shareSchema = z.object({
  share_id: z.string().min(1),
  position: coordinateSchema,
  accuracy_m: z.number().nonnegative(),
  updated_at: z.iso.datetime(),
  expires_at: z.iso.datetime(),
});

export type SharedEmergencyLocation = z.infer<typeof shareSchema>;

const endpoint = '/emergency-location-shares';
const options = { credentials: 'omit', cache: 'no-store', redirect: 'error' } as const;

export const emergencyLocation = {
  start(userId: string, fix: LocationFix) {
    return authenticatedRequest(endpoint, shareSchema, {
      ...options, expectedUserId: userId, method: 'POST', json: fix,
    });
  },
  update(userId: string, shareId: string, fix: LocationFix) {
    return authenticatedRequest(`${endpoint}/${encodeURIComponent(shareId)}`, shareSchema, {
      ...options, expectedUserId: userId, method: 'PATCH', json: fix,
    });
  },
  async end(userId: string, shareId: string) {
    try {
      await authenticatedRequest(`${endpoint}/${encodeURIComponent(shareId)}`, z.void(), {
        ...options, expectedUserId: userId, method: 'DELETE',
      });
    } catch (error) {
      // The link may already have expired or been revoked by another client.
      if (!(error instanceof ApiError && error.kind === 'not-found')) throw error;
    }
  },
};
