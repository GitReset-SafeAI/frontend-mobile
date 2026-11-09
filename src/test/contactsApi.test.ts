import { env } from '../config/env';
import { contactErrorKey } from '../features/account/contactErrors';
import { selectServices } from '../services';
import { apiContacts } from '../services/api/contacts';
import { getSupabaseClient } from '../services/auth/supabaseClient';
import { mockServices } from '../services/mocks';

jest.mock('../services/auth/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const OWNER = '11111111-1111-4111-8111-111111111111';
const ID = '33333333-3333-4333-8333-333333333333';
const SECOND = '44444444-4444-4444-8444-444444444444';
const input = { name: 'Amma', phone: '+94771234567', relationship: 'family' as const };
const wire = { ...input, id: ID, slot: 0 };
const session = { user: { id: OWNER }, access_token: 'test-user-access', refresh_token: 'test-user-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600 };
const getSession = jest.fn();

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status,
    text: jest.fn(async () => body === undefined ? '' : JSON.stringify(body)) } as unknown as Response;
}

describe('authenticated emergency contacts', () => {
  const original = { ...env };
  beforeEach(() => {
    env.authMode = 'supabase'; env.apiBaseUrl = 'https://example.invalid/api/v1/';
    getSession.mockReset().mockResolvedValue({ data: { session }, error: null });
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected request in contact test.'));
    jest.mocked(getSupabaseClient).mockReturnValue({ auth: { getSession } } as unknown as ReturnType<typeof getSupabaseClient>);
  });
  afterEach(() => { Object.assign(env, original); jest.restoreAllMocks(); jest.useRealTimers(); });

  it('loads validated contacts in slot order with current user authentication', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response([{ ...wire, id: SECOND, slot: 3 }, wire]));
    expect(await apiContacts.list({ userId: OWNER })).toEqual([{ ...input, id: ID }, { ...input, id: SECOND }]);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('https://example.invalid/api/v1/emergency-contacts');
    expect((options?.headers as Headers).get('Authorization')).toBe('Bearer test-user-access');
    expect(options?.body).toBeUndefined();
    expect(options).not.toHaveProperty('expectedUserId');
    expect(options).not.toHaveProperty('userId');
  });

  it('creates a contact without client-owned slot or owner fields', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response(wire, 201));
    expect(await apiContacts.add({ ...input, name: ' Amma ' }, { userId: OWNER })).toEqual({ ...input, id: ID });
    expect(fetch.mock.calls[0][1]?.method).toBe('POST');
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toEqual(input);
    expect((fetch.mock.calls[0][1]?.headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('updates the full required input and can clear an optional relationship', async () => {
    const withoutRelationship = { id: ID, slot: 0, name: input.name, phone: input.phone };
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response({ ...withoutRelationship, name: 'Updated' }));
    expect(await apiContacts.update(ID, { name: 'Updated', phone: input.phone }, { userId: OWNER }))
      .toEqual({ id: ID, name: 'Updated', phone: input.phone });
    expect(fetch.mock.calls[0][0]).toBe(`https://example.invalid/api/v1/emergency-contacts/${ID}`);
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH');
    expect(JSON.parse(fetch.mock.calls[0][1]?.body as string)).toEqual({ name: 'Updated', phone: input.phone });
  });

  it.each(['remove', 'makePrimary'] as const)('handles %s as a successful empty 204 without parsing it', async (operation) => {
    const empty = response(undefined, 204);
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(empty);
    await expect(apiContacts[operation](ID, { userId: OWNER })).resolves.toBeUndefined();
    expect(empty.text).not.toHaveBeenCalled();
    expect(fetch.mock.calls[0][0]).toBe(`https://example.invalid/api/v1/emergency-contacts/${ID}${operation === 'makePrimary' ? '/primary' : ''}`);
    expect(fetch.mock.calls[0][1]?.method).toBe(operation === 'makePrimary' ? 'POST' : 'DELETE');
    expect(fetch.mock.calls[0][1]?.body).toBeUndefined();
    expect((fetch.mock.calls[0][1]?.headers as Headers).get('Authorization')).toBe('Bearer test-user-access');
  });

  it('uses a newly refreshed token on subsequent requests', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue(response([]));
    await apiContacts.list({ userId: OWNER });
    getSession.mockResolvedValue({ data: { session: { ...session, access_token: 'refreshed-user-access' } }, error: null });
    await apiContacts.list({ userId: OWNER });
    expect((fetch.mock.calls[1][1]?.headers as Headers).get('Authorization')).toBe('Bearer refreshed-user-access');
  });

  it('maps create slot-limit errors without changing global conflict handling', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ detail: 'You can save up to five emergency contacts.' }, 409));
    await expect(apiContacts.add(input)).rejects.toMatchObject({ kind: 'limit', status: 409 });
  });

  it.each([[401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [422, 'validation'], [429, 'rate-limit'], [503, 'server']])(
    'preserves HTTP %i as %s without exposing contact input', async (status, kind) => {
      jest.spyOn(global, 'fetch').mockResolvedValue(response({ detail: [{ type: 'value_error', input: input.phone }] }, status as number));
      await expect(apiContacts.update(ID, input)).rejects.toMatchObject({ status, kind, message: expect.not.stringContaining(input.phone) });
    },
  );

  it('distinguishes reauthentication from permission denial in the existing UI error pattern', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(response(undefined, 401)).mockResolvedValueOnce(response(undefined, 403));
    for (const key of ['unauthorized', 'forbidden']) {
      try { await apiContacts.list(); throw new Error('Expected failure'); }
      catch (error) { expect(contactErrorKey(error)).toBe(`contacts.errors.${key}`); }
    }
  });

  it.each([
    { contacts: [{ ...wire, slot: 5 }] }, { contacts: [{ ...wire, slot: '0' }] },
    { contacts: [{ ...wire, id: 'invalid' }] }, { contacts: [wire, { ...wire, id: SECOND }] },
    { contacts: [{ ...wire, slot: 1 }] },
  ])('rejects malformed or inconsistent server contacts', async ({ contacts }) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response(contacts));
    await expect(apiContacts.list()).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('rejects a different contact in an update response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(response({ ...wire, id: SECOND }));
    await expect(apiContacts.update(ID, input)).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('validates input before issuing a request', async () => {
    const fetch = jest.spyOn(global, 'fetch');
    await expect(apiContacts.add({ ...input, phone: '0771234567' })).rejects.toMatchObject({ kind: 'validation' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not send an old account operation using a new account token', async () => {
    getSession.mockResolvedValue({ data: { session: { ...session, user: { id: SECOND } } }, error: null });
    const fetch = jest.spyOn(global, 'fetch');
    await expect(apiContacts.add(input, { userId: OWNER })).rejects.toMatchObject({ kind: 'cancelled' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects expired sessions and demo sessions without a backend request', async () => {
    const fetch = jest.spyOn(global, 'fetch');
    getSession.mockResolvedValue({ data: { session: { ...session, expires_at: 1 } }, error: null });
    await expect(apiContacts.list()).rejects.toMatchObject({ kind: 'unauthorized' });
    env.authMode = 'demo';
    await expect(apiContacts.list()).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supports list cancellation and safe transport failures', async () => {
    const controller = new AbortController(); controller.abort();
    const fetch = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('private transport diagnostic'));
    await expect(apiContacts.list({ userId: OWNER, signal: controller.signal })).rejects.toMatchObject({ kind: 'cancelled' });
    expect(fetch).not.toHaveBeenCalled();
    await expect(apiContacts.list()).rejects.toMatchObject({ kind: 'network', message: expect.not.stringContaining('private') });
  });

  it('reports timeouts without retrying contact creation', async () => {
    jest.useFakeTimers();
    const fetch = jest.spyOn(global, 'fetch').mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const failure = expect(apiContacts.add(input)).rejects.toMatchObject({ kind: 'timeout' });
    await jest.advanceTimersByTimeAsync(30_000); await failure;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('preserves demo/local contacts and never falls back to them for a real account', async () => {
    const fetch = jest.spyOn(global, 'fetch');
    const demo = selectServices('mock', 'demo');
    expect(demo.contacts).toBe(mockServices.contacts);
    await demo.auth.signUp({ name: 'Demo', email: 'contact-test@example.invalid', password: 'password1' });
    await demo.contacts.add(input);
    expect(await demo.contacts.list()).toEqual([expect.objectContaining(input)]);
    const localList = jest.spyOn(mockServices.contacts, 'list'); localList.mockClear();
    await expect(selectServices('mock', 'supabase').contacts.list()).rejects.toMatchObject({ kind: 'not-implemented' });
    expect(localList).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    expect(selectServices('api', 'supabase').contacts).toBe(apiContacts);
  });
});
