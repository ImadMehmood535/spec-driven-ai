---
run: run-spec-driven-ai-011
work_item: ui-scaffold
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-12T21:10:00Z
---

# Implementation Plan: Admin UI Scaffold and Test Harness

> Checkpoint self-served under the standing instruction to run the loop autonomously.

## Approach

Stand up `frontend/` as a **fully self-contained project** — its own `package.json`, lockfile,
tsconfig, lint/format config, `.gitignore`, README, and `.env.example`. Per the constitution's
*Backend / Frontend Separation*, moving this directory into an empty repository must leave it
working, with no file from `backend/`.

The stack is the user's: Next.js + TypeScript, shadcn/ui as the primary component system,
Tailwind, Lucide, dark mode, TanStack Query, and a Vitest + RTL + MSW + jest-axe harness.

No feature screens — the frame only.

## Files to Create

| Area | Files |
|------|-------|
| Project | `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `README.md`, `.env.example` |
| Styling | `tailwind.config.ts`, `postcss.config.mjs`, `src/app/globals.css`, `components.json` |
| Lint | `eslint.config.mjs`, `.prettierrc` |
| App | `src/app/layout.tsx`, `src/app/page.tsx` |
| Providers | `QueryProvider`, `ThemeProvider` (one place each) |
| Shell | `AppShell` with responsive nav, `ThemeToggle` |
| Primitives | `lib/utils.ts` (`cn`), `components/ui/button.tsx` |
| API seam | `lib/api-client.ts` (single auth-header seam), `lib/api-error.ts` (normalises 400/401/403/404/409) |
| Harness | `vitest.config.ts`, `test/setup.ts`, `test/render.tsx` (the one shared helper), `test/msw/server.ts` |
| Tests | Shell smoke test in both themes with an axe assertion; API error normaliser tests |

## Technical Details

**`cn`, the API client, the error normaliser, and the render helper are written once.** A second
copy of any of them in a later work item is a defect (FR-UI13). The render helper in particular:
the testing standards call for one helper providing query client, theme, and router, not a
bespoke wrapper per file.

**The auth-header seam exists but holds no token yet.** `ui-auth` owns where the token lives
(D-10: client-side browser storage). The client takes a token getter so that decision stays in
one place.

**Theme tokens as CSS custom properties**, never hard-coded colours in components — the
frontend standards require correctness in both themes, and hard-coded hex makes that impossible.

**No second component library or icon set.** shadcn/ui and Lucide only; anything missing is
composed from the Radix primitives shadcn/ui already depends on.

---
*Plan approved at checkpoint. Execution follows.*
