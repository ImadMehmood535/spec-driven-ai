---
run: run-spec-driven-ai-013
work_item: ui-auth
intent: developer-user-module
generated: 2026-09-15T01:35:00Z
mode: validate
---

# Implementation Walkthrough: Login and Session Handling

## Summary

The admin UI can sign in. Satisfies FR-UI5 and the client half of FR-UI6, and makes every
remaining screen possible — the token is attached to requests, claims feed `PermissionGate`, and
expiry is handled without a loop.

142 tests. Both projects verified running together against the seeded database.

## The session, end to end

```text
/login  (outside the guard and the shell)
  └─ LoginForm → POST /auth/login { identifier, password }
       ├─ 401 → the API's uniform message, shown verbatim
       └─ 200 → signIn(token)
                  ├─ decode claims (never verify — the API is the authority)
                  ├─ store in browser storage            (D-10)
                  └─ redirect to /

AuthProvider (mounted once)
  ├─ on load: read stored token, discard it if expired
  ├─ setTokenGetter()            → the api-client seam from run 011
  ├─ setUnauthenticatedHandler() → 401 clears the session and redirects
  └─ PermissionsProvider(claims.permissions)   → every PermissionGate

RequireAuth
  └─ no session → /login     ·     still reading → skeleton, never a guess
```

## Key Implementation Details

### 1. The failure message is passed through untouched

The API returns **one** message for an unknown user, a wrong password, and a deactivated account
(run 008 went to some trouble for that, including timing parity). The form renders it verbatim.

Adding anything helpful here — "no such user", "account disabled" — would rebuild the
enumeration oracle the API deliberately avoids. A test asserts the rendered text is exactly what
the API sent.

### 2. 401 and 403 do different things

401 clears the session and redirects. 403 leaves the user signed in and shows "not permitted".
Conflating them would sign someone out for lacking a single permission — a genuinely annoying
bug, and both directions are tested.

### 3. Sign-out clears the query cache, not just the token

Without it, the next person on a shared browser sees the previous user's data from TanStack
Query's cache. A test seeds cache data, signs out, and asserts it is gone.

### 4. An expired token is discarded before it is used

Otherwise every session that outlives its token spends a guaranteed 401 to discover it, then
bounces. The provider checks `exp` on load and clears rather than sending.

### 5. D-10's consequence is treated as an obligation

A token in browser storage is readable by any script on the page. Two things are therefore
requirements, checked by grep rather than assumed:

```
dangerouslySetInnerHTML : 0 occurrences
third-party script tags : 0 occurrences
```

If a later screen ever renders API-supplied HTML, the token becomes extractable.

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Browser `localStorage` | D-10 — a refresh should not force re-login |
| Claims | Decoded, never verified | A browser cannot check a signature; the API is the authority |
| Expired token | Discarded on load | Avoids a guaranteed-401 first request |
| 403 | Stay signed in | A missing permission is not a failed session |
| Sign-out | Clear token **and** cache | A shared browser must not leak |
| `/login` placement | Outside the guard and shell | Inside the guard it redirects to itself |
| Guard | Client-side | Middleware cannot read browser storage |

## Deviations from Plan

**One test I had written wrong.** I asserted the "still reading the token" skeleton through the
provider. It failed — `localStorage` is synchronous, so `ready` flips within the same commit RTL
flushes, and that window is unobservable that way.

Worse, its companion ("does not redirect while still reading") was **passing for the wrong
reason**: with `ready` already true and a valid token, no redirect would happen regardless. It
asserted nothing.

Both now test the branch directly with a controlled auth state. The state is real in a browser —
one frame before the effect runs — and this is how you actually verify it.

## How to Verify

```bash
# API
cd backend && docker compose up -d && npm run migrate && npm run seed && npm run start:dev

# UI
cd frontend && cp .env.example .env.local && npm run dev   # http://localhost:3100

# then, in a browser:
#   /              → redirected to /login
#   sign in as admin@developer.local with your SEED_ADMIN_PASSWORD
#   → redirected to /, username and sign-out visible in the shell
#   sign out       → back to /login, cache cleared

cd frontend && npm test    # 142 tests
```

## Test Coverage

- Tests added: 44; 142 total
- Live: both projects running together; unauthenticated root verified to leak no data
- Status: passing

## Ready for Review

- [x] All acceptance criteria met — 13/13
- [x] Tests passing; typecheck, lint, build clean
- [x] No critical issues
- [x] Documentation updated
- [x] Developer notes captured

## Developer Notes

**Every remaining screen depends on this.** `PermissionGate` was inert until now — it had no
claims. The three screen items can assume a signed-in user and a populated permission set.

**Keep the two D-10 mitigations true.** No untrusted HTML, no third-party scripts. They are the
difference between "a token in storage" and "a token anyone can steal".

**The server renders the shell for `/` before the client guard redirects.** Verified it leaks no
data. If server-side protection is ever wanted, the session has to move to an `httpOnly` cookie —
which would change D-10 and require the API to set it.

**Next work item**: `ui-permissions` (medium, confirm) — the simplest of the three screens, and
the proving ground for whether the shared kit is genuinely reusable.

---
*Generated by specs.md - fabriqa.ai FIRE Flow Run run-spec-driven-ai-013*
