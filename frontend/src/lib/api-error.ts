/**
 * The API's error shape, from DomainExceptionFilter.
 * The HTTP API is the only contract between this project and the backend.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
}

export type ApiErrorKind =
  | 'validation' // 400
  | 'unauthenticated' // 401
  | 'forbidden' // 403
  | 'not-found' // 404
  | 'conflict' // 409
  | 'server' // 5xx
  | 'network'; // request never completed

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    readonly status: number,
    message: string,
    /** Field errors, when the API attributes the problem to a field. */
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 401 means re-authenticate; 403 means ask for access. Different actions. */
  get requiresReauthentication(): boolean {
    return this.kind === 'unauthenticated';
  }
}

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
  400: 'validation',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not-found',
  409: 'conflict',
};

const FALLBACK_MESSAGE: Record<ApiErrorKind, string> = {
  validation: 'Please check the details you entered.',
  unauthenticated: 'Your session has ended. Please sign in again.',
  forbidden: 'You do not have permission to do that.',
  'not-found': 'That item could not be found.',
  conflict: 'That conflicts with something that already exists.',
  server: 'Something went wrong on the server. Please try again.',
  network: 'Could not reach the server. Check your connection and try again.',
};

/**
 * Normalises an API failure into one shape the UI can present, so no screen
 * has to interpret raw status codes. Written once (FR-UI13).
 */
export function toApiError(status: number, body: unknown): ApiError {
  const kind: ApiErrorKind =
    KIND_BY_STATUS[status] ?? (status >= 500 ? 'server' : 'validation');

  const message =
    isApiErrorBody(body) && body.message.trim().length > 0
      ? body.message
      : FALLBACK_MESSAGE[kind];

  return new ApiError(kind, status, message, fieldFromMessage(message));
}

export function networkError(): ApiError {
  return new ApiError('network', 0, FALLBACK_MESSAGE.network);
}

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as ApiErrorBody).message === 'string'
  );
}

/**
 * The API reports conflicts in prose ("A user with that email already
 * exists."), so the field a form should highlight is inferred from the
 * message. Inference is confined to this one place rather than repeated in
 * every form.
 */
function fieldFromMessage(message: string): string | undefined {
  const lower = message.toLowerCase();

  if (lower.includes('email')) return 'email';
  if (lower.includes('username')) return 'username';
  if (lower.includes('password')) return 'password';
  if (lower.includes('name')) return 'name';

  return undefined;
}
