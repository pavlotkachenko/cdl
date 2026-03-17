# Story CL-1: Backend — Remove Stale Duplicate Files

**Status:** DONE
**Priority:** P0
**Sprint:** 057

## Description
Remove duplicate and stale files from the backend that were causing confusion and could lead to import errors.

## Files Removed
1. `backend/src/controllers/messages.controller.js` — Stale Sequelize-based controller (active: `message.controller.js` using Supabase)
2. `backend/src/middleware/auth.ts` — Unused TypeScript middleware in a JavaScript project
3. `backend/src/controllers/court-dates.controller.js` — Empty placeholder with no implementation
4. `backend/src/services/calendar.service.js` — Empty placeholder with no implementation
5. `backend/src/services/notification.service.updated.js` — Empty placeholder file

## Verification
- [x] Active `message.controller.js` contains all required exports (sendMessage, sendMessageWithFile, markMessageAsRead, deleteMessage, getMessageById)
- [x] No imports reference the deleted files
- [x] Backend tests pass (`npm test --no-coverage`)
- [x] Build compiles without errors

## Acceptance Criteria
- [x] No stale/duplicate controller files in `backend/src/controllers/`
- [x] No empty placeholder services in `backend/src/services/`
- [x] No TypeScript files in the JavaScript backend
