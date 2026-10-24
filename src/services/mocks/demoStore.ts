import * as SecureStore from 'expo-secure-store';

// Demo-only persistence so sign-in and contacts survive restarting the app. Everything here is synthetic: the
// demo account stores no password, and this module is only reachable in mock mode. It uses the platform's
// secure storage (Keychain / Keystore) because phone numbers are personal data, even in a demo. If secure
// storage is unavailable, reads and writes fall back to memory for the session.
const memory = new Map<string, string>();

export async function readJson(key: string): Promise<unknown> {
  let raw: string | null;
  try {
    raw = await SecureStore.getItemAsync(key);
  } catch {
    raw = memory.get(key) ?? null;
  }
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    await SecureStore.setItemAsync(key, raw);
  } catch {
    // The memory copy is enough for this session.
  }
}

export async function removeKey(key: string): Promise<void> {
  memory.delete(key);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Nothing to clean up.
  }
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
