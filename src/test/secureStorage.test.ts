import * as SecureStore from 'expo-secure-store';

import { assertStorageHealthy, secureStorage, subscribeStorageErrors } from '../services/auth/secureStorage';

describe('native session storage', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  it('round-trips a large Unicode session with each native value below 2 KB', async () => {
    const value = JSON.stringify({ session: 'සිංහල தமிழ் 🌍'.repeat(900) });
    const writes = jest.spyOn(SecureStore, 'setItemAsync');
    await secureStorage.setItem('test-session', value);
    expect(await secureStorage.getItem('test-session')).toBe(value);
    expect(writes.mock.calls.length).toBeGreaterThan(2);
    expect(writes.mock.calls.every(([, chunk]) => Buffer.byteLength(chunk, 'utf8') < 2048)).toBe(true);
    await secureStorage.removeItem('test-session');
    expect(await secureStorage.getItem('test-session')).toBeNull();
  });

  it('replaces a previous generation without mixing session contents', async () => {
    await secureStorage.setItem('replace-session', 'first'.repeat(800));
    await secureStorage.setItem('replace-session', 'second');
    expect(await secureStorage.getItem('replace-session')).toBe('second');
  });

  it('rejects oversized values explicitly and retains the previously committed session', async () => {
    await secureStorage.setItem('oversized-session', 'previous');
    await expect(secureStorage.setItem('oversized-session', 'x'.repeat(51_201))).rejects.toMatchObject({ kind: 'configuration', message: expect.stringContaining('too large') });
    expect(await secureStorage.getItem('oversized-session')).toBe('previous');
  });

  it.each(['getItemAsync', 'setItemAsync', 'deleteItemAsync'] as const)('surfaces %s failure without exposing native diagnostics', async (method) => {
    await secureStorage.setItem('failure-session', 'saved');
    const listener = jest.fn();
    const unsubscribe = subscribeStorageErrors(listener);
    const spy = jest.spyOn(SecureStore, method);
    const original = spy.getMockImplementation()!;
    spy.mockRejectedValueOnce(new Error('private native diagnostic'));
    try {
      const action = method === 'getItemAsync' ? secureStorage.getItem('failure-session')
        : method === 'setItemAsync' ? secureStorage.setItem('failure-session', 'replacement')
          : secureStorage.removeItem('failure-session');
      await expect(action).rejects.toMatchObject({ kind: 'configuration', message: expect.not.stringContaining('private') });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ kind: 'configuration' }));
      expect(() => assertStorageHealthy()).toThrow('Secure session storage is unavailable');
    } finally { unsubscribe(); spy.mockImplementation(original); }
  });

  it('cleans an interrupted generation and preserves the last committed session', async () => {
    await secureStorage.setItem('interrupted-session', 'previous');
    const original = jest.mocked(SecureStore.setItemAsync).getMockImplementation()!;
    let writes = 0;
    const spy = jest.spyOn(SecureStore, 'setItemAsync').mockImplementation(async (...args) => {
      writes++;
      if (writes === 3) throw new Error('Interrupted second chunk.');
      return original(...args);
    });
    await expect(secureStorage.setItem('interrupted-session', 'next'.repeat(600))).rejects.toMatchObject({ kind: 'configuration' });
    spy.mockImplementation(original);
    expect(await secureStorage.getItem('interrupted-session')).toBe('previous');
    await secureStorage.removeItem('interrupted-session');
    expect(await secureStorage.getItem('interrupted-session')).toBeNull();
  });
});
