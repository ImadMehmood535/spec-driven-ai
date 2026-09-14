---
run: run-spec-driven-ai-012
work_item: ui-shared-components
intent: developer-user-module
mode: confirm
checkpoint: plan
approved_at: 2026-09-13T18:00:00Z
---

# Implementation Plan: Shared UI Component Kit

> Checkpoint self-served under the standing instruction.

## Approach

Build the kit **before** the screens, so no screen has a reason to hand-roll its own table, form
field, or empty state. This is how FR-UI13 gets enforced rather than hoped for.

The DataTable's props are designed against **all three** use cases — users, roles, permissions —
up front. If a screen later needs something it cannot express, the kit's props are wrong and the
kit changes; a screen must never fork a component.

## Files to Create

| Component | Purpose |
|-----------|---------|
| `ui/input`, `ui/label`, `ui/badge`, `ui/skeleton`, `ui/table` | shadcn/ui primitives the kit composes from |
| `ui/dialog`, `ui/dropdown-menu`, `ui/select`, `ui/checkbox` | Radix-backed primitives for row actions, forms, column visibility |
| `shared/DataTable` | Filtering, sorting, server pagination, column visibility, row actions (FR-UI8) |
| `shared/PageHeader` | Title, description, actions slot |
| `shared/FormField` | Label + control + description + error, used by every form (FR-UI9) |
| `shared/StatusBadge` | ACTIVE/INACTIVE, not colour-only |
| `shared/ConfirmDialog` | Consequential actions (FR-UI7) |
| `shared/EmptyState` | What is absent and the action that fills it |
| `shared/ErrorState` | What failed, with retry |
| `shared/TableSkeleton`, `shared/FormSkeleton` | Match the real layout, not a spinner |
| `hooks/usePermissions` + `shared/PermissionGate` | FR-UI6 gating |

## Tests

Every component: its states, keyboard interaction, and a `jest-axe` assertion. The DataTable
gets the most — filter, sort, paginate, toggle columns, row actions, and the empty and loading
paths.

## Technical Details

**Server-side pagination**, wired to the API's `page`/`size` and `PaginationMeta`. The API caps
size at 100, so the page-size options must not offer more.

**The table scrolls inside its own container** on narrow viewports; the page body never scrolls
horizontally (FR-UI10).

**`StatusBadge` never relies on colour alone** — it carries the text, because colour-only status
fails for colour-blind users and in high-contrast modes.

**`usePermissions` is usability only.** It reads the token's claims to hide or disable controls.
It must never be described or relied on as security — the API enforces that (FR-AC5–AC7).
Until `ui-auth` lands there are no claims, so it reads from a provider that defaults to empty.

---
*Plan approved at checkpoint. Execution follows.*
