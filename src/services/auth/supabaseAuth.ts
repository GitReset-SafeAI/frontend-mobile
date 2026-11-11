import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { z } from 'zod';

import { env } from '../../config/env';
import { ApiError } from '../api/ApiError';
import { createApiClient } from '../api/client';
import type { AuthService, User } from '../contracts';
import { registrationSchema } from '../contracts/account';
import { toAuthError } from './errors';
import { assertStorageHealthy, subscribeStorageErrors } from './secureStorage';
import { getSupabaseClient } from './supabaseClient';

export const loginSchema = registrationSchema.pick({ email: true }).extend({ password: z.string().min(1).max(4096) });
export const tokenResponseSchema = z.object({
  access_token: z.string().min(1).regex(/^\S+$/),
  refresh_token: z.string().min(1).regex(/^\S+$/),
  token_type: z.string().toLowerCase().pipe(z.literal('bearer')),
  expires_in: z.number().int().positive(),
});

export function mapUser(user: SupabaseUser): User {
  const name: unknown = user.user_metadata?.name ?? user.user_metadata?.full_name;
  return { id: user.id, email: user.email ?? '',
    name: typeof name === 'string' && name.trim() ? name.trim() : (user.email?.split('@')[0] || 'User') };
}

export function validSession(session: Session | null): session is Session {
  return Boolean(session?.user?.id && typeof session.access_token === 'string' && /^\S+$/.test(session.access_token)
    && !/^(?:undefined|null|sb_)/.test(session.access_token) && session.expires_at
    && Number.isFinite(session.expires_at) && session.expires_at * 1000 > Date.now());
}

let revision = 0;
let installing = false;
let localSignOutInProgress = false;
let mutations: Promise<unknown> = Promise.resolve();
let refreshLifecycle: Promise<unknown> = Promise.resolve();
const listeners = new Set<(user: User | null, error?: Error) => void>();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = mutations.then(operation);
  mutations = next.catch(() => undefined);
  return next;
}

async function signOutLocally() {
  localSignOutInProgress = true;
  try {
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    assertStorageHealthy();
    if (error) throw error;
  } finally { localSignOutInProgress = false; }
}

export const supabaseAuth: AuthService = {
  async getSession() {
    try {
      const { data, error } = await getSupabaseClient().auth.getSession();
      assertStorageHealthy();
      if (error) throw error;
      if (data.session && !validSession(data.session)) throw new ApiError('unauthorized', 'Your session has expired. Please log in again.');
      return data.session ? mapUser(data.session.user) : null;
    } catch (error) { throw toAuthError(error); }
  },
  async signUp(input) {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) throw new ApiError('validation', 'Check your registration details.', 422);
    await createApiClient(env.apiBaseUrl).request('/authentication/sign-up', z.void(), {
      method: 'POST', json: parsed.data, credentials: 'omit', cache: 'no-store', redirect: 'error',
    });
    return null;
  },
  async logIn(input) {
    const operation = ++revision;
    try {
      const parsed = loginSchema.safeParse(input);
      if (!parsed.success) throw new ApiError('validation', 'Check your email and password.', 422);
      const client = getSupabaseClient();
      const tokens = await createApiClient(env.apiBaseUrl).request('/authentication/sign-in', tokenResponseSchema, {
        method: 'POST', json: parsed.data, credentials: 'omit', cache: 'no-store', redirect: 'error',
      });
      return await serialize(async () => {
        if (operation !== revision) throw new ApiError('cancelled', 'Authentication was interrupted.');
        installing = true;
        try {
          const { data, error } = await client.auth.setSession({
            access_token: tokens.access_token, refresh_token: tokens.refresh_token,
          });
          assertStorageHealthy();
          if (error) throw error;
          if (!validSession(data.session)) throw new ApiError('unauthorized', 'No valid authenticated session was returned.');
          if (operation !== revision) {
            await signOutLocally();
            throw new ApiError('cancelled', 'Authentication was interrupted.');
          }
          const user = mapUser(data.session.user);
          for (const listener of listeners) listener(user);
          return user;
        } finally { installing = false; }
      });
    } catch (error) { throw toAuthError(error); }
  },
  async logOut() {
    const operation = ++revision;
    try {
      await serialize(async () => {
        if (operation !== revision) throw new ApiError('cancelled', 'The session changed. Please try again.');
        await signOutLocally();
      });
    } catch (error) { throw toAuthError(error); }
  },
  subscribe(listener) {
    const client = getSupabaseClient();
    listeners.add(listener);
    const storageUnsubscribe = subscribeStorageErrors((error) => listener(null, error));
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || (installing && event !== 'SIGNED_OUT')) return;
      // No SDK calls inside the callback: those can deadlock the SDK session lock.
      if (event === 'SIGNED_OUT') {
        // Local operations already advanced the revision when requested. Their delayed SDK event
        // must not cancel a newer login that is waiting for a previous installation/logout.
        if (!localSignOutInProgress) revision++;
        listener(null);
      }
      else listener(validSession(session) ? mapUser(session.user) : null);
    });
    let active = true;
    const refresh = (state: string | null | undefined) => {
      refreshLifecycle = refreshLifecycle.then(async () => {
        if (active && state === 'active') await client.auth.startAutoRefresh();
        else await client.auth.stopAutoRefresh();
      }).catch((error) => { if (active) listener(null, toAuthError(error)); });
    };
    refresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      active = false;
      listeners.delete(listener);
      data.subscription.unsubscribe();
      storageUnsubscribe();
      subscription.remove();
      refresh('background');
    };
  },
};
