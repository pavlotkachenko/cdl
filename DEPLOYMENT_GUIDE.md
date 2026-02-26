# Deployment Guide - Enhanced Features

## Overview
This guide provides step-by-step instructions for deploying the enhanced features to production.

## Prerequisites

### Required
- PostgreSQL database
- Node.js 18+ and npm
- Supabase account
- SendGrid account (email)
- Twilio account (SMS)

### Optional (Recommended)
- Redis server (for caching)
- Tesseract OCR (for document scanning)
- Google Cloud account (for Google Vision OCR)

---

## 1. Environment Setup

### 1.1 Update Environment Variables

Copy the updated `.env.example` to `.env` and configure:

```bash
cd backend
cp .env.example .env
```

### 1.2 Configure New Variables

Add the following to your `.env` file:

```bash
# Redis Configuration (Optional - For Caching & Performance)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false
REDIS_TTL=3600

# OCR Service Configuration
OCR_SERVICE=tesseract

# Google Vision API (Only if using Google Vision)
# GOOGLE_VISION_API_KEY=your-google-vision-api-key-here
# GOOGLE_VISION_PROJECT_ID=your-gcp-project-id

# Smart Assignment Configuration
ASSIGNMENT_ALGORITHM=smart
ASSIGNMENT_SCORING_WEIGHTS=workload:0.4,expertise:0.3,performance:0.2,availability:0.1

# Analytics Configuration
ANALYTICS_CACHE_ENABLED=true
ANALYTICS_CACHE_TTL=1800

# SLA Configuration (in hours)
SLA_RESPONSE_TIME=24
SLA_RESOLUTION_TIME=168
SLA_WARNING_THRESHOLD=0.8

# Workflow Configuration
WORKFLOW_AUTOMATION_ENABLED=true
WORKFLOW_CHECK_INTERVAL=60000

# Message Template Configuration
TEMPLATES_CACHE_ENABLED=true
TEMPLATES_CACHE_TTL=3600
```

---

## 2. Install Optional Dependencies

### 2.1 Redis (Optional but Recommended)

Redis provides caching for analytics and improves performance.

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

**Enable in .env:**
```bash
REDIS_ENABLED=true
```

### 2.2 Tesseract OCR (Optional)

Tesseract provides local OCR for document scanning.

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

**Verify installation:**
```bash
tesseract --version
```

**Configure in .env:**
```bash
OCR_SERVICE=tesseract
```

### 2.3 Google Vision API (Alternative to Tesseract)

If you prefer cloud-based OCR:

1. Go to Google Cloud Console
2. Enable Cloud Vision API
3. Create API key or service account
4. Configure in .env:

```bash
OCR_SERVICE=google-vision
GOOGLE_VISION_API_KEY=your-api-key-here
GOOGLE_VISION_PROJECT_ID=your-project-id
```

---

## 3. Database Migrations

### 3.1 Connect to PostgreSQL

Ensure your `DATABASE_URL` is correctly set in `.env`:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/cdl_tickets
```

### 3.2 Run Migrations

The new migrations add:
- **008_attorney_profiles.sql**: Attorney specializations, licenses, success rates
- **009_workflow_tracking.sql**: SLA tracking, status history, escalations
- **010_message_enhancements.sql**: Templates, reactions, threading

**Using Supabase Dashboard:**
1. Log in to Supabase
2. Go to SQL Editor
3. Run each migration file in order

**Using psql:**
```bash
cd backend/src/migrations

# Run migration 008
psql $DATABASE_URL -f 008_attorney_profiles.sql

# Run migration 009
psql $DATABASE_URL -f 009_workflow_tracking.sql

# Run migration 010
psql $DATABASE_URL -f 010_message_enhancements.sql
```

**Using pg client (if psql not available):**
```bash
npm install -g pg-cli
pg $DATABASE_URL < 008_attorney_profiles.sql
pg $DATABASE_URL < 009_workflow_tracking.sql
pg $DATABASE_URL < 010_message_enhancements.sql
```

### 3.3 Verify Migrations

Check that new tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'case_assignments',
    'case_status_history',
    'case_sla_tracking',
    'message_templates',
    'message_reactions'
);
```

Check new columns in users table:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
    'specializations',
    'state_licenses',
    'success_rate',
    'availability_status',
    'current_cases_count'
);
```

---

## 4. Backend Testing

### 4.1 Install Dependencies

```bash
cd backend
npm install
```

### 4.2 Start Development Server

```bash
npm run dev
```

Expected output:
```
[nodemon] starting `node src/server.js`
Server running on port 3000
WebSocket server running on port 3001
```

### 4.3 Test New Endpoints

**Test Smart Assignment:**
```bash
curl -X POST http://localhost:3000/api/cases/123/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Test Operator Dashboard:**
```bash
curl http://localhost:3000/api/dashboard/operator \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Attorney Dashboard:**
```bash
curl http://localhost:3000/api/dashboard/attorney \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Analytics:**
```bash
curl http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Test Message Templates:**
```bash
curl http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4.4 Check Logs

Monitor the console for any errors. All endpoints should return proper responses.

---

## 5. Frontend Testing

### 5.1 Install Dependencies

```bash
cd frontend
npm install
```

### 5.2 Start Development Server

```bash
npm start
# or
ng serve
```

### 5.3 Test New Features

