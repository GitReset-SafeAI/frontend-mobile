import { ApiError } from '../../services/api/ApiError';

export function reportErrorKey(error: unknown) {
  const kind = error instanceof ApiError ? error.kind : 'server';
  const key = kind === 'unauthorized' ? 'unauthorized'
    : kind === 'forbidden' ? 'forbidden'
      : kind === 'validation' ? 'validation'
        : kind === 'rate-limit' ? 'rateLimit'
          : kind === 'timeout' || kind === 'network' || kind === 'invalid-response' ? 'uncertain'
            : kind === 'cancelled' ? 'accountChanged' : 'generic';
  return `errors.${key}`;
}
