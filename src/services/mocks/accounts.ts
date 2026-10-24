import { z } from 'zod';

import { DEMO_CONTACTS, DEMO_EMAIL, DEMO_NAME } from '../../config/demo';
import { ApiError } from '../api/ApiError';
import type { AuthService, ContactService, User } from '../contracts';
import { emergencyContactSchema, MAX_CONTACTS, userSchema } from '../contracts/account';
import { newId, readJson, removeKey, writeJson } from './demoStore';

// SecureStore keys may only contain letters, digits, ".", "-" and "_".
const accountsKey = 'safestep.demo.accounts';
const sessionKey = 'safestep.demo.session';
const contactsKey = (userId: string) => `safestep.demo.contacts.${userId}`;

const accountsSchema = z.array(userSchema);
const sessionSchema = z.object({ userId: z.string() });
const contactsSchema = z.array(emergencyContactSchema);

// A touch of latency so loading states are visible in demos. Tests skip it.
const latencyMs = process.env.NODE_ENV === 'test' ? 0 : 400;
const wait = () => (latencyMs === 0 ? Promise.resolve() : new Promise<void>((resolve) => { setTimeout(resolve, latencyMs); }));

async function accounts(): Promise<User[]> {
  const parsed = accountsSchema.safeParse(await readJson(accountsKey));
  return parsed.success ? parsed.data : [];
}

async function currentUser(): Promise<User | null> {
  const session = sessionSchema.safeParse(await readJson(sessionKey));
  if (!session.success) return null;
  return (await accounts()).find((account) => account.id === session.data.userId) ?? null;
}

async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) throw new ApiError('unauthorized', 'You need to be logged in.');
  return user;
}

async function readContacts(userId: string) {
  const parsed = contactsSchema.safeParse(await readJson(contactsKey(userId)));
  return parsed.success ? parsed.data : [];
}

async function createDemoAccount(): Promise<User> {
  const user: User = { id: newId(), name: DEMO_NAME, email: DEMO_EMAIL };
  await writeJson(accountsKey, [...(await accounts()), user]);
  await writeJson(contactsKey(user.id), DEMO_CONTACTS.map((contact) => ({ ...contact, id: newId() })));
  return user;
}

// Demo sign-in: no password is read, checked, or stored. It exists to exercise the screens and the service
// boundary, and must never be mistaken for real authentication.
export const mockAuth: AuthService = {
  async getSession() {
    await wait();
    return currentUser();
  },
  async signUp({ name, email }) {
    await wait();
    const normalised = email.trim().toLowerCase();
    if ((await accounts()).some((account) => account.email === normalised)) {
      throw new ApiError('conflict', 'An account with this email already exists.');
    }
    const user: User = { id: newId(), name: name.trim(), email: normalised };
    await writeJson(accountsKey, [...(await accounts()), user]);
    await writeJson(sessionKey, { userId: user.id });
    return user;
  },
  async logIn({ email }) {
    await wait();
    const normalised = email.trim().toLowerCase();
    // The demo account is created the first time anyone logs in with its email.
    const user =
      (await accounts()).find((account) => account.email === normalised) ??
      (normalised === DEMO_EMAIL ? await createDemoAccount() : undefined);
    if (!user) throw new ApiError('not-found', 'No account with this email.');
    await writeJson(sessionKey, { userId: user.id });
    return user;
  },
  async logOut() {
    await wait();
    await removeKey(sessionKey);
  },
};

export const mockContacts: ContactService = {
  async list() {
    await wait();
    return readContacts((await requireUser()).id);
  },
  async add(input) {
    await wait();
    const user = await requireUser();
    const contacts = await readContacts(user.id);
    if (contacts.length >= MAX_CONTACTS) throw new ApiError('limit', `At most ${MAX_CONTACTS} contacts.`);
    const contact = { ...input, id: newId() };
    await writeJson(contactsKey(user.id), [...contacts, contact]);
    return contact;
  },
  async update(id, input) {
    await wait();
    const user = await requireUser();
    const contacts = await readContacts(user.id);
    if (!contacts.some((contact) => contact.id === id)) throw new ApiError('not-found', 'No such contact.');
    const updated = { ...input, id };
    await writeJson(contactsKey(user.id), contacts.map((contact) => (contact.id === id ? updated : contact)));
    return updated;
  },
  async remove(id) {
    await wait();
    const user = await requireUser();
    await writeJson(contactsKey(user.id), (await readContacts(user.id)).filter((contact) => contact.id !== id));
  },
  async makePrimary(id) {
    await wait();
    const user = await requireUser();
    const contacts = await readContacts(user.id);
    const chosen = contacts.find((contact) => contact.id === id);
    if (!chosen) throw new ApiError('not-found', 'No such contact.');
    await writeJson(contactsKey(user.id), [chosen, ...contacts.filter((contact) => contact.id !== id)]);
  },
};
