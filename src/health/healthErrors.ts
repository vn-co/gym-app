import { HealthServiceError } from './types';

export function toHealthServiceError(error: unknown): HealthServiceError {
  if (error instanceof HealthServiceError) return error;

  const code =
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code
      ? error.code
      : 'healthkit_error';
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Apple Health could not complete the request.';

  return new HealthServiceError(code, message);
}
