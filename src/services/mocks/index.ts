import type { AppServices } from '../contracts';
import { demoStatus } from './fixtures/status';

export const mockServices: AppServices = {
  status: { async getStatus() { return { ...demoStatus }; } },
};
