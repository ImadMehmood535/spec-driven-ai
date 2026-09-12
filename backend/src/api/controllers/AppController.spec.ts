import { Global, INestApplication, Module } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { ApiModule } from '@api/ApiModule';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';
import { RoleModel } from '@domain/aggregates/RoleAggregate/RoleModel';
import { RolePermissionModel } from '@domain/aggregates/RolePermissionAggregate/RolePermissionModel';
import { UserModel } from '@domain/aggregates/UserAggregate/UserModel';

/**
 * In production `SequelizeModule.forRoot` provides the connection globally, so
 * every persistence module can inject it. This test boots ApiModule without a
 * database, so it supplies the same token from a global stub instead. Model
 * tokens are stubbed per model.
 *
 * ApiModule itself is deliberately the module under test — a hand-built copy
 * would drift from the real wiring and stop catching middleware mistakes.
 */
@Global()
@Module({
  providers: [{ provide: getConnectionToken(), useValue: {} }],
  exports: [getConnectionToken()],
})
class StubConnectionModule {}

describe('AppController (HTTP)', () => {
  // AuthModule refuses to build without a secret — that is the point (D-2).
  const ORIGINAL_SECRET = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-only-secret-not-a-real-one';
  });
  afterAll(() => {
    process.env.JWT_SECRET = ORIGINAL_SECRET;
  });

  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StubConnectionModule, ApiModule],
    })
      .overrideProvider(getModelToken(PermissionModel))
      .useValue({})
      .overrideProvider(getModelToken(RoleModel))
      .useValue({})
      .overrideProvider(getModelToken(RolePermissionModel))
      .useValue({})
      .overrideProvider(getModelToken(UserModel))
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;

  it('boots the API layer and serves /health', async () => {
    const response = await request(server()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: 'developer-user-module-api',
      status: 'ok',
    });
  });

  it('runs the request logger without redacting an innocuous body', async () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await request(server()).get('/health');

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).toContain('/health');
    expect(logged).toContain('200');
  });

  it('never writes a credential to the log, even on an unmatched route', async () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await request(server())
      .post('/does-not-exist')
      .send({ username: 'ahmed', password: 'super-secret-value' });

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).not.toContain('super-secret-value');
    expect(logged).toContain('[REDACTED]');
    expect(logged).toContain('ahmed');
  });

  it('routes every registered controller, and guards the management ones', async () => {
    // A non-404 proves the controller is wired. A 401 proves the global guards
    // are mounted — a management route must never be reachable without a token.
    for (const path of [
      '/permission',
      '/role',
      '/role/1/permission',
      '/user',
      '/user/1/permission',
    ]) {
      const response = await request(server()).get(path);
      expect(response.status).toBe(401);
    }
  });

  it('leaves the public routes reachable without a token', async () => {
    const response = await request(server()).get('/health');

    expect(response.status).toBe(200);
  });
});
