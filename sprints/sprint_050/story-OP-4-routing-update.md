# Story OP-4: Update Operator Routing

## Status: DONE

## Description
Replace placeholder routes (pointing to dashboard) with dedicated profile and notifications components.

## Changes
- **`operator-routing.module.ts`**:
  - `/operator/notifications` → `OperatorNotificationsComponent` (was: dashboard placeholder)
  - `/operator/profile` → `OperatorProfileComponent` (was: dashboard placeholder)

## Acceptance Criteria
- [x] /operator/notifications loads notifications component
- [x] /operator/profile loads profile component
- [x] /operator/dashboard, /operator/cases, /operator/queue still work
- [x] Build succeeds
