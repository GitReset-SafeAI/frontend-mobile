import type { AppServices } from '../contracts';
import { ApiError } from './ApiError';

// No endpoint or authentication contract exists yet. Do not guess either.
export const apiServices: AppServices = {
  status: {
    async getStatus() {
      throw new ApiError('not-implemented', 'The backend status contract has not been agreed.');
    },
  },
  // Schemas are provisional and the safety-map endpoints are not built yet.
  // Fail explicitly rather than falling back to synthetic data.
  safetyMap: {
    async getHotspots() {
      throw new ApiError('not-implemented', 'The hotspot endpoint is not available yet.');
    },
    async compareRoutes() {
      throw new ApiError('not-implemented', 'The route comparison endpoint is not available yet.');
    },
  },
};
