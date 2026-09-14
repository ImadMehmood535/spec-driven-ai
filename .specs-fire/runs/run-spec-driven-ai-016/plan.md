---
run: run-spec-driven-ai-016
work_item: ui-users
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-15T04:00:00Z
---

# Implementation Plan: User Management Screens

> Checkpoint self-served under the standing instruction.

## Approach

The last screen. Satisfies FR-UI1. Same kit, with three things the other two screens did not
have: credentials, a single-role control, and two unique fields.

## Files to Create

`features/users/types.ts`, `useUserQueries.ts`, `UserForm.tsx`, `ChangePasswordDialog.tsx`,
`AssignRoleDialog.tsx`, `UsersPage.tsx`, `app/users/page.tsx`, spec files.

## Technical Details — what differs from roles and permissions

**Two unique fields, so the form must not blanket-attribute a 409.** Roles and permissions have
one unique field each, so their forms map any conflict to `name`. Users have `email` **and**
`username`. The API's messages do contain those words, so the generic inference in
`api-error.ts` works here — use it rather than overriding. Run 015's note called this out.

**The password field appears only when creating.** An edit that carried a password would put a
credential in a general-purpose body; changing one is its own dialog, matching the API (D-9).

**Nothing echoes the password.** Not in a toast, not in a URL, not in a log. A test asserts the
value never appears in rendered output after submit.

**Role assignment is a single value, and the control must say so.** §6 allows one role per user;
a multi-select would imply otherwise and set an expectation the module will not meet. When a role
is already set, the action reads "Change role".

**A user with no role is shown as such**, and the UI must not imply they hold permissions
(FR-AC4).

**Deactivation copy names the real consequence**: the user will be unable to sign in (FR-U7).

## Tests

List states and filters; create validation; duplicate email and username each landing on the
right field; role assignment replacing rather than accumulating; password change; deactivate
confirmation copy; gating; no delete; axe in both themes; and a test asserting no password value
appears in rendered output.

---
*Plan approved at checkpoint. Execution follows.*
