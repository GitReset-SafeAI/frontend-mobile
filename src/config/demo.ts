import type { ContactInput } from '../services/contracts';

// The ready-made demo account for mock mode. Logging in with this email creates it on first use, with the
// sample contacts below; after that it behaves like any other account, so edits persist. The numbers are
// placeholders in a block of obviously sequential digits: replace one with your own to test real dialling.
export const DEMO_EMAIL = 'demo@safestep.lk';
export const DEMO_NAME = 'Demo';
export const DEMO_CONTACTS: ContactInput[] = [
  { name: 'Amma (sample)', phone: '+94770000001', relationship: 'family' },
  { name: 'Friend (sample)', phone: '+94770000002', relationship: 'friend' },
];
