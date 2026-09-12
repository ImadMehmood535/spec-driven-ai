# Developer User Module — API

NestJS API for the Developer User Module: users, roles, permissions, and role permissions,
with a DDD + CQRS vertical-slice architecture over Sequelize (PostgreSQL).

This project is **self-contained**. It shares no code, configuration, or tooling with the
admin UI, and is intended to live in its own repository.

## Layout

- `src/domain` — aggregates (domain models) + Sequelize models + shared table names
- `src/application` — CQRS feature slices (`modules/<name>/features/<feature>`)
- `src/infrastructure` — repositories (write), queries (read), persistence modules, DB wiring
- `src/api` — controllers, Swagger constants, exception filter, guards, middleware
- `src/shared` — `EntityStatus`, audit fields, domain errors, guards, utils
- `src/migrations` — versioned schema migrations
- `src/seeders` — idempotent seeds

## Getting started

```bash
npm install
cp .env.example .env       # then set the values
docker compose up -d       # PostgreSQL on host port 5440
npm run start:dev          # API on http://localhost:3000, Swagger at /docs
```

The schema is created by migrations, not by Sequelize sync — `synchronize` is `false` in every
environment.

## Commands

```bash
npm run build          # nest build + tsc-alias
npm run start:dev      # watch mode
npm run lint           # eslint --fix
npm run format         # prettier
npm test               # jest
npm run test:cov       # jest with coverage
```

## Configuration

Every variable is listed in `.env.example`. No secret is committed, and the app refuses to
boot without `JWT_SECRET` once authentication lands.
