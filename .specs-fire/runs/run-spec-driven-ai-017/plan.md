---
run: run-spec-driven-ai-017
work_item: e2e-critical-flows
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-15T05:00:00Z
---

# Implementation Plan: End-to-End Critical Flows

> Checkpoint self-served under the standing instruction. **The final work item.**

## Approach

Playwright covering the seams that only break when the whole stack is assembled. Component
behaviour is already covered by 228 Vitest tests; these exist to catch what those cannot — a
token flowing from login through the API client to a guarded route, and a status change
propagating through resolution to the interface.

Deliberately small. This is an integration suite, not a second coverage layer.

## Files to Create

| File | Purpose |
|------|---------|
| `frontend/playwright.config.ts` | Runs against both projects; starts the UI itself |
| `frontend/e2e/helpers.ts` | Unique per-run names (D-11), sign-in helper |
| `frontend/e2e/login.spec.ts` | Sign in as the seeded admin; the failure path |
| `frontend/e2e/management-flow.spec.ts` | Permission → role → assign → user → assign role |
| `frontend/e2e/authorization.spec.ts` | A limited user refused; 403 is not a logout |

## Files to Modify

`frontend/package.json` — `test:e2e`; `frontend/.gitignore` — Playwright output.

## Technical Details — D-11

**Nothing is deletable (D-5), so specs cannot clean up after themselves.** Every spec generates a
run-scoped suffix for the names it creates and asserts only on its own records.

Two guardrails follow, and both are easy to violate without noticing:

- **Never assert on a total row count** or "the first row in the table" — a previous run's data
  is still there.
- **Never hard-code a name** a previous run could have created.

The suite must pass against a database that already holds data, not only a fresh one.

## What is deliberately NOT covered

Component states, validation messages, keyboard behaviour, axe — all covered by the Vitest
suites. Repeating them here would be slow and would duplicate coverage rather than add it.

---
*Plan approved at checkpoint. Execution follows.*
