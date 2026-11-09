import { ApiError } from '../api/ApiError';

export function toAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const details = error as { status?: number; name?: string } | null;
  if (details?.status === 429) return new ApiError('rate-limit', 'Too many attempts. Please try again later.', 429);
  if (details?.status === 401) return new ApiError('unauthorized', 'Please log in again.', 401);
  if (details?.status === 403) return new ApiError('forbidden', 'This operation is not permitted.', 403);
  return new ApiError('network', 'Authentication could not be completed. Please try again.');
}
