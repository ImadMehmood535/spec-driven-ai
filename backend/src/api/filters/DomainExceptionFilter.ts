import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ConflictError } from '@shared/errors/ConflictError';
import { DomainError } from '@shared/errors/DomainError';
import { ForbiddenError } from '@shared/errors/ForbiddenError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UnauthorizedError } from '@shared/errors/UnauthorizedError';

type HandledError =
  | DomainError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | ConflictError;

function statusFor(exception: HandledError): HttpStatus {
  if (exception instanceof UnauthorizedError) {
    return HttpStatus.UNAUTHORIZED;
  }
  if (exception instanceof ForbiddenError) {
    return HttpStatus.FORBIDDEN;
  }
  if (exception instanceof NotFoundError) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof ConflictError) {
    return HttpStatus.CONFLICT;
  }
  return HttpStatus.BAD_REQUEST;
}

@Catch(
  DomainError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: HandledError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = statusFor(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }
}
