import { env } from '../../config/env';
import { ApiError } from '../api/ApiError';
import { toAuthError } from './errors';
import { assertStorageHealthy } from './secureStorage';
import { validSession } from './supabaseAuth';
import { getSupabaseClient } from './supabaseClient';
import type { z } from 'zod';
import { createApiClient } from '../api/client';

// Retrieve on demand at the service boundary; never cache tokens in React state or URLs.
export async function getSupabaseAccessToken(expectedUserId?: string): Promise<string> {
  if (env.authMode !== 'supabase') throw new ApiError('unauthorized', 'Log in with a real account to continue.', 401);
  try {
    const { data, error } = await getSupabaseClient().auth.getSession();
    assertStorageHealthy();
    if (error) throw error;
    const session = data.session;
    if (!validSession(session) || session.access_token === session.refresh_token
      || session.access_token === env.supabasePublishableKey || /^sb_/.test(session.access_token)) {
      throw new ApiError('unauthorized', 'Your session is missing or expired. Please log in again.', 401);
    }
    if (expectedUserId !== undefined && session.user.id !== expectedUserId) {
      throw new ApiError('cancelled', 'The account changed. Please try again.');
    }
    return session.access_token;
  } catch (error) { throw toAuthError(error); }
}

type Options = NonNullable<Parameters<ReturnType<typeof createApiClient>['request']>[2]>;
type WithoutToken<T> = T extends unknown ? Omit<T, 'accessToken'> : never;

// Opt-in only. Public services continue to use the normal client without a token.
export async function authenticatedRequest<T>(path: string, schema: z.ZodType<T>, options: WithoutToken<Options> & { expectedUserId?: string } = {}): Promise<T> {
  const { expectedUserId, ...requestOptions } = options;
  return createApiClient(env.apiBaseUrl).request(path, schema, {
    ...requestOptions, accessToken: await getSupabaseAccessToken(expectedUserId),
  });
}
