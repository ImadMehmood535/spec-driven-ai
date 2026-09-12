import { INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Server } from 'http';
import { ApiModule } from '@api/ApiModule';
import { PermissionModel } from '@domain/aggregates/PermissionAggregate/PermissionModel';

/**
 * Boots the API layer without the database, which is enough to exercise Nest's
 * DI graph, middleware registration and controller routing. The database is a
 * separate concern and has no bearing on these routes.
 */
describe('AppController (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Boots the real ApiModule so its wiring cannot drift, with persistence
    // stubbed — these assertions are about routing and middleware, not the database.
    const moduleRef = await Test.createTestingModule({
      imports: [ApiModule],
    })
      .overrideProvider(getConnectionToken())
      .useValue({})
      .overrideProvider(getModelToken(PermissionModel))
      .useValue({})
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('boots the API layer and serves /health', async () => {
    const response = await request(app.getHttpServer() as Server).get(
      '/health',
    );

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

    await request(app.getHttpServer() as Server).get('/health');

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).toContain('/health');
    expect(logged).toContain('200');
  });

  it('never writes a credential to the log, even on an unmatched route', async () => {
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await request(app.getHttpServer() as Server)
      .post('/does-not-exist')
      .send({ username: 'ahmed', password: 'super-secret-value' });

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).not.toContain('super-secret-value');
    expect(logged).toContain('[REDACTED]');
    expect(logged).toContain('ahmed');
  });
});