1. **Operator Dashboard**
   - Navigate to `/operator/dashboard`
   - Verify workload metrics
   - Test smart assignment

2. **Attorney Dashboard**
   - Navigate to `/attorney/dashboard`
   - Verify kanban board
   - Test case filtering

3. **Driver Dashboard**
   - Navigate to `/driver/dashboard`
   - Verify timeline view
   - Test document upload with OCR

4. **Analytics**
   - Navigate to `/analytics`
   - Verify charts render
   - Test date range filters

5. **Message Templates**
   - Navigate to any case
   - Open messaging
   - Test template picker

---

## 6. Production Deployment

### 6.1 Backend Deployment

**Build and test:**
```bash
cd backend
npm run start
```

**Environment checklist:**
- [ ] All secrets are set (JWT, database, API keys)
- [ ] Redis URL configured (if using)
- [ ] OCR service configured
- [ ] Email/SMS providers configured
- [ ] CORS origins updated for production domain

**Deploy to your hosting provider:**
- Heroku: `git push heroku main`
- AWS: Upload to Elastic Beanstalk
- DigitalOcean: Deploy via App Platform
- VPS: Use PM2 for process management

### 6.2 Frontend Deployment

**Update environment:**
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  wsUrl: 'wss://your-api-domain.com'
};
```

**Build:**
```bash
cd frontend
npm run build
```

**Deploy:**
- Netlify: Drag `dist/` folder to Netlify
- Vercel: `vercel deploy`
- AWS S3: Upload to S3 bucket with CloudFront
- Firebase: `firebase deploy`

---

## 7. Post-Deployment Verification

### 7.1 Health Checks

Test critical endpoints:
```bash
# Backend health
curl https://your-api-domain.com/api/health

# Test authentication
curl https://your-api-domain.com/api/auth/login \
  -d '{"email":"test@example.com","password":"password"}'
```

### 7.2 Feature Verification

- [ ] Users can log in
- [ ] Cases can be created
- [ ] Smart assignment works
- [ ] Dashboards load correctly
- [ ] Analytics display properly
- [ ] Messages send successfully
- [ ] Templates load
- [ ] Document upload works (with/without OCR)

### 7.3 Performance Monitoring

- Monitor response times
- Check Redis hit rate (if enabled)
- Monitor database query performance
- Check error logs

---

## 8. Rollback Plan

If issues occur:

### 8.1 Database Rollback

```sql
-- Rollback migration 010
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS message_templates CASCADE;
ALTER TABLE messages DROP COLUMN IF EXISTS parent_message_id;
ALTER TABLE messages DROP COLUMN IF EXISTS thread_id;
ALTER TABLE messages DROP COLUMN IF EXISTS is_edited;
ALTER TABLE messages DROP COLUMN IF EXISTS edited_at;

-- Rollback migration 009
DROP TABLE IF EXISTS case_sla_tracking CASCADE;
DROP TABLE IF EXISTS case_status_history CASCADE;
ALTER TABLE cases DROP COLUMN IF EXISTS is_escalated;
ALTER TABLE cases DROP COLUMN IF EXISTS escalated_at;
ALTER TABLE cases DROP COLUMN IF EXISTS escalation_reason;
ALTER TABLE cases DROP COLUMN IF EXISTS assigned_at;

-- Rollback migration 008
DROP TABLE IF EXISTS case_assignments CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS specializations;
ALTER TABLE users DROP COLUMN IF EXISTS state_licenses;
ALTER TABLE users DROP COLUMN IF EXISTS success_rate;
ALTER TABLE users DROP COLUMN IF EXISTS availability_status;
ALTER TABLE users DROP COLUMN IF EXISTS current_cases_count;
```

### 8.2 Code Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or checkout previous version
git checkout previous-version-tag

# Redeploy
git push origin main
```

---

## 9. Monitoring and Maintenance

### 9.1 Key Metrics

Monitor:
- API response times
- Database query performance
- Redis cache hit rate
- Error rates
- User activity

### 9.2 Regular Tasks

**Daily:**
- Check error logs
- Monitor SLA breaches
- Review escalated cases

**Weekly:**
- Review analytics performance
- Check Redis memory usage
- Update message templates as needed

**Monthly:**
- Review attorney success rates
- Optimize database indexes
- Clean up old data

---

## 10. Troubleshooting

### Common Issues

**Issue: Redis connection fails**
```bash
# Check Redis status
redis-cli ping

# Should return PONG
```

**Issue: OCR not working**
```bash
# Test Tesseract
tesseract --version

# Test with sample image
tesseract sample.jpg output
```

**Issue: Migrations fail**
- Check database permissions
- Verify PostgreSQL version (11+)
- Check for conflicting table/column names

**Issue: Smart assignment not working**
- Verify attorney profiles have data
- Check ASSIGNMENT_SCORING_WEIGHTS
- Review assignment.service.js logs

---

## Support

For issues or questions:
1. Check logs: `backend/logs/app.log`
2. Review ENHANCED_FEATURES.md
3. Check GitHub issues
4. Contact development team

---

## Next Steps

1. Monitor production deployment
2. Gather user feedback
3. Plan incremental improvements
4. Schedule regular maintenance

---

**Deployment Date:** [TO BE FILLED]
**Deployed By:** [TO BE FILLED]
**Version:** 2.0.0 - Enhanced Features
