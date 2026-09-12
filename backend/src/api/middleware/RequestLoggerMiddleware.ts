import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { redactedBody } from '@shared/utils/Redaction';

const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function methodColor(method: string): string {
  switch (method) {
    case 'GET':
      return COLOR.green;
    case 'POST':
      return COLOR.cyan;
    case 'PUT':
      return COLOR.magenta;
    case 'PATCH':
      return COLOR.yellow;
    case 'DELETE':
      return COLOR.red;
    default:
      return COLOR.blue;
  }
}

function statusColor(status: number): string {
  if (status >= 500) return COLOR.red;
  if (status >= 400) return COLOR.yellow;
  if (status >= 300) return COLOR.cyan;
  return COLOR.green;
}

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const m = methodColor(req.method);
      const s = statusColor(res.statusCode);
      const label = (text: string): string =>
        `${COLOR.gray}${text.padEnd(9)}${COLOR.reset}`;

      const lines = [
        '',
        `${COLOR.bold}HTTP${COLOR.reset}  ${m}${COLOR.bold}${req.method}${COLOR.reset} ${req.originalUrl}  ` +
          `${s}${COLOR.bold}${res.statusCode}${COLOR.reset}  ${COLOR.dim}${durationMs}ms${COLOR.reset}`,
        `  ${label('time')}${new Date().toISOString()}`,
        `  ${label('params')}${JSON.stringify(req.params)}`,
        `  ${label('query')}${JSON.stringify(req.query)}`,
        `  ${label('body')}${redactedBody(req.body)}`,
      ];

      process.stdout.write(lines.join('\n') + '\n');
    });

    next();
  }
}
