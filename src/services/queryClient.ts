import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/ApiError';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => failureCount < 1
          && error instanceof ApiError
          && ['network', 'timeout', 'server'].includes(error.kind),
      },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}
