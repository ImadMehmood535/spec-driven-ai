import { AppService } from './AppService';

describe('AppService', () => {
  it('reports the service name and an ok status', () => {
    expect(new AppService().getHealth()).toEqual({
      service: 'developer-user-module-api',
      status: 'ok',
    });
  });
});
