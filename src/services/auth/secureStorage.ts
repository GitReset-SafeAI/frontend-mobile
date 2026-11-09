import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { ApiError } from '../api/ApiError';

// 400 Unicode code points occupy at most 1600 UTF-8 bytes, below historical native limits.
// Every chunk AND the commit pointer live in SecureStore. There is no plaintext fallback.
const CHUNK_SIZE = 400;
const MAX_CHUNKS = 128;
const partSchema = z.object({
  generation: z.string().regex(/^[a-z0-9-]{1,80}$/),
  count: z.number().int().min(1).max(MAX_CHUNKS),
});
const manifestSchema = z.object({ active: partSchema.nullable(), pending: z.array(partSchema).max(2) });
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const listeners = new Set<(error: ApiError) => void>();
let lastError: ApiError | null = null;
let pending: Promise<unknown> = Promise.resolve();

export function subscribeStorageErrors(listener: (error: ApiError) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function assertStorageHealthy() {
  if (lastError) throw lastError;
}

function operate<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(async () => {
    try {
      const value = await operation();
      lastError = null;
      return value;
    } catch (cause) {
      const error = cause instanceof ApiError ? cause
        : new ApiError('configuration', 'Secure session storage is unavailable. Unlock your device and try again.');
      lastError = error;
      for (const listener of listeners) listener(error);
      throw error;
    }
  });
  // The sequencing promise must not retain the returned session string after a read completes.
  pending = result.then(() => undefined, () => undefined);
  return result;
}

function keyFor(key: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(key)) throw new Error('Unsupported storage key.');
  return `safestep.auth.${key}`;
}

async function readManifest(key: string) {
  const raw = await SecureStore.getItemAsync(key, options);
  return raw === null ? null : manifestSchema.parse(JSON.parse(raw));
}

async function deletePart(base: string, part: z.infer<typeof partSchema>) {
  for (let index = 0; index < part.count; index++) {
    await SecureStore.deleteItemAsync(`${base}.${part.generation}.${index}`, options);
  }
}

async function cleanPending(base: string, manifest: z.infer<typeof manifestSchema>) {
  for (const part of manifest.pending) await deletePart(base, part);
  if (manifest.pending.length) {
    await SecureStore.setItemAsync(base, JSON.stringify({ active: manifest.active, pending: [] }), options);
  }
}

export const secureStorage = {
  getItem(key: string): Promise<string | null> {
    return operate(async () => {
      const base = keyFor(key);
      const manifest = await readManifest(base);
      if (!manifest) return null;
      await cleanPending(base, manifest);
      if (!manifest.active) return null;
      const { active } = manifest;
      let value = '';
      for (let index = 0; index < active.count; index++) {
        const chunk = await SecureStore.getItemAsync(`${base}.${active.generation}.${index}`, options);
        if (chunk === null) throw new Error('Incomplete secure session.');
        value += chunk;
      }
      return value;
    });
  },
  setItem(key: string, value: string): Promise<void> {
    return operate(async () => {
      const base = keyFor(key);
      const previous = await readManifest(base);
      if (previous) await cleanPending(base, previous);
      const characters = Array.from(value);
      const count = Math.max(1, Math.ceil(characters.length / CHUNK_SIZE));
      if (count > MAX_CHUNKS) throw new ApiError('configuration', 'The session is too large for secure storage. Please contact support.');
      const generation = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const next = { generation, count };
      // Journal every generation before writing any token bytes. A later read/removal can clean
      // interrupted writes without enumerating SecureStore or leaving unreachable token chunks.
      await SecureStore.setItemAsync(base, JSON.stringify({ active: previous?.active ?? null, pending: [next] }), options);
      // The old pointer remains usable if writing the new generation fails or the app stops.
      for (let index = 0; index < count; index++) {
        await SecureStore.setItemAsync(`${base}.${generation}.${index}`,
          characters.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE).join(''), options);
      }
      const committed = { active: next, pending: previous?.active ? [previous.active] : [] };
      await SecureStore.setItemAsync(base, JSON.stringify(committed), options);
      await cleanPending(base, committed);
    });
  },
  removeItem(key: string): Promise<void> {
    return operate(async () => {
      const base = keyFor(key);
      const manifest = await readManifest(base);
      if (manifest) {
        for (const part of manifest.pending) await deletePart(base, part);
        if (manifest.active) await deletePart(base, manifest.active);
      }
      await SecureStore.deleteItemAsync(base, options);
    });
  },
};
