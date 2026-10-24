import { z } from 'zod';

import { ApiError, normalizeApiError } from '../services/api/ApiError';
import { createApiClient } from '../services/api/client';

const schema = z.object({ value: z.string() });
// Test-only path and reserved domain; these are not proposed backend endpoints.
const client = createApiClient('https://example.invalid');

describe('API boundary', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  it('requires configuration before any request', async () => {
    const spy = jest.spyOn(global, 'fetch');
    await expect(createApiClient().request('/test-only', schema)).rejects.toMatchObject({ kind: 'configuration' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('validates JSON and preserves caller headers', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true, json: async () => ({ value: 'synthetic' }),
    } as Response);
    await expect(client.request('/test-only', schema, { headers: { 'X-Test': 'example' } }))
      .resolves.toEqual({ value: 'synthetic' });
    const headers = spy.mock.calls[0][1]?.headers as Headers;
    expect(headers.get('X-Test')).toBe('example');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it.each([[401, 'unauthorized'], [403, 'forbidden'], [422, 'validation'], [503, 'server']])(
    'normalizes HTTP %i without exposing response contents', async (status, kind) => {
      const readBody = jest.fn();
      jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status, json: readBody } as unknown as Response);
      await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind, status });
      expect(readBody).not.toHaveBeenCalled();
    },
  );

  it('rejects malformed successful responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ unexpected: true }) } as Response);
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('normalizes transport errors without exposing their details', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new TypeError('synthetic transport detail'));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({
      kind: 'network', message: 'Unable to connect. Please try again.',
    });
    const error = new ApiError('not-implemented', 'Not connected.');
    expect(normalizeApiError(error)).toBe(error);
  });

  it('aborts stalled requests and reports a timeout', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockImplementation((_input, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const assertion = expect(createApiClient('https://example.invalid', 100).request('/test-only', schema))
      .rejects.toMatchObject({ kind: 'timeout' });
    await jest.advanceTimersByTimeAsync(100);
    await assertion;
  });
});
