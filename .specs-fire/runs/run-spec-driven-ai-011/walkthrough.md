---
run: run-spec-driven-ai-011
work_item: ui-scaffold
intent: developer-user-module
generated: 2026-09-13T17:50:00Z
mode: confirm
---

# Implementation Walkthrough: Admin UI Scaffold

## Summary

`frontend/` exists as a working, tested, **self-contained** Next.js project. Install, lint,
typecheck, test, and production build all pass. No feature screens — the frame.

36 tests. The constitution's boundary test holds: nothing in `frontend/` references `backend/`.

## Structure

```text
frontend/
├── package.json  tsconfig.json  next.config.mjs  tailwind.config.ts
├── eslint.config.mjs  .prettierrc  .gitignore  README.md  .env.example
├── components.json                      shadcn/ui configuration
├── vitest.config.ts
├── src/
│   ├── app/           layout (providers + shell), home, globals.css (theme tokens)
│   ├── components/
│   │   ├── ui/        button — shadcn/ui conventions, cva variants
│   │   ├── providers/ QueryProvider, ThemeProvider
│   │   └── layout/    AppShell (responsive nav), ThemeToggle
│   └── lib/           utils (cn), api-client, api-error
└── test/              setup, msw/server, render.tsx (the one helper)
```

## Key Implementation Details

### 1. Everything reusable is written exactly once

FR-UI13 is the requirement this scaffold either enables or undermines. Each concern has a single
home: `cn`, the API client, the error normaliser, the query defaults, the theme provider, and the
test render helper. Every later work item imports them rather than re-deriving them.

The error normaliser earns its place immediately: without it, each screen would interpret raw
status codes and the 401-vs-403 distinction would be re-litigated in every form.

### 2. 401 clears the session, 403 does not

A signed-in user who lacks one permission must not be logged out. The API client calls the
unauthenticated handler **only** on 401, and tests pin both directions.

### 3. Colours are tokens, never hex

Light values on `:root`, dark under `.dark`. A component using the tokens is correct in both
themes without knowing which is active — and the shell's axe assertion runs in both.

### 4. The act() warnings, and why the first fix was not enough

Every test logged `An update to ForwardRef(LinkComponent) was not wrapped in act(...)`.

My first diagnosis: the shared render helper had no router. That was **true and worth fixing** —
the testing standards specify query client, theme *and* router, and I had listed the router
without implementing it. `ui-auth` would have needed it for `useRouter`.

It did not silence the warnings. The real cause was `next/link` observing visibility to decide
when to prefetch, with no `IntersectionObserver` in jsdom. A stub that never reports intersection
fixed it.

Recording this because the first fix was correct and insufficient, and the warning count not
moving was the only thing that said so.

### 5. The auth seam exists but holds nothing

`ui-auth` owns where the token lives (D-10). The client takes a token getter, so that decision
stays in one file instead of spreading across call sites.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Query retries | 4xx never; network twice | Retrying a 403 delays the error and feels broken |
| Error normalisation | One module, one `ApiError` | Screens present errors; they do not interpret status codes |
| Field inference | From the API's message, in one function | Confined and tested; better than per-form string matching |
| Token storage | Deferred to `ui-auth` | It is that work item's decision (D-10); this provides the seam |
| Test router | Provided by the shared helper, overridable | Navigation assertions need it, and per-file wrappers are the duplication FR-UI13 forbids |

## Deviations from Plan

None in substance. Three fixes are in `review-report.md`; the act-warning investigation is above.

## How to Verify

```bash
cd frontend
npm install
npm test            # 36 tests
npm run typecheck   # clean
npm run lint        # clean
npm run build       # production build

cp .env.example .env.local
npm run dev         # http://localhost:3100
```

## Test Coverage

- Tests added: 36
- Both themes exercised with axe on the shell
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 16/16
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated (`frontend/README.md`)
- [x] Developer notes captured

## Developer Notes

**Navigation points at `/users`, `/roles`, `/permissions`, which 404 until the screen items
land.** That is expected for a scaffold — the shell is what those items build into.

**`ui-shared-components` is next and is the highest-leverage item on the frontend.** Three
screens depend on its DataTable; if that is not genuinely reusable, each screen grows its own.
Its props should be designed against all three use cases — users, roles, permissions — before it
is built, not after.

**Nothing works in the browser until `ui-auth` lands**, because every management route now
requires a token (run 010). The screens can be built and tested against MSW regardless.

**Next work item**: `ui-shared-components` (medium, confirm).

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-011*
