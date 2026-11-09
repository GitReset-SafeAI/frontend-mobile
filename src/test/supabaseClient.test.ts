import { createClient } from '@supabase/supabase-js';

import { env } from '../config/env';
import { getSupabaseClient } from '../services/auth/supabaseClient';
import { secureStorage } from '../services/auth/secureStorage';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn(() => ({ auth: {} })), processLock: jest.fn() }));

it('requires native public configuration and lazily creates exactly one persistent SDK client', () => {
  const original = { ...env };
  try {
    expect(createClient).not.toHaveBeenCalled();
    expect(() => getSupabaseClient()).toThrow('Configure the native app');
    expect(createClient).not.toHaveBeenCalled();
    env.supabaseUrl = 'https://project.example.invalid';
    env.supabasePublishableKey = 'sb_secret_rejected';
    expect(() => getSupabaseClient()).toThrow('Configure the native app');
    env.supabasePublishableKey = 'sb_publishable_test_fixture';
    expect(getSupabaseClient()).toBe(getSupabaseClient());
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(env.supabaseUrl, env.supabasePublishableKey, {
      auth: expect.objectContaining({ storage: secureStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, debug: false }),
    });
  } finally { Object.assign(env, original); }
});
