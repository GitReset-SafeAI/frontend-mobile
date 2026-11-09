import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { env } from '../../config/env';
import { ApiError } from '../api/ApiError';
import { secureStorage } from './secureStorage';

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;
  const { supabaseUrl, supabasePublishableKey } = env;
  let valid = false;
  try {
    const url = new URL(supabaseUrl ?? '');
    valid = url.protocol === 'https:' && !url.username && !url.password
      && (url.pathname === '/' || url.pathname === '') && !url.search && !url.hash;
  } catch { /* Do not include configuration values in errors. */ }
  if (Platform.OS === 'web' || !valid || !supabaseUrl
    || !supabasePublishableKey?.startsWith('sb_publishable_')
    || /YOUR_|REPLACE_/i.test(supabaseUrl + supabasePublishableKey)) {
    throw new ApiError('configuration', 'Configure the native app with the same Supabase project URL and public publishable key as FastAPI.');
  }
  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      storage: secureStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
      debug: false,
    },
  });
  return client;
}
