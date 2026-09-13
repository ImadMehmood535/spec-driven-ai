import { describe, expect, it } from 'vitest';
import { ApiError, networkError, toApiError } from './api-error';

describe('toApiError', () => {
  it.each([
    [400, 'validation'],
    [401, 'unauthenticated'],
    [403, 'forbidden'],
    [404, 'not-found'],
    [409, 'conflict'],
    [500, 'server'],
    [503, 'server'],
  ])('maps %i to %s', (status, kind) => {
    expect(toApiError(status, null).kind).toBe(kind);
  });

  it("uses the API's message when there is one", () => {
    const error = toApiError(409, {
      statusCode: 409,
      message: 'A user with that email already exists.',
      error: 'ConflictError',
    });

    expect(error.message).toBe('A user with that email already exists.');
  });

  it('falls back to a readable message when the body is unusable', () => {
    expect(toApiError(403, null).message).toBe(
      'You do not have permission to do that.',
    );
  });

  it('falls back when the message is blank rather than showing nothing', () => {
    expect(
      toApiError(404, { statusCode: 404, message: '   ', error: 'x' }).message,
    ).toBe('That item could not be found.');
  });

  it.each([
    ['A user with that email already exists.', 'email'],
    ['A user with that username already exists.', 'username'],
    ['Password must be at least 8 characters.', 'password'],
    ['Permission "project.create" already exists.', undefined],
  ])('infers the field from %p', (message, field) => {
    const error = toApiError(409, { statusCode: 409, message, error: 'x' });

    expect(error.field).toBe(field);
  });

  it('distinguishes 401 from 403, which need different responses', () => {
    // 401 means sign in again; 403 means ask for access. Treating them alike
    // would log a user out for lacking one permission.
    expect(toApiError(401, null).requiresReauthentication).toBe(true);
    expect(toApiError(403, null).requiresReauthentication).toBe(false);
  });

  it('is an Error, so it can be thrown and caught normally', () => {
    expect(toApiError(400, null)).toBeInstanceOf(ApiError);
    expect(toApiError(400, null)).toBeInstanceOf(Error);
  });
});

describe('networkError', () => {
  it('is distinct from a server error — the request never arrived', () => {
    expect(networkError().kind).toBe('network');
    expect(networkError().status).toBe(0);
  });

  it('tells the user what to try', () => {
    expect(networkError().message).toMatch(/check your connection/i);
  });
});
