import { z } from 'zod';

// Provisional mobile-facing demo model, NOT a FastAPI health endpoint/schema.
export const serviceStatusSchema = z.object({
  source: z.literal('mock'),
  state: z.literal('available'),
});

export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

export interface StatusService {
  getStatus(): Promise<ServiceStatus>;
}
