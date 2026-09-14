---
run: run-spec-driven-ai-013
work_item: ui-auth
intent: developer-user-module
mode: validate
checkpoint: plan
approved_at: 2026-09-15T01:05:00Z
---

# Implementation Plan: Login and Session Handling

> Checkpoints self-served under the standing instruction. Design doc:
> `.specs-fire/intents/developer-user-module/work-items/ui-auth-design.md`

## Approach

Login screen, session state, and the wiring that makes every other screen possible: the token
attached to requests, claims feeding `PermissionGate`, and redirects on expiry.

Token lives in browser storage per **D-10**, with the XSS consequence treated as a hard
requirement rather than a preference.

## Files to Create

`lib/token.ts` (store/read/clear/decode/expiry); `AuthProvider`; `RequireAuth`; `AppChrome`
(keeps `/login` outside the guard and shell); `features/auth/useLogin.ts`; `LoginForm`;
`app/login/page.tsx`; four spec files.

## Files to Modify

`app/layout.tsx` (provider wiring); `AppShell` (username + sign-out).

## Technical Details

**Claims are decoded, never verified.** A browser cannot meaningfully check a signature; the API
is the authority. Claims decide only what to show.

**An expired token is discarded on load**, before it is ever sent — otherwise the first request
of every session after expiry is a guaranteed 401.

**`/login` renders outside both the guard and the shell.** Inside the guard it would redirect to
itself; inside the shell it would show navigation to someone who cannot use it.

**Sign-out clears the query cache, not just the token.** Otherwise the next person on the same
browser sees the previous user's data.

**The API's uniform failure message is shown verbatim.** Elaborating client-side would recreate
the user-enumeration oracle the API deliberately avoids.

---
*Plan approved at checkpoint. Execution follows.*
