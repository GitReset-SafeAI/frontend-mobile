import type { z } from 'zod';

import { ApiError, httpError, normalizeApiError } from './ApiError';

type RequestOptions = Omit<RequestInit, 'body'> & {
  // Only a signed-in user's access token; never a Supabase API key.
  accessToken?: string;
  timeoutMs?: number;
} & ({ json: unknown; body?: never } | { json?: never; body?: RequestInit['body'] });

const API_PREFIX = '/api/v1';

function requestUrl(baseUrl: string, path: string) {
  // Keep existing fully-prefixed callers compatible with origin or prefixed base URLs.
  const base = baseUrl.trim().replace(/\/+$/, '').replace(/(?:\/api\/v1)+$/, '');
  let relative = path;
  while (/^\/api\/v1(?=\/|\?|$)/.test(relative)) relative = relative.slice(API_PREFIX.length);
  return `${base}${API_PREFIX}${relative}`;
}

export function createApiClient(baseUrl?: string, timeoutMs = 30_000) {
  return {
    async request<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<T> {
      if (!baseUrl) throw new ApiError('configuration', 'The API base URL has not been configured.');
      // Only relative API paths are accepted; callers cannot redirect this client.
      if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('\\') || path.includes('#')) {
        throw new ApiError('configuration', 'An API-relative path is required.');
      }

      const { accessToken, timeoutMs: requestTimeout = timeoutMs, json, ...fetchOptions } = options;
      if (!Number.isFinite(requestTimeout) || requestTimeout <= 0) {
        throw new ApiError('configuration', 'A positive request timeout is required.');
      }
      if ('json' in options && (json === undefined || options.body != null)) {
        throw new ApiError('configuration', 'Provide either a JSON value or a raw request body.');
      }
      const token = accessToken?.trim();
      if (accessToken !== undefined && (!token || /\s/.test(token) || /^(?:undefined|null)$/.test(token)
        || /^sb_(publishable|secret)_/.test(token))) {
        throw new ApiError('configuration', 'A user access token is required for authorization.');
      }

      const headers = new Headers(options.headers);
      headers.set('Accept', 'application/json');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      let requestBody = options.body;
      if ('json' in options) {
        try { requestBody = JSON.stringify(json); }
        catch { throw new ApiError('configuration', 'The JSON request body could not be serialized.'); }
        if (requestBody === undefined) throw new ApiError('configuration', 'A serializable JSON value is required.');
        headers.set('Content-Type', 'application/json');
      }

      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      if (options.signal?.aborted) controller.abort();
      options.signal?.addEventListener('abort', abort);
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, requestTimeout);

      try {
        if (controller.signal.aborted) throw new ApiError('cancelled', 'The request was cancelled.');
        const response = await fetch(requestUrl(baseUrl, path), {
          ...fetchOptions,
          body: requestBody,
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          let errorBody: unknown;
          try {
            const text = await response.text();
            if (text.length <= 8192) errorBody = JSON.parse(text);
          } catch { /* Empty, unreadable and non-JSON errors retain their HTTP status. */ }
          throw httpError(response.status, errorBody);
        }

        let body: unknown;
        // Use z.void() for empty-response operations. JSON callers retain their precise return type,
        // and an unexpected empty response fails schema validation rather than pretending success.
        if (response.status !== 204 && response.status !== 205) {
          try {
            const text = await response.text();
            if (text.trim()) body = JSON.parse(text);
          } catch { throw new ApiError('invalid-response', 'The server returned an unreadable response.', response.status); }
        }
        const result = schema.safeParse(body);
        if (!result.success) throw new ApiError('invalid-response', 'The server response did not match the expected format.', response.status);
        return result.data;
      } catch (error) {
        if (timedOut) throw new ApiError('timeout', 'The request timed out. Please try again.');
        if (controller.signal.aborted) throw new ApiError('cancelled', 'The request was cancelled.');
        throw normalizeApiError(error);
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      }
    },
  };
}
