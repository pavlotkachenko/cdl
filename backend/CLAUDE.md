# Backend Conventions — CDL Ticket Management

> Stack: Node.js 18+, Express 5, Supabase (PostgreSQL), Jest

## Architecture Rules

### Controllers are thin
Controllers validate input, call services, return responses. Business logic lives in services.

```javascript
// CORRECT
exports.getUsers = async (req, res) => {
  const { role, status } = req.query;
  const users = await userService.getAll({ role, status });
  res.json({ users });
};

// WRONG — business logic in controller
exports.getUsers = async (req, res) => {
  const { data } = await supabase.from('users').select('*').eq('role', req.query.role);
  // ... 40 lines of mapping logic
};
```

### Error response format (mandatory)
```javascript
// Always this shape:
res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email is required' } });

// Never raw errors:
res.status(500).json({ error: err.message }); // WRONG
res.status(500).json({ message: 'Something failed' }); // WRONG
```

Never expose stack traces in responses. Never reveal if an email exists in auth errors ("Invalid credentials" always).

### Middleware pattern
```javascript
const { authenticate, authorize } = require('../middleware/auth');

// Role-protected routes:
const adminOnly = [authenticate, authorize('admin')];
router.get('/users', adminOnly, controller.getUsers);

// Auth only (any role):
router.get('/profile', authenticate, controller.getProfile);
```

## Supabase Client Usage

| Client | When to use |
|---|---|
| `supabase` | All DB queries (= supabaseAdmin alias) |
| `supabaseAdmin` | Explicit bypass-RLS operations |
| `supabaseAnon` | Auth sign-in ONLY (BUG-003) |

```javascript
const { supabase, supabaseAnon } = require('../config/supabase');

// DB query — use supabase:
const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

// Auth sign-in — use supabaseAnon:
const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
```

**Never** use one client for both auth and DB operations in the same flow (BUG-003).

## Database Patterns

### Field mapping
DB column `is_active` → API field `status`:
- `is_active = true` → `status: 'active'`
- `is_active = false` → `status: 'suspended'`
- `is_active = null` (or no row) → `status: 'pending'`

DB column `full_name` → API field `name`.

### Queries
```javascript
// Array result (direct await):
const { data, error } = await supabase.from('users').select('*');

// Single row:
const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

// Optional single row (no error if not found):
const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();

// Count:
const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin');
```

## JWT
- 7-day expiry
- Must include `role` claim
- Verified by `authenticate` middleware on all protected routes

## Password Hashing
- bcrypt with 10 salt rounds
- Never store plaintext passwords

## File Structure
```
src/
├── controllers/   ← thin handlers (validate → call service → respond)
├── services/      ← business logic
├── routes/        ← Express route definitions
├── middleware/    ← auth, error, upload, validation
├── config/        ← supabase.js, database.js
├── utils/         ← errors.js and shared helpers
└── __tests__/     ← Jest test files (*.test.js)
```

## Testing with Jest

### Mock pattern for Supabase
```javascript
jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
const { supabase } = require('../config/supabase');

let chain;
function buildChain(result = { data: [], error: null }) {
  chain = {};
  ['select','insert','update','delete','eq','neq','order','limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}
beforeEach(() => { jest.resetAllMocks(); buildChain(); });
```

### Test helpers
```javascript
function makeReq(overrides = {}) {
  return { user: { id: 'u1', role: 'admin' }, query: {}, params: {}, body: {}, ...overrides };
}
function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}
```

### Test file location
Every controller: `src/__tests__/<name>.controller.test.js`
Every service: `src/__tests__/<name>.service.test.js`

## Environment Variables Required
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
STRIPE_SECRET_KEY
SENDGRID_API_KEY       ← guard with: if (!process.env.SENDGRID_API_KEY) return;
```

## Email Service Pattern
Non-blocking — always catch and log, never rethrow:
```javascript
emailService.sendWelcomeEmail(user).catch(err => console.error('Email failed:', err));
```

## Known Bugs to Avoid

| ID | Pattern to avoid | Fix |
|---|---|---|
| BUG-003 | Shared Supabase client for auth + data | Use `supabaseAnon` for auth, `supabase` for data |
| BUG-004 | DB enum mismatch (e.g. `carrier` vs `driver`) | Use `dbRole()` mapping function in auth.controller |
