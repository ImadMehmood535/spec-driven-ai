import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { DomainExceptionFilter } from '@api/filters/DomainExceptionFilter';
import { RequestLoggerMiddleware } from '@api/middleware/RequestLoggerMiddleware';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { UserController } from './UserController';

const PLAINTEXT = 'a-real-enough-password';

describe('UserController (HTTP)', () => {
  let app: INestApplication;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    // The real middleware, so the redaction assertion below is meaningful.
    app.use((req: never, res: never, next: never) =>
      new RequestLoggerMiddleware().use(req, res, next),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;

  it('creates a user and returns 201 without any password material', async () => {
    commandBus.execute.mockResolvedValue({
      id: 1,
      email: 'ahmed@example.com',
      username: 'ahmed',
      firstName: 'Ahmed',
      lastName: 'Khan',
      roleId: null,
      entityStatus: 'ACTIVE',
    });

    const response = await request(server()).post('/user').send({
      email: 'ahmed@example.com',
      username: 'ahmed',
      firstName: 'Ahmed',
      lastName: 'Khan',
      password: PLAINTEXT,
    });

    expect(response.status).toBe(201);
    const serialised = JSON.stringify(response.body);
    expect(serialised).not.toContain(PLAINTEXT);
    expect(serialised).not.toContain('passwordHash');
  });

  it('never writes the password to the log on create (NFR-3)', async () => {
    commandBus.execute.mockResolvedValue({ id: 1 });
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await request(server()).post('/user').send({
      email: 'ahmed@example.com',
      username: 'ahmed',
      firstName: 'Ahmed',
      lastName: 'Khan',
      password: PLAINTEXT,
    });

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).not.toContain(PLAINTEXT);
    expect(logged).toContain('[REDACTED]');
  });

  it('never writes the new password to the log on password change (D-9)', async () => {
    commandBus.execute.mockResolvedValue({ userId: 1, passwordChanged: true });
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await request(server())
      .patch('/user/1/password')
      .send({ newPassword: PLAINTEXT });

    const logged = write.mock.calls.map((call) => String(call[0])).join('');
    write.mockRestore();

    expect(logged).not.toContain(PLAINTEXT);
    expect(logged).toContain('[REDACTED]');
  });

  it('maps a duplicate email to 409', async () => {
    commandBus.execute.mockRejectedValue(
      new ConflictError('A user with that email already exists.'),
    );

    const response = await request(server()).post('/user').send({
      email: 'a@b.c',
      username: 'a',
      firstName: 'A',
      lastName: 'B',
      password: PLAINTEXT,
    });

    expect(response.status).toBe(409);
  });

  it('assigns a role', async () => {
    commandBus.execute.mockResolvedValue({ userId: 1, roleId: 2 });

    const response = await request(server())
      .patch('/user/1/role')
      .send({ roleId: 2 });

    expect(response.status).toBe(200);
  });

  it('404s assigning a missing role', async () => {
    commandBus.execute.mockRejectedValue(
      new NotFoundError('Role was not found.'),
    );

    const response = await request(server())
      .patch('/user/1/role')
      .send({ roleId: 99 });

    expect(response.status).toBe(404);
  });

  it('lists users with pagination defaults', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/user');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ page: 1, size: 50 }),
      }),
    );
  });

  it('ignores a non-numeric roleId filter rather than failing', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/user?roleId=abc');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ roleId: undefined }),
      }),
    );
  });

  it('exposes no delete route (D-5)', async () => {
    const response = await request(server()).delete('/user/1');

    expect(response.status).toBe(404);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('has no password field on the general update route (D-9)', async () => {
    commandBus.execute.mockResolvedValue({ id: 1 });

    await request(server())
      .patch('/user/1')
      .send({ firstName: 'Ahmed', password: 'should-be-ignored' });

    // The command is built from named fields only, so a stray password in the
    // body cannot reach the domain.
    const calls = commandBus.execute.mock.calls as unknown[][];
    const command = calls[0][0] as Record<string, unknown>;
    expect(Object.keys(command)).not.toContain('password');
  });
});
