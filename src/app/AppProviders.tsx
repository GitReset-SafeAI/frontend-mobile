import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '../i18n';
import { createQueryClient } from '../services/queryClient';
import { subscribeQueryLifecycle } from '../services/queryLifecycle';
import { theme } from '../shared/theme/theme';

type AppProvidersProps = PropsWithChildren<{
  queryClient?: QueryClient;
  enableQueryLifecycle?: boolean;
}>;

export function AppProviders({ children, queryClient, enableQueryLifecycle = true }: AppProvidersProps) {
  const [client] = useState(() => queryClient ?? createQueryClient());
  useEffect(() => {
    if (enableQueryLifecycle) return subscribeQueryLifecycle();
  }, [enableQueryLifecycle]);

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </PaperProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
