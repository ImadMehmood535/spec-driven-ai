# Developer User Module — Admin UI

Next.js admin interface for the Developer User Module: users, roles, permissions, and
role-permission assignment.

This project is **self-contained**. It shares no code, configuration, or tooling with the API
and is intended to live in its own repository. The only contract between them is the **HTTP
API** and its Swagger description.

## Stack

- **Next.js** (App Router) with **TypeScript**
- **shadcn/ui** as the primary component system, over Radix primitives
- **Tailwind CSS**, with every colour as a theme token
- **Lucide** icons
- **next-themes** for dark mode
- **TanStack Query** for server state
- **Vitest + React Testing Library + MSW + jest-axe** for tests

## Getting started

```bash
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at the API
npm run dev                    # http://localhost:3100
```

The API must be running separately. See its own README.

## Commands

```bash
npm run dev         # development server on port 3100
npm run build       # production build
npm run lint        # eslint --fix
npm run typecheck   # tsc --noEmit
npm test            # vitest
npm run test:cov    # vitest with coverage
```

## Conventions

- **Reusability, not complexity.** One component per UI concept. A second near-identical
  table, form field, or status badge is a defect.
- **Colours are tokens.** Never a hard-coded hex in a component — it makes dark mode impossible
  to get right.
- **One shared test render helper** (`test/render.tsx`) providing query client, theme, and
  router. No bespoke wrapper per test file.
- **Mock the network, not modules.** MSW intercepts HTTP so components run their real hooks.
- **The UI is never the authorization boundary.** Controls are hidden or disabled for
  usability; the API enforces access.

Full conventions live in `.specs-fire/standards/coding-standards.md` → *Frontend Standards*.
