import { z } from 'zod';

import { authenticatedRequest } from '../auth/accessToken';
import type { ContactInput, ContactRequestContext, ContactService } from '../contracts/account';
import { contactInputSchema, MAX_CONTACTS } from '../contracts/account';
import { ApiError } from './ApiError';

// Wire-only slot metadata: the existing UI uses the first item as primary.
const contactWireSchema = contactInputSchema.extend({
  id: z.guid(),
  slot: z.number().int().min(0).max(MAX_CONTACTS - 1),
}).strict();

function toContact(contact: z.infer<typeof contactWireSchema>) {
  return { id: contact.id, name: contact.name, phone: contact.phone,
    ...(contact.relationship === undefined ? {} : { relationship: contact.relationship }) };
}
const contactSchema = contactWireSchema.transform(toContact);
const listSchema = z.array(contactWireSchema).max(MAX_CONTACTS).refine((contacts) =>
  new Set(contacts.map((contact) => contact.id)).size === contacts.length
  && new Set(contacts.map((contact) => contact.slot)).size === contacts.length
  && (contacts.length === 0 || contacts.some((contact) => contact.slot === 0)),
).transform((contacts) => [...contacts].sort((a, b) => a.slot - b.slot)
  .map(toContact));

function inputBody(input: ContactInput) {
  const parsed = contactInputSchema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', 'Check the contact name and phone number.', 422);
  return parsed.data;
}

function contactPath(id: string) {
  if (!z.guid().safeParse(id).success) throw new ApiError('validation', 'The contact identifier is invalid.', 422);
  return `/emergency-contacts/${encodeURIComponent(id)}`;
}

function options(context?: ContactRequestContext) {
  return { expectedUserId: context?.userId, signal: context?.signal, cache: 'no-store' as const,
    credentials: 'omit' as const, redirect: 'error' as const };
}

export const apiContacts: ContactService = {
  list(context) {
    return authenticatedRequest('/emergency-contacts', listSchema, options(context));
  },
  async add(input, context) {
    try {
      return await authenticatedRequest('/emergency-contacts', contactSchema, {
        ...options(context), method: 'POST', json: inputBody(input),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        throw new ApiError('limit', 'You can save up to five emergency contacts.', 409);
      }
      throw error;
    }
  },
  async update(id, input, context) {
    const contact = await authenticatedRequest(contactPath(id), contactSchema, {
      ...options(context), method: 'PATCH', json: inputBody(input),
    });
    if (contact.id.toLowerCase() !== id.toLowerCase()) throw new ApiError('invalid-response', 'The server returned an unexpected contact.', 200);
    return contact;
  },
  remove(id, context) {
    return authenticatedRequest(contactPath(id), z.void(), { ...options(context), method: 'DELETE' });
  },
  makePrimary(id, context) {
    return authenticatedRequest(`${contactPath(id)}/primary`, z.void(), { ...options(context), method: 'POST' });
  },
};
