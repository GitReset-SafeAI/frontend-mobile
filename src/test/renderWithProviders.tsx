import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppProviders } from '../app/AppProviders';
import type { ContactInput } from '../services/contracts';
import { mockServices } from '../services/mocks';

export const defaultContact: ContactInput = { name: 'Amma', phone: '+94771234567', relationship: 'family' };

interface RenderOptions {
  // Start signed in (the default), or signed out to see the login gate.
  signedIn?: boolean;
  // Contacts for the signed-in user. Defaults to one: SOS needs somebody to call.
  contacts?: ContactInput[];
}

// Seeds a session the same way the app does (through the service), then renders.
export async function renderWithProviders(ui: ReactElement, { signedIn = true, contacts = [defaultContact] }: RenderOptions = {}) {
  if (signedIn) {
    await mockServices.auth.signUp({ name: 'Nimali', email: 'nimali@example.lk', password: 'password1' });
    for (const contact of contacts) await mockServices.contacts.add(contact);
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  const rendered = await render(
    <AppProviders queryClient={queryClient} enableQueryLifecycle={false}>
      {ui}
    </AppProviders>,
  );
  // The session is read asynchronously; wait for the loading screen to give way.
  await waitFor(() => { expect(screen.queryByTestId('auth-loading')).toBeNull(); });
  return { ...rendered, queryClient };
}
