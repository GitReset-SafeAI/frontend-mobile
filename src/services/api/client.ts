import type { z } from 'zod';

import { ApiError, httpError, normalizeApiError } from './ApiError';

type RequestOptions = Omit<RequestInit, 'signal'> & { signal?: AbortSignal };

export function createApiClient(baseUrl?: string, timeoutMs = 10_000) {
  return {
    async request<T>(path: string, schema: z.ZodType<T>, options: RequestOptions = {}): Promise<T> {
      if (!baseUrl) throw new ApiError('configuration', 'The API base URL has not been configured.');
      // Only relative API paths are accepted; callers cannot redirect this client.
      if (!path.startsWith('/') || path.startsWith('//') || path.includes('://') || path.includes('\\') || path.includes('#')) {
        throw new ApiError('configuration', 'An API-relative path is required.');
      }

      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      if (options.signal?.aborted) controller.abort();
      options.signal?.addEventListener('abort', abort);
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

      try {
        const headers = new Headers(options.headers);
        headers.set('Accept', 'application/json');
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}${path}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        if (!response.ok) throw httpError(response.status);

        let body: unknown;
        try { body = await response.json(); }
        catch { throw new ApiError('invalid-response', 'The server returned an unreadable response.'); }
        const result = schema.safeParse(body);
        if (!result.success) throw new ApiError('invalid-response', 'The server response did not match the expected format.');
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
