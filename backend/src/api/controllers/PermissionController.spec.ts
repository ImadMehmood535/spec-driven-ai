import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Server } from 'http';
import * as request from 'supertest';
import { DomainExceptionFilter } from '@api/filters/DomainExceptionFilter';
import { ConflictError } from '@shared/errors/ConflictError';
import { NotFoundError } from '@shared/errors/NotFoundError';
import { PermissionController } from './PermissionController';

/**
 * Exercises the HTTP surface with the buses mocked: routing, status codes, and
 * the error filter. Handler behaviour is covered by their own unit tests.
 */
describe('PermissionController (HTTP)', () => {
  let app: INestApplication;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    queryBus = { execute: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      controllers: [PermissionController],
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

  interface PermissionBody {
    id?: number;
    name?: string;
    description?: string | null;
    entityStatus?: string;
    error?: string;
  }
  const body = (response: { body: unknown }): PermissionBody =>
    response.body as PermissionBody;

  it('creates a permission and returns 201', async () => {
    commandBus.execute.mockResolvedValue({
      id: 1,
      name: 'project.create',
      description: null,
      entityStatus: 'ACTIVE',
    });

    const response = await request(server())
      .post('/permission')
      .send({ name: 'project.create' });

    expect(response.status).toBe(201);
    expect(body(response).name).toBe('project.create');
  });

  it('maps a duplicate name to 409', async () => {
    commandBus.execute.mockRejectedValue(
      new ConflictError('Permission "project.create" already exists.'),
    );

    const response = await request(server())
      .post('/permission')
      .send({ name: 'project.create' });

    expect(response.status).toBe(409);
    expect(body(response).error).toBe('ConflictError');
  });

  it('lists permissions with pagination defaults applied', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/permission');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ page: 1, size: 50 }),
      }),
    );
  });

  it('clamps an oversized page size to the maximum', async () => {
    queryBus.execute.mockResolvedValue({ items: [], meta: {} });

    await request(server()).get('/permission?size=5000');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ size: 100 }),
      }),
    );
  });

  it('returns 200 for an existing permission', async () => {
    queryBus.execute.mockResolvedValue({ id: 1, name: 'project.create' });

    const response = await request(server()).get('/permission/1');

    expect(response.status).toBe(200);
  });

  it('maps a missing permission to 404', async () => {
    queryBus.execute.mockRejectedValue(
      new NotFoundError('Permission was not found.'),
    );

    const response = await request(server()).get('/permission/99');

    expect(response.status).toBe(404);
  });

  it('rejects a non-numeric id with 400', async () => {
    const response = await request(server()).get('/permission/abc');

    expect(response.status).toBe(400);
  });

  it('patches a permission and returns 200', async () => {
    commandBus.execute.mockResolvedValue({
      id: 1,
      name: 'project.create',
      description: null,
      entityStatus: 'INACTIVE',
    });

    const response = await request(server())
      .patch('/permission/1')
      .send({ entityStatus: 'INACTIVE' });

    expect(response.status).toBe(200);
    expect(body(response).entityStatus).toBe('INACTIVE');
  });

  it('exposes no delete route (D-5)', async () => {
    const response = await request(server()).delete('/permission/1');

    expect(response.status).toBe(404);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
