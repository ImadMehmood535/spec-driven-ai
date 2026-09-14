---
run: run-spec-driven-ai-017
work_item: e2e-critical-flows
intent: developer-user-module
generated: 2026-09-15T05:45:00Z
mode: confirm
---

# Implementation Walkthrough: End-to-End Critical Flows

## Summary

Nine Playwright specs covering the seams that only break when the whole stack is assembled.

**This completes all 17 work items.** 614 tests across three suites: 377 backend, 228 frontend,
9 end-to-end.

## What it found

**The two projects could not talk to each other in a browser.**

The API never enabled CORS. A preflight `OPTIONS /auth/login` returned **404**, and no
`Access-Control-Allow-Origin` header was sent — so the browser blocked every request and login
never completed.

Nothing before this run could have caught it:

| Verification | Why it missed this |
|---|---|
| Backend runs (`curl`) | `curl` does not enforce CORS |
| Frontend runs (MSW) | Intercepts before a real request leaves |
| Runs 011–016 | Served both projects and checked each responded — never made the browser call the API |

Every individual verification was sound. The gap was *between* them, which is precisely the
category of defect an integration suite exists for.

Fixed in `backend/src/main.ts` with a configurable **allow-list, never a wildcard** — a test
asserts that, because `origin: '*'` is the reflexive fix and the wrong one for an authenticated
API. `credentials` stays `false`: the token travels in an `Authorization` header, not a cookie.

**This is a backend change made inside a frontend work item.** Not scope creep — the work item's
first acceptance criterion is that the administrator can sign in, which was impossible until the
fix.

## The suite

```text
login.spec.ts          the seeded admin signs in and reaches the app
                       an unauthenticated visitor is redirected
                       a wrong password, and an unknown user, refused identically
                       sign-out returns to login and re-protects the app

management-flow.spec   permission → role → assign → user → assign role, all through the UI
                       then: the API resolves that permission for that user      (FR-AC1/AC2)
                       then: deactivate the permission → it disappears           (FR-AC3)
                       then: reactivate → it returns

authorization.spec     a limited user reaches what their role allows, and is refused elsewhere
                       a 403 does not sign them out
                       the seeded administrator reaches every screen             (FR-S7, D-7)
```

**Deliberately small** — nine tests against 605 unit tests. Component states, validation,
keyboard behaviour and axe are covered elsewhere. These cover only what the others cannot.

**The management flow asserts the effect, not the clicks.** After driving the UI it queries the
API for the user's effective permissions, deactivates the permission, asserts the exclusion, then
reactivates and asserts restoration. That final step matters: without it the exclusion could be
data destruction rather than the FR-AC3 gate working.

## D-11, verified rather than assumed

Nothing is deletable (D-5), so specs cannot clean up after themselves. Each generates a
run-scoped suffix and asserts only on its own records — never a total count, never "the first
row".

Proof: the suite was run **twice in succession against the same database**, the second time with
the first run's data still present. 9 passed, then 9 passed.

## Four findings that were mine, not the product's

**The permission fixture is the one worth repeating.** I generated `e2e.mu1pk4ytayyr`, and the
form rejected it. Permission names allow lowercase letters and hyphens only — and both `e2e` and
a base36 id contain digits. **The product was right and my fixture was wrong.** The fix generates
a letters-only run id rather than stripping digits from the existing one, which would have
shortened it and weakened the uniqueness D-11 depends on.

The others: Next's route announcer also carries `role="alert"`; `signIn` returned before the
redirect completed and three specs raced it; and `exact: true` on a label that carries a required
marker.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CORS origin | Explicit allow-list from config | A wildcard on an authenticated API is the reflexive wrong answer |
| Credentials | `false` | The token is an `Authorization` header, not a cookie |
| Suite size | Nine tests | Integration, not a second coverage layer |
| API startup | Not started by this project | Starting the backend from the frontend would couple them |
| Workers | 1 | One database, one seeded administrator; parallel runs would interleave |
| Setup | Through the API, assertions through the UI | Re-driving already-tested clicks is slow and fragile |

## How to Verify

```bash
# API
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run start:dev

# e2e (starts the UI itself)
cd frontend && npm run test:e2e        # 9 tests

# and everything else
cd backend  && npm test                # 377
cd frontend && npm test                # 228
```

## Test Coverage

- Tests added: 9 e2e + 7 backend (CORS config); 614 total
- Re-runnability proven by two consecutive runs against the same database
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 10/10
- [x] Tests passing; both projects typecheck and lint clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**Every run leaves rows behind.** D-11's accepted cost of D-5 — nothing is deletable. A long-lived
development database will accumulate `endtoend.*` permissions and `E2E Role-*` roles. The names
make them easy to find if you want to truncate periodically.

**`CORS_ORIGIN` must be set for any deployment** where the UI is not on `http://localhost:3100`.
It accepts a comma-separated list. The default is local development only.

**The suite needs the API already running.** The Playwright config starts the UI but deliberately
not the backend — starting one project from the other would couple them, which the constitution
forbids.

**This is the last work item.** All 17 are complete.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-017*
