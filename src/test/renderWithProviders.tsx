import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AppProviders } from '../app/AppProviders';

export async function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return {
    ...await render(
      <AppProviders queryClient={queryClient} enableQueryLifecycle={false}>
        {ui}
      </AppProviders>,
    ),
    queryClient,
  };
}
