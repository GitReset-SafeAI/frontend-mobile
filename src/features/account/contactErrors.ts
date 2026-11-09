import { ApiError } from '../../services/api/ApiError';

export function contactErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'contacts.errors.generic';
  const key = error.kind === 'limit' ? 'limit'
    : error.kind === 'validation' ? 'validation'
      : error.kind === 'unauthorized' ? 'unauthorized'
        : error.kind === 'forbidden' ? 'forbidden'
          : error.kind === 'not-found' ? 'notFound'
            : error.kind === 'network' || error.kind === 'timeout' ? 'connection'
              : error.kind === 'not-implemented' ? 'unavailable'
                : error.kind === 'cancelled' ? 'accountChanged' : 'generic';
  return `contacts.errors.${key}`;
}
