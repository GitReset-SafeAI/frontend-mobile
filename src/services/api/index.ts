import type { AppServices } from '../contracts';
import { ApiError } from './ApiError';

// No endpoint or authentication contract exists yet. Do not guess either.
export const apiServices: AppServices = {
  status: {
    async getStatus() {
      throw new ApiError('not-implemented', 'The backend status contract has not been agreed.');
    },
  },
};
