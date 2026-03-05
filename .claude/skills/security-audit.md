# Skill: Security Audit

Comprehensive security review of the entire codebase or a specific feature. This replaces the CrewAI QA Engineer agent's validation task.

## Trigger

Use when:
- Before any production deployment
- After implementing auth-related changes
- After adding new database tables or RLS policies
- On a periodic schedule (e.g., before each release)
- When the user says "run a security audit" or "check security"

## Audit Steps

### 1. Authentication & Authorization Review

```bash
# Find all route files
find backend/src/routes/ -name "*.js" -o -name "*.ts"
```

For each route file, verify:
- [ ] Protected routes have `authenticate` middleware
- [ ] Role-based routes have `authorize(['role1', 'role2'])` middleware
- [ ] Public endpoints are explicitly listed (check auth interceptor allowlist — BUG-001)
- [ ] JWT token validation is applied consistently
- [ ] No endpoint allows privilege escalation

### 2. RLS Policy Audit

Read `supabase_schema.sql` and all migration files, then verify:

- [ ] Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Every table has at least one SELECT policy
- [ ] Driver policies filter by `auth.uid()` linkage
- [ ] Admin policies grant full access correctly
- [ ] No policies have infinite recursion (BUG-003 pattern)
- [ ] No policies use `USING (true)` without role check

### 3. Input Validation Scan

Search the codebase for:

```
# Unsanitized user input
grep -r "req.body\." backend/src/controllers/ --include="*.js"
grep -r "req.params\." backend/src/controllers/ --include="*.js"
grep -r "req.query\." backend/src/controllers/ --include="*.js"
```

For each occurrence, verify:
- [ ] Input is validated before use
- [ ] SQL queries use parameterized inputs (Supabase handles this)
- [ ] No string concatenation in queries
- [ ] File paths from user input are sanitized

### 4. Secret Exposure Scan

```
# Search for hardcoded secrets
grep -ri "password\s*=" --include="*.js" --include="*.ts" backend/ frontend/
grep -ri "api_key\s*=" --include="*.js" --include="*.ts" backend/ frontend/
grep -ri "secret\s*=" --include="*.js" --include="*.ts" backend/ frontend/
grep -ri "sk_live\|sk_test\|pk_live\|pk_test" backend/ frontend/
```

Verify:
- [ ] No API keys hardcoded in source files
- [ ] `.env` files are in `.gitignore`
- [ ] Frontend environment files don't contain service role keys
- [ ] Only public (anon) keys are in frontend code

### 5. XSS Prevention

```
# Search for dangerous patterns in Angular
grep -r "innerHTML" frontend/src/ --include="*.ts" --include="*.html"
grep -r "bypassSecurityTrust" frontend/src/ --include="*.ts"
grep -r "DomSanitizer" frontend/src/ --include="*.ts"
```

Verify:
- [ ] No unescaped user content rendered as HTML
- [ ] `bypassSecurityTrust*` is used sparingly with known-safe content only
- [ ] User-generated content is sanitized before display

### 6. Error Message Review

```
# Check error responses don't leak internals
grep -r "res.status.*json.*error\|res.json.*error" backend/src/ --include="*.js"
```

Verify:
- [ ] Error responses use generic messages ("Something went wrong")
- [ ] Stack traces are never sent to clients
- [ ] Auth errors don't reveal whether email exists (BUG-004 pattern)
- [ ] Internal details are logged server-side, not returned

### 7. Dependency Vulnerability Check

```bash
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit
```

Report any critical or high-severity vulnerabilities.

## Output Format

```markdown
## Security Audit Report — [Date]

### Overall Risk: LOW / MEDIUM / HIGH / CRITICAL

### Findings

#### Critical (Must Fix Immediately)
1. [Finding] — Location — Remediation

#### High (Fix Before Next Release)
1. [Finding] — Location — Remediation

#### Medium (Fix Within Sprint)
1. [Finding] — Location — Remediation

#### Low (Track and Address)
1. [Finding] — Location — Remediation

### RLS Policy Matrix
| Table | RLS Enabled | Policies Count | Driver Isolated | Admin Full Access |
|-------|-------------|----------------|-----------------|-------------------|
| users | YES/NO | N | YES/NO | YES/NO |
| cases | YES/NO | N | YES/NO | YES/NO |
| ... | | | | |

### Dependency Audit
- Backend: X critical, Y high, Z moderate
- Frontend: X critical, Y high, Z moderate

### Recommendations
1. [Priority action]
2. [Priority action]
```
