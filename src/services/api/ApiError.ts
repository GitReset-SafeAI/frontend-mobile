export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'conflict'
  | 'limit'
  | 'payload-too-large'
  | 'unsupported-media-type'
  | 'rate-limit'
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

function safeMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const message = value.trim();
  // Never forward HTML, traces, URLs, credentials, input echoes, or provider diagnostics.
  if (!message || message.length > 200 || [...message].some((character) => character.charCodeAt(0) < 32)
    || /[<>@{}[\]"`]/.test(message)
    || /https?:|[A-Z]:\\|\/(?:home|usr|var|app)\/|traceback|stack\s*trace|exception|\b(?:sql|select|insert|postgres|supabase|constraint)\b|bearer\s|eyJ[A-Za-z0-9_-]+\.|sb_(?:secret|publishable)_|(?:password|token|secret|api.?key)\s*[:=]|input_value/i.test(message)) return undefined;
  return message;
}

function backendMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const { detail, message } = body as { detail?: unknown; message?: unknown };
  if (!Array.isArray(detail)) return safeMessage(detail) ?? safeMessage(message);
  // FastAPI/Pydantic may include private input and ctx values. Only summarize fixed validation
  // categories, never serialize the issue or echo its potentially user-supplied msg/input/ctx.
  const messages = detail.slice(0, 3).map((issue: unknown) => {
    const type = issue && typeof issue === 'object' ? (issue as { type?: unknown }).type : undefined;
    return type === 'missing' ? 'A required field is missing.' : 'One or more input values are invalid.';
  });
  return [...new Set(messages)].join(' ') || undefined;
}

export function httpError(status: number, body?: unknown): ApiError {
  const kind: ApiErrorKind = status === 401 ? 'unauthorized'
    : status === 403 ? 'forbidden'
      : status === 404 ? 'not-found'
        : status === 409 ? 'conflict'
          : status === 413 ? 'payload-too-large'
            : status === 415 ? 'unsupported-media-type'
              : status === 429 ? 'rate-limit'
                : status === 400 || status === 422 ? 'validation'
                  : status >= 500 ? 'server' : 'http';
  const fallback = status === 401 ? 'Please sign in again to continue.'
    : status === 403 ? 'This operation is not permitted.'
      : status === 404 ? 'The requested resource is unavailable.'
        : status === 409 ? 'The request conflicts with the current state.'
          : status === 413 ? 'The upload is too large.'
            : status === 415 ? 'The uploaded media type is not supported.'
              : status === 400 || status === 422 ? 'Check the submitted information.'
                : status === 429 ? 'Too many requests. Please try again later.'
                  : status >= 500 ? 'The service is temporarily unavailable. Please try again later.'
                    : 'The request could not be completed.';
  // Server-side diagnostics are never user-facing, even if they happen to be short strings.
  return new ApiError(kind, status >= 500 ? fallback : backendMessage(body) ?? fallback, status);
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('cancelled', 'The request was cancelled.');
  }
  return new ApiError('network', 'Unable to connect. Please try again.');
}
