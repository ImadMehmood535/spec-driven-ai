import { Injectable } from '@nestjs/common';

export interface ServiceHealth {
  service: string;
  status: 'ok';
}

@Injectable()
export class AppService {
  getHealth(): ServiceHealth {
    return { service: 'developer-user-module-api', status: 'ok' };
  }
}
