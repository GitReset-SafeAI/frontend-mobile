import { env } from '../config/env';
import i18n from '../i18n';
import { ApiError } from '../services/api/ApiError';
import { buildReportRequest, reportLanguageHint, savedReportSchema, submitApiReport } from '../services/api/reports';
import { getSupabaseClient } from '../services/auth/supabaseClient';
import { reportErrorKey } from '../features/reporting/reportErrors';

jest.mock('../services/auth/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const OWNER = '11111111-1111-4111-8111-111111111111';
const ID = '33333333-3333-4333-8333-333333333333';
const input = { description: 'Someone followed me home.', inputMethod: 'typed' as const };
const saved = { id: ID, submitted_at: '2026-11-09T12:00:00Z', original_text: input.description,
  translated_text: input.description, input_method: 'text', language_hint: 'en' };
const getSession = jest.fn();
const session = { user: { id: OWNER }, access_token: 'test-user-access', refresh_token: 'test-user-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600 };
function response(body: unknown, status = 201) {
  return { ok: status >= 200 && status < 300, status,
    text: jest.fn(async () => body === undefined ? '' : JSON.stringify(body)) } as unknown as Response;
}

describe('report creation contract', () => {
  const original = { ...env };
  beforeEach(async () => {
    env.authMode = 'supabase'; env.apiBaseUrl = 'https://example.invalid/api/v1/';
    await i18n.changeLanguage('en');
    getSession.mockReset().mockResolvedValue({ data: { session }, error: null });
    jest.mocked(getSupabaseClient).mockReturnValue({ auth: { getSession } } as unknown as ReturnType<typeof getSupabaseClient>);
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected network request.'));
  });
  afterEach(() => { Object.assign(env, original); jest.restoreAllMocks(); jest.useRealTimers(); });

  it.each([['en', 'en'], ['si', 'si'], ['ta', 'ta'], ['si-LK', 'si'], ['en-US', 'en']])('maps temporary interface language %s', (language, expected) => {
    expect(reportLanguageHint(language)).toBe(expected);
  });
  it('rejects unsupported interface languages instead of guessing', () => {
    expect(() => reportLanguageHint('fr')).toThrow(ApiError);
  });
  it('constructs only supported fields and never supplies a fake translation', () => {
    expect(buildReportRequest({ ...input, lighting: 'dim', location: { latitude: 6.9, longitude: 79.8, source: 'district', districtId: 'colombo' } }, 'ta'))
      .toEqual({ original_text: input.description, input_method: 'text', language_hint: 'ta', lighting_condition: 'PARTIALLY_LIT', latitude: 6.9, longitude: 79.8 });
    expect(buildReportRequest(input, 'en')).not.toHaveProperty('occurred_at');
    expect(buildReportRequest(input, 'en')).not.toHaveProperty('latitude');
  });
  it('maps a specific date and clock time with an explicit Sri Lanka timezone', () => {
    expect(buildReportRequest({ ...input, incidentDate: '2026-11-09', clockTime: '17:30' }, 'en'))
      .toMatchObject({ occurred_at: '2026-11-09T17:30:00+05:30', reported_time: '5:30 PM' });
    expect(buildReportRequest({ ...input, clockTime: '02:30' }, 'en')).toMatchObject({ reported_time: '2:30 AM' });
    expect(buildReportRequest({ ...input, clockTime: '02:30' }, 'en')).not.toHaveProperty('occurred_at');
  });
  it.each(['morning', 'afternoon', 'evening', 'night', 'late_night', 'not_sure'] as const)('maps period %s without inventing a date', (timePeriod) => {
    expect(buildReportRequest({ ...input, timePeriod }, 'si')).toEqual({ original_text: input.description, input_method: 'text', language_hint: 'si', reported_time: timePeriod });
  });
  it.each([
    { incidentDate: '2026-02-30', clockTime: '17:00' }, { incidentDate: '0000-01-01', clockTime: '17:00' },
    { incidentDate: '2026-11-09' }, { clockTime: '25:00' }, { clockTime: '12:30', timePeriod: 'morning' as const },
    { location: { latitude: 91, longitude: 79, source: 'device' as const } },
  ])('rejects invalid date/time/coordinates: %j', (invalid) => {
    expect(() => buildReportRequest({ ...input, ...invalid }, 'en')).toThrow(ApiError);
  });
  it('submits with the current access token and extracts UUID and submission time from 201', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response(saved));
    expect(await submitApiReport(input, { userId: OWNER })).toEqual({ reportId: ID, submittedAt: saved.submitted_at, originalText: saved.original_text });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://example.invalid/api/v1/reports');
    expect(options?.method).toBe('POST');
    expect((options?.headers as Headers).get('Authorization')).toBe('Bearer test-user-access');
    expect(JSON.parse(options?.body as string)).toEqual({ original_text: input.description, input_method: 'text', language_hint: 'en' });
    expect(options).not.toHaveProperty('expectedUserId');
  });
  it('uses the currently selected interface language at submission', async () => {
    await i18n.changeLanguage('si');
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response({ ...saved, language_hint: 'si' }));
    await submitApiReport(input, { userId: OWNER });
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string).language_hint).toBe('si');
  });
  it('rejects a missing session before sending any request', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(submitApiReport(input)).rejects.toMatchObject({ kind: 'unauthorized', status: 401 });
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it('rejects an account switch before sending a report', async () => {
    await expect(submitApiReport(input, { userId: 'another-owner' })).rejects.toMatchObject({ kind: 'cancelled' });
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([401, 403, 422, 429, 503])('preserves HTTP %s errors without showing success or retrying', async (status) => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response({ detail: [{ loc: ['body', 'original_text'], msg: 'Private input', type: 'missing' }] }, status));
    await expect(submitApiReport(input)).rejects.toMatchObject({ status });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('keeps unauthorized, forbidden and uncertain submission messages distinct', () => {
    expect(reportErrorKey(new ApiError('unauthorized', '', 401))).toBe('errors.unauthorized');
    expect(reportErrorKey(new ApiError('forbidden', '', 403))).toBe('errors.forbidden');
    expect(reportErrorKey(new ApiError('timeout', ''))).toBe('errors.uncertain');
  });
  it('preserves network failures and never automatically retries', async () => {
    await expect(submitApiReport(input)).rejects.toMatchObject({ kind: 'network' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  it('represents the longer request timeout as uncertain persistence without retrying', async () => {
    jest.useFakeTimers();
    jest.spyOn(global, 'fetch').mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => { reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })); });
    }));
    const pending = submitApiReport(input);
    const failure = expect(pending).rejects.toMatchObject({ kind: 'timeout' });
    await jest.advanceTimersByTimeAsync(90_000);
    await failure;
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(reportErrorKey(new ApiError('timeout', ''))).toBe('errors.uncertain');
  });
  it.each([{ ...saved, id: 'fake' }, { ...saved, submitted_at: '2026-11-09T12:00:00' }, { ...saved, translated_text: null }, undefined])('rejects an unexpected saved-report response', async (body) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(body, body === undefined ? 204 : 201));
    await expect(submitApiReport(input)).rejects.toMatchObject({ kind: 'invalid-response' });
  });
  it('accepts saved reports without AI analysis', () => {
    expect(savedReportSchema.safeParse(saved).success).toBe(true);
    expect(savedReportSchema.safeParse({ ...saved, latitude: 6.9, longitude: null }).success).toBe(false);
  });
});
