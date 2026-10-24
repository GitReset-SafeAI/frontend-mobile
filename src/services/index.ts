import { env, type AppEnvironment } from '../config/env';
import { apiServices } from './api';
import type { AppServices } from './contracts';
import { mockServices } from './mocks';

export function selectServices(mode: AppEnvironment['dataMode']): AppServices {
  return mode === 'mock' ? mockServices : apiServices;
}

export const services = selectServices(env.dataMode);
