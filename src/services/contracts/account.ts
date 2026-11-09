import { z } from 'zod';

// App-facing models shared by demo and real services. Contact slot metadata is validated at the
// API boundary without changing the shape of existing locally stored demo contacts.

// Confirmed by FastAPI's slot range 0..4 and the emergency-contact SQL allocation function.
export const MAX_CONTACTS = 5;

export const contactRelationships = ['family', 'friend', 'partner', 'other'] as const;
export type ContactRelationship = (typeof contactRelationships)[number];

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});
export type User = z.infer<typeof userSchema>;

// Phones are stored normalised as +94 followed by the nine-digit Sri Lankan number.
export const normalisedPhoneSchema = z.string().regex(/^\+94[1-9]\d{8}$/);

export const contactInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  phone: normalisedPhoneSchema,
  relationship: z.enum(contactRelationships).optional(),
});
export type ContactInput = z.infer<typeof contactInputSchema>;

export const emergencyContactSchema = contactInputSchema.extend({ id: z.string() });
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;

export const logInInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LogInInput = z.infer<typeof logInInputSchema>;

export const signUpInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.email(),
  password: z.string().min(8),
});
export type SignUpInput = z.infer<typeof signUpInputSchema>;

// Real registration extends the demo form; backend accepts both old and new NIC formats.
export const registrationSchema = signUpInputSchema.extend({
  email: z.string().trim().min(3).max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  password: z.string().min(8).max(4096),
  nic: z.string().regex(/^(?:[0-9]{9}[VvXx]|[0-9]{12})$/),
  phone_number: normalisedPhoneSchema,
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export interface AuthService {
  // Resolves to the signed-in user, or null when there is no session.
  getSession(): Promise<User | null>;
  signUp(input: SignUpInput | RegistrationInput): Promise<User | null>;
  logIn(input: LogInInput): Promise<User>;
  logOut(): Promise<void>;
  subscribe?(listener: (user: User | null, error?: Error) => void): () => void;
}

// Contacts belong to the signed-in user. The first contact is the primary one that SOS calls.
// The client never sends a user id: who the caller is comes from the session.
export interface ContactService {
  list(context?: ContactRequestContext): Promise<EmergencyContact[]>;
  add(input: ContactInput, context?: ContactRequestContext): Promise<EmergencyContact>;
  update(id: string, input: ContactInput, context?: ContactRequestContext): Promise<EmergencyContact>;
  remove(id: string, context?: ContactRequestContext): Promise<void>;
  makePrimary(id: string, context?: ContactRequestContext): Promise<void>;
}

// Local request ownership/cancellation only. These fields are never sent to the backend.
export interface ContactRequestContext {
  userId?: string;
  signal?: AbortSignal;
}
