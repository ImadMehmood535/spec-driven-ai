---
id: ui-scaffold
title: Admin UI Scaffold and Test Harness
intent: developer-user-module
complexity: medium
mode: confirm
status: pending
depends_on: [project-scaffold]
created: 2026-09-12T12:38:02Z
---

# Work Item: Admin UI Scaffold and Test Harness

## Description

Stand up the Next.js admin UI with the user-specified stack, the app shell, and the frontend
test harness. No feature screens yet — the frame only.

## Acceptance Criteria

- [ ] Next.js (App Router) + **TypeScript**, strict; no `any` in component props
- [ ] **Tailwind CSS** configured with theme tokens as CSS custom properties (no hard-coded colours in components)
- [ ] **shadcn/ui** initialised as the primary component system; `components.json` checked in
- [ ] **Lucide** wired as the only icon set
- [ ] **Dark mode** via `next-themes`, honouring system preference, with an explicit toggle (FR-UI12)
- [ ] Both themes verified for contrast on the shell
- [ ] TanStack Query provider configured with sensible defaults
- [ ] Toast provider (`sonner`) mounted once at the root
- [ ] Typed API client pointing at the backend, with a single place that attaches the auth header
- [ ] API errors normalised so 400/401/403/404/409 map to messages the UI can present
- [ ] App shell: navigation for Users, Roles, Permissions — responsive, collapsing rather than overflowing (FR-UI10)
- [ ] Shell works at desktop, tablet, and mobile widths with no horizontal body scroll (FR-UI10)
- [ ] **Vitest + React Testing Library** configured; `npm run test:ui` runs
- [ ] **MSW** configured to mock the API at the network boundary
- [ ] **jest-axe** available for accessibility assertions
- [ ] **One shared render helper** providing query client, theme, and router — no per-file wrappers (testing standards)
- [ ] ESLint and Prettier cover the frontend; lint passes
- [ ] A smoke test renders the shell in both themes and asserts no axe violations

## Technical Notes

Reusability starts here: the render helper, the API client, and the error normaliser are each
written once. A second copy of any of them in a later work item is a defect.

Do not install a second component library or icon set — compose from the Radix primitives
shadcn/ui already depends on when something is missing (frontend standards).

Where the JWT is stored is a real decision with security consequences; `ui-auth` owns it, but
the API client's auth-header seam is created here, so leave it pluggable.

## Dependencies

- project-scaffold
