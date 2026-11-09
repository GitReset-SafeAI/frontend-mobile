import { env, type AppEnvironment } from '../config/env';
import { apiServices } from './api';
import type { AppServices, ContactService } from './contracts';
import { mockServices } from './mocks';
import { supabaseAuth } from './auth/supabaseAuth';
import { ApiError } from './api/ApiError';

const demoApiServices: AppServices = { ...apiServices, auth: mockServices.auth };
const unavailable = async (): Promise<never> => {
  throw new ApiError('not-implemented', 'Real accounts require API data mode for emergency contacts.');
};
const unavailableContacts: ContactService = { list: unavailable, add: unavailable, update: unavailable, remove: unavailable, makePrimary: unavailable };
const realMockServices: AppServices = { ...mockServices, auth: supabaseAuth, contacts: unavailableContacts };
const realApiServices: AppServices = { ...apiServices, auth: supabaseAuth };

export function selectServices(mode: AppEnvironment['dataMode'], authMode = env.authMode): AppServices {
  // Real accounts never read saved demo contacts or make backend contact calls in mock data mode.
  if (authMode === 'supabase') return mode === 'mock' ? realMockServices : realApiServices;
  return mode === 'mock' ? mockServices : demoApiServices;
}

export const services = selectServices(env.dataMode);
