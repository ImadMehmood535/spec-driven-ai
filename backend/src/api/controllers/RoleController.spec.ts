import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { DomainExceptionFilter } from '@api/filters/DomainExceptionFilter';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { RoleController } from './RoleController';

/**
 * Exercises the HTTP surface with the buses mocked: routing, status codes, and
 * the error filter. Handler behaviour is covered by their own unit tests.
 */
describe('RoleController (HTTP)', () => {
  let app: INestApplication;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer() as Server;

  interface RoleBody {
    id?: number;
    name?: string;
    description?: string | null;
    entityStatus?: string;
    error?: string;
  }
  const body = (response: { body: unknown }): RoleBody =>
    response.body as RoleBody;

  it('creates a role and returns 201', async () => {
    commandBus.execute.mockResolvedValue({
      id: 1,
      name: 'Developer Admin',
      description: null,
      entityStatus: 'ACTIVE',
    });

    const response = await request(server())
      .post('/role')
      .send({ name: 'Developer Admin' });

    expect(response.status).toBe(201);
    expect(body(response).name).toBe('Developer Admin');
  });

  it('maps a duplicate name to 409', async () => {
    commandBus.execute.mockRejectedValue(
      new ConflictError('Role "Developer Admin" already exists.'),
    );

    const response = await request(server())
      .post('/role')
      .send({ name: 'Developer Admin' });

    expect(response.status).toBe(409);
    expect(body(response).error).toBe('ConflictError');
  });

  it('lists roles with pagination defaults applied', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/role');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ page: 1, size: 50 }),
      }),
    );
  });

  it('clamps an oversized page size to the maximum', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/role?size=5000');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ size: 100 }),
      }),
    );
  });

  it('returns 200 for an existing role', async () => {
    queryBus.execute.mockResolvedValue({ id: 1, name: 'Developer Admin' });

    const response = await request(server()).get('/role/1');

    expect(response.status).toBe(200);
  });

  it('maps a missing role to 404', async () => {
    queryBus.execute.mockRejectedValue(
      new NotFoundError('Role was not found.'),
    );

    const response = await request(server()).get('/role/99');

    expect(response.status).toBe(404);
  });

  it('rejects a non-numeric id with 400', async () => {
    const response = await request(server()).get('/role/abc');

    expect(response.status).toBe(400);
  });

  it('patches a role and returns 200', async () => {
    commandBus.execute.mockResolvedValue({
      id: 1,
      name: 'Developer Admin',
      description: null,
      entityStatus: 'INACTIVE',
    });

    const response = await request(server())
      .patch('/role/1')
      .send({ entityStatus: 'INACTIVE' });

    expect(response.status).toBe(200);
    expect(body(response).entityStatus).toBe('INACTIVE');
  });

  it('exposes no delete route (D-5)', async () => {
    const response = await request(server()).delete('/role/1');

    expect(response.status).toBe(404);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
