import { AppState, type AppStateStatus } from 'react-native';
import { z } from 'zod';

import { env } from '../config/env';
import { createApiClient } from '../services/api/client';
import { authenticatedRequest, getSupabaseAccessToken } from '../services/auth/accessToken';
import { getSupabaseClient } from '../services/auth/supabaseClient';
import { loginSchema, supabaseAuth, tokenResponseSchema } from '../services/auth/supabaseAuth';
import { registrationSchema } from '../services/contracts/account';
import { selectServices } from '../services';
import { mockServices } from '../services/mocks';

jest.mock('../services/auth/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const user = { id: 'test-user', email: 'user@example.invalid', user_metadata: { name: 'Example User' } };
const session = { user, access_token: 'test-access-token', refresh_token: 'test-refresh-token', expires_at: Math.floor(Date.now() / 1000) + 3600 };
const tokens = { access_token: session.access_token, refresh_token: session.refresh_token, token_type: 'bearer', expires_in: 3600 };
const registration = { name: ' Example User ', email: 'user@example.invalid', password: ' password-with-spaces ', nic: '200012345678', phone_number: '+94771234567' };
const auth = {
  getSession: jest.fn(), setSession: jest.fn(), signOut: jest.fn(),
  startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn(), onAuthStateChange: jest.fn(),
};
function reply(body: unknown, status = 200) {
  return { ok: status < 400, status, text: async () => JSON.stringify(body) } as Response;
}

describe('FastAPI login and Supabase sessions', () => {
  const original = { ...env };
  beforeEach(() => {
    env.authMode = 'supabase'; env.apiBaseUrl = 'https://example.invalid';
    Object.values(auth).forEach((mock) => mock.mockReset());
    jest.mocked(getSupabaseClient).mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabaseClient>);
    auth.getSession.mockResolvedValue({ data: { session }, error: null });
    auth.setSession.mockResolvedValue({ data: { session }, error: null });
    auth.signOut.mockResolvedValue({ error: null });
    auth.startAutoRefresh.mockResolvedValue(undefined); auth.stopAutoRefresh.mockResolvedValue(undefined);
  });
  afterEach(() => { Object.assign(env, original); jest.restoreAllMocks(); });

  it('sends the exact registration payload, accepts 204, and establishes no session', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(reply(undefined, 204));
    expect(await supabaseAuth.signUp(registration)).toBeNull();
    expect(fetch.mock.calls[0][0]).toBe('https://example.invalid/api/v1/authentication/sign-up');
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toEqual({ ...registration, name: 'Example User' });
    expect((fetch.mock.calls[0][1]?.headers as Headers).has('Authorization')).toBe(false);
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it('validates both NIC formats, required phone, and preserves password whitespace', () => {
    expect(registrationSchema.parse(registration).password).toBe(registration.password);
    expect(registrationSchema.safeParse({ ...registration, nic: '991234567V' }).success).toBe(true);
    for (const patch of [{ nic: 'invalid' }, { phone_number: '' }, { name: ' ' }, { password: 'short' }]) {
      expect(registrationSchema.safeParse({ ...registration, ...patch }).success).toBe(false);
    }
    expect(loginSchema.parse({ email: ' user@example.invalid ', password: ' p ' })).toEqual({ email: 'user@example.invalid', password: ' p ' });
  });

  it('logs in through FastAPI, installs the returned session, and maps the SDK user', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(reply(tokens));
    expect(await supabaseAuth.logIn({ email: ' user@example.invalid ', password: ' p ' }))
      .toEqual({ id: user.id, email: user.email, name: 'Example User' });
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toEqual({ email: user.email, password: ' p ' });
    expect(auth.setSession).toHaveBeenCalledWith({ access_token: session.access_token, refresh_token: session.refresh_token });
  });

  it.each([{ access_token: '' }, { refresh_token: '' }, { token_type: 'other' }, { expires_in: 0 }, { expires_in: 1.5 }])('rejects malformed login tokens (%j)', async (patch) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(reply({ ...tokens, ...patch }));
    await expect(supabaseAuth.logIn({ email: user.email, password: 'test' })).rejects.toMatchObject({ kind: 'invalid-response' });
    expect(auth.setSession).not.toHaveBeenCalled();
  });

  it('normalizes bearer casing consistently', () => {
    expect(tokenResponseSchema.parse({ ...tokens, token_type: 'BEARER' }).token_type).toBe('bearer');
  });

  it.each([
    { data: { session: null }, error: null },
    { data: { session: null }, error: new Error('private session-install diagnostic') },
  ])('does not authenticate when session installation fails', async (result) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(reply(tokens));
    auth.setSession.mockResolvedValue(result);
    await expect(supabaseAuth.logIn({ email: user.email, password: 'test' })).rejects.toMatchObject({ message: expect.not.stringContaining('private') });
  });

  it('restores users, handles no session, and refuses an expired session', async () => {
    expect(await supabaseAuth.getSession()).toMatchObject({ id: user.id });
    auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    expect(await supabaseAuth.getSession()).toBeNull();
    auth.getSession.mockResolvedValueOnce({ data: { session: { ...session, expires_at: 1 } }, error: null });
    await expect(supabaseAuth.getSession()).rejects.toMatchObject({ kind: 'unauthorized' });
  });

  it('uses the current access token only for explicitly protected requests', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(reply({ ok: true }));
    await authenticatedRequest('/test-protected', z.object({ ok: z.boolean() }));
    expect((fetch.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBe(`Bearer ${session.access_token}`);
    await createApiClient(env.apiBaseUrl).request('/test-public', z.object({ ok: z.boolean() }));
    expect((fetch.mock.calls[1][1]?.headers as Headers).has('Authorization')).toBe(false);
    for (const access_token of [session.refresh_token, 'sb_publishable_test']) {
      auth.getSession.mockResolvedValueOnce({ data: { session: { ...session, access_token } }, error: null });
      await expect(getSupabaseAccessToken()).rejects.toMatchObject({ kind: 'unauthorized' });
    }
  });

  it.each([[401, 'unauthorized'], [403, 'forbidden'], [429, 'rate-limit'], [503, 'server']])('keeps HTTP %i distinguishable', async (status, kind) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(reply({ detail: 'Request could not be completed.' }, status as number));
    await expect(supabaseAuth.logIn({ email: user.email, password: 'test' })).rejects.toMatchObject({ status, kind });
  });

  it('handles SDK events and foreground refresh with cleanup', async () => {
    let event: (name: string, value: typeof session | null) => void = () => undefined;
    const unsubscribe = jest.fn(); const remove = jest.fn();
    let change: (state: AppStateStatus) => void = () => undefined;
    auth.onAuthStateChange.mockImplementation((callback) => { event = callback; return { data: { subscription: { unsubscribe } } }; });
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, callback) => {
      change = callback; return { remove };
    });
    const listener = jest.fn();
    const stop = supabaseAuth.subscribe!(listener);
    event('INITIAL_SESSION', session); expect(listener).not.toHaveBeenCalled();
    event('SIGNED_IN', session); expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ id: user.id }));
    event('TOKEN_REFRESHED', session); expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ id: user.id }));
    event('SIGNED_OUT', null); expect(listener).toHaveBeenLastCalledWith(null);
    change('active'); change('background');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(auth.startAutoRefresh).toHaveBeenCalled(); expect(auth.stopAutoRefresh).toHaveBeenCalled();
    stop(); expect(remove).toHaveBeenCalled(); expect(unsubscribe).toHaveBeenCalled();
  });

  it('does not install an older login response after logout', async () => {
    let resolve!: (value: Response) => void;
    jest.spyOn(global, 'fetch').mockReturnValue(new Promise((done) => { resolve = done; }));
    const pending = supabaseAuth.logIn({ email: user.email, password: 'test' });
    const assertion = expect(pending).rejects.toMatchObject({ kind: 'cancelled' });
    await supabaseAuth.logOut();
    resolve(reply(tokens)); await assertion;
    expect(auth.setSession).not.toHaveBeenCalled();
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('allows a newer login to complete after rolling back a stale session installation', async () => {
    let event: (name: string, value: typeof session | null) => void = () => undefined;
    auth.onAuthStateChange.mockImplementation((callback) => { event = callback; return { data: { subscription: { unsubscribe: jest.fn() } } }; });
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() });
    auth.signOut.mockImplementation(async () => { event('SIGNED_OUT', null); return { error: null }; });
    const stop = supabaseAuth.subscribe!(jest.fn());
    jest.spyOn(global, 'fetch').mockResolvedValue(reply(tokens));
    let installed!: () => void;
    const entered = new Promise<void>((resolve) => { installed = resolve; });
    let finish!: (value: unknown) => void;
    auth.setSession.mockImplementationOnce(() => { installed(); return new Promise((resolve) => { finish = resolve; }); });
    const older = supabaseAuth.logIn({ email: user.email, password: 'test' });
    const rejected = expect(older).rejects.toMatchObject({ kind: 'cancelled' });
    await entered;
    const newer = supabaseAuth.logIn({ email: user.email, password: 'test' });
    finish({ data: { session }, error: null });
    await rejected;
    await expect(newer).resolves.toMatchObject({ id: user.id });
    stop();
  });

  it('keeps demo authentication independent from public data selection', () => {
    expect(selectServices('api', 'demo').auth).toBe(mockServices.auth);
    expect(selectServices('mock', 'supabase').auth).toBe(supabaseAuth);
    expect(selectServices('mock', 'supabase').safetyMap).toBe(mockServices.safetyMap);
    expect(selectServices('mock', 'supabase').contacts).not.toBe(mockServices.contacts);
  });
});
