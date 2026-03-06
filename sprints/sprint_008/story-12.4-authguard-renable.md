# Story 12.4 — Re-enable AuthGuard on Driver Routes

**Sprint:** 008 — Driver Experience Modernization
**Status:** DONE

## Goal
Re-enable the `AuthGuard` on all driver routes. It was disabled to unblock development.

## Changes
- Uncommented `import { AuthGuard } from '../../core/guards/auth.guard'`
- Restored `canActivate: [AuthGuard]` on the `LayoutComponent` route wrapper

## File
`frontend/src/app/features/driver/driver-routing.module.ts`
