import { z } from 'zod';

import { ApiError, normalizeApiError } from '../services/api/ApiError';
import { createApiClient } from '../services/api/client';

const schema = z.object({ value: z.string() });
// Test-only path and reserved domain; these are not proposed backend endpoints.
const client = createApiClient('https://example.invalid');

function response(body = '', status = 200) {
  return { ok: status >= 200 && status < 300, status, text: jest.fn(async () => body) } as unknown as Response;
}

describe('API boundary', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers(); });

  it('requires configuration before any request', async () => {
    const spy = jest.spyOn(global, 'fetch');
    await expect(createApiClient().request('/test-only', schema)).rejects.toMatchObject({ kind: 'configuration' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('validates JSON and preserves caller headers', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"synthetic"}'));
    await expect(client.request('/test-only', schema, { headers: { 'X-Test': 'example' } }))
      .resolves.toEqual({ value: 'synthetic' });
    const headers = spy.mock.calls[0][1]?.headers as Headers;
    expect(headers.get('X-Test')).toBe('example');
    expect(headers.get('Accept')).toBe('application/json');
  });

  it.each([
    [401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [409, 'conflict'],
    [413, 'payload-too-large'], [415, 'unsupported-media-type'], [422, 'validation'],
    [429, 'rate-limit'], [503, 'server'],
  ])(
    'preserves HTTP %i and categorizes empty errors', async (status, kind) => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response('', status as number));
      await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind, status });
    },
  );

  it('rejects malformed successful responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response('{"unexpected":true}'));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it.each([
    ['https://example.invalid', '/health'],
    ['https://example.invalid/', '/api/v1/health'],
    ['https://example.invalid/api/v1', '/health'],
    ['https://example.invalid/api/v1/', '/api/v1/health'],
  ])('applies the API prefix once for %s and %s', async (baseUrl, path) => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"ok"}'));
    await createApiClient(baseUrl).request(path, schema);
    expect(spy.mock.calls[0][0]).toBe('https://example.invalid/api/v1/health');
  });

  it('preserves deployment path prefixes and query parameters', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"ok"}'));
    await createApiClient('https://example.invalid/backend/api/v1/').request('/api/v1/places?q=Fort', schema);
    expect(spy.mock.calls[0][0]).toBe('https://example.invalid/backend/api/v1/places?q=Fort');
  });

  it('injects an optional user token without forwarding client-only options', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"ok"}'));
    await client.request('/test-only', schema);
    expect((spy.mock.calls[0][1]?.headers as Headers).has('Authorization')).toBe(false);
    await client.request('/test-only', schema, { accessToken: 'test-user-access-token', timeoutMs: 60_000 });
    const options = spy.mock.calls[1][1];
    expect((options?.headers as Headers).get('Authorization')).toBe('Bearer test-user-access-token');
    expect(options).not.toHaveProperty('accessToken');
    expect(options).not.toHaveProperty('timeoutMs');
  });

  it.each(['', '   ', 'undefined', 'null', 'invalid token', 'sb_publishable_test', 'sb_secret_test'])(
    'rejects an empty or invalid token without making a request (%j)', async (accessToken) => {
      const spy = jest.spyOn(global, 'fetch');
      await expect(client.request('/test-only', schema, { accessToken })).rejects.toMatchObject({ kind: 'configuration' });
      expect(spy).not.toHaveBeenCalled();
    },
  );

  it('serializes explicit JSON and preserves raw binary bodies and content types', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"ok"}'));
    await client.request('/test-only', schema, { method: 'POST', json: { example: true } });
    expect(spy.mock.calls[0][1]?.body).toBe('{"example":true}');
    expect((spy.mock.calls[0][1]?.headers as Headers).get('Content-Type')).toBe('application/json');
    expect(spy.mock.calls[0][1]).not.toHaveProperty('json');
    const body = new Uint8Array([82, 73, 70, 70]);
    await client.request('/test-only', schema, { method: 'PATCH', body, headers: { 'Content-Type': 'audio/wav' } });
    expect(spy.mock.calls[1][1]?.body).toBe(body);
    expect(spy.mock.calls[1][1]?.method).toBe('PATCH');
    expect((spy.mock.calls[1][1]?.headers as Headers).get('Content-Type')).toBe('audio/wav');
    await client.request('/test-only', schema, { method: 'POST', body });
    expect((spy.mock.calls[2][1]?.headers as Headers).has('Content-Type')).toBe(false);
  });

  it('keeps existing pre-serialized JSON requests compatible', async () => {
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(response('{"value":"ok"}'));
    await client.request('/test-only', schema, {
      method: 'POST', body: '{"existing":true}', headers: { 'Content-Type': 'application/json' },
    });
    expect(spy.mock.calls[0][1]?.body).toBe('{"existing":true}');
  });

  it('accepts 204 with a void schema without reading a body', async () => {
    const empty = response('', 204);
    const spy = jest.spyOn(global, 'fetch').mockResolvedValue(empty);
    await expect(client.request('/test-only', z.void(), { method: 'DELETE' })).resolves.toBeUndefined();
    expect(empty.text).not.toHaveBeenCalled();
    expect(spy.mock.calls[0][1]?.method).toBe('DELETE');
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind: 'invalid-response', status: 204 });
    expect(empty.text).not.toHaveBeenCalled();
  });

  it.each(['', '   ', '<html>unexpected response</html>'])('handles an unexpected JSON body (%j)', async (body) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(body));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({ kind: 'invalid-response', status: 200 });
  });

  it('allows an empty 200 response only when its schema accepts it', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response());
    await expect(client.request('/test-only', z.void())).resolves.toBeUndefined();
  });

  it.each(['detail', 'message'])('extracts a short backend %s', async (key) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(JSON.stringify({ [key]: 'Confirm your email before logging in.' }), 403));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({
      status: 403, message: 'Confirm your email before logging in.',
    });
  });

  it('summarizes FastAPI validation issues without echoing input, context or custom messages', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(JSON.stringify({ detail: [
      { type: 'missing', loc: ['body', 'password'], msg: 'sensitive custom message', input: 'private input' },
      { type: 'value_error', ctx: { error: 'private context' } },
    ] }), 422));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({
      kind: 'validation', status: 422, message: 'A required field is missing. One or more input values are invalid.',
    });
  });

  it.each([
    [503, '{"detail":"database password=private-value"}'],
    [422, '{"detail":"Traceback: internal exception"}'],
    [422, '{"detail":"user@example.invalid is invalid"}'],
    [503, '<html>private diagnostics</html>'],
  ])('uses a safe fallback for HTTP %i diagnostics', async (status, body) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(body as string, status as number));
    await expect(client.request('/test-only', schema)).rejects.toMatchObject({
      status, message: status === 503 ? 'The service is temporarily unavailable. Please try again later.' : 'Check the submitted information.',
    });
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

  it('allows a request timeout longer than the default without retrying', async () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(global, 'fetch').mockImplementation((_input, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const assertion = expect(client.request('/test-only', schema, { method: 'POST', timeoutMs: 60_000 }))
      .rejects.toMatchObject({ kind: 'timeout' });
    await jest.advanceTimersByTimeAsync(30_000);
    expect(spy.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await jest.advanceTimersByTimeAsync(30_000);
    await assertion;
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('distinguishes caller cancellation from timeout', async () => {
    const controller = new AbortController();
    jest.spyOn(global, 'fetch').mockImplementation((_input, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const assertion = expect(client.request('/test-only', schema, { signal: controller.signal }))
      .rejects.toMatchObject({ kind: 'cancelled' });
    controller.abort();
    await assertion;
  });
});
