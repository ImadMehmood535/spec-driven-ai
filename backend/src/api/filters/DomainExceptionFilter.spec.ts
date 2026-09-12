import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { ForbiddenError } from '@shared/errors/ForbiddenError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';
import { DomainExceptionFilter } from './DomainExceptionFilter';

function hostWithResponse(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it.each([
    [new DomainError('bad input'), HttpStatus.BAD_REQUEST],
    [new UnauthorizedError('no token'), HttpStatus.UNAUTHORIZED],
    [new ForbiddenError('not permitted'), HttpStatus.FORBIDDEN],
    [new NotFoundError('missing'), HttpStatus.NOT_FOUND],
    [new ConflictError('duplicate'), HttpStatus.CONFLICT],
  ])('maps %s to %i', (exception, expected) => {
    const { host, status } = hostWithResponse();

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(expected);
  });

  it('returns the status code, message, and error name', () => {
    const { host, json } = hostWithResponse();

    filter.catch(new NotFoundError('Role was not found.'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Role was not found.',
      error: 'NotFoundError',
    });
  });

  it('distinguishes 401 from 403, since the two mean different things', () => {
    const unauthorized = hostWithResponse();
    const forbidden = hostWithResponse();

    filter.catch(new UnauthorizedError('no token'), unauthorized.host);
    filter.catch(new ForbiddenError('missing permission'), forbidden.host);

    expect(unauthorized.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(forbidden.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });
});
