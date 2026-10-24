export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'server'
  | 'http'
  | 'configuration'
  | 'not-implemented'
  | 'invalid-response';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function httpError(status: number): ApiError {
  const kind: ApiErrorKind = status === 401 ? 'unauthorized'
    : status === 403 ? 'forbidden'
      : status === 404 ? 'not-found'
        : status === 400 || status === 422 ? 'validation'
          : status >= 500 ? 'server' : 'http';
  // Do not expose private response bodies or URLs in UI errors.
  return new ApiError(kind, 'The request could not be completed.', status);
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('cancelled', 'The request was cancelled.');
  }
  return new ApiError('network', 'Unable to connect. Please try again.');
}
