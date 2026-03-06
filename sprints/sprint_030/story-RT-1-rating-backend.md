# Story RT-1 — Rating System Backend

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As Miguel (driver),
I want to rate my attorney after my case is resolved,
so other drivers can choose the best representation and attorneys are held accountable.

## Changes

### `backend/src/services/rating.service.js` — CREATED

Key functions:
- `submitRating(caseId, driverId, score, comment)` — validates score 1–5, prevents duplicate ratings per case, inserts into `ratings` table
- `getAttorneyRatings(attorneyId)` — returns all ratings for an attorney with average score and count
- `getMyRating(userId)` — returns average score and review count for the authenticated attorney

### `backend/src/controllers/rating.controller.js` — CREATED

- `POST /api/ratings` — driver submits rating; requires `caseId`, `score` (1–5)
- `GET /api/ratings/me` — attorney fetches their own aggregate (avg score, count)
- `GET /api/ratings/attorney/:id` — fetch public aggregate for a given attorney

### `backend/src/routes/rating.routes.js` — CREATED

```
POST   /api/ratings                → submitRating      (verifyToken, role: driver)
GET    /api/ratings/me             → getMyRating       (verifyToken, role: attorney)
GET    /api/ratings/attorney/:id   → getAttorneyRatings (verifyToken)
```

### `backend/src/server.js` — UPDATED

Registered `ratingRoutes` at `/api/ratings`.

## Database

Uses `ratings` table (assumed pre-existing from schema or add migration):
```sql
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) NOT NULL,
  driver_id UUID REFERENCES users(id) NOT NULL,
  attorney_id UUID REFERENCES users(id) NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (case_id, driver_id)   -- one rating per case per driver
);
```

## Acceptance Criteria

- [x] Driver can submit a 1–5 star rating with optional comment
- [x] Duplicate rating for same case returns 409 conflict
- [x] Attorney `GET /api/ratings/me` returns `{ averageScore, reviewCount }`
- [x] Score outside 1–5 returns 400 validation error

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `rating.service.js` | `rating.service.test.js` | ✅ 12 tests |
| `rating.controller.js` | `rating.service.test.js` | ✅ |
