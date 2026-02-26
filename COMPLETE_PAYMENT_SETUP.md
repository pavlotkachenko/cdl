# Complete Payment System Setup Guide

## Overview
This guide provides comprehensive instructions for deploying the complete CDL Ticket Management payment system with Stripe integration.

## System Architecture

### Backend Components
- **Payment Service** (`backend/src/services/paymentService.js`)
- **Subscription Service** (`backend/src/services/subscriptionService.js`)
- **Payment Routes** (`backend/src/routes/payments.js`)
- **Webhook Handler** (`backend/src/routes/webhooks.js`)

### Frontend Components
- **Payment Form** (`frontend/src/app/payments/`)
- **Subscription Management** (`frontend/src/app/subscriptions/`)
- **Analytics Dashboard** (`frontend/src/app/analytics/`)
- **Payment History** (`frontend/src/app/payment-history/`)

### Database Schema
- `payments` table - stores all payment transactions
- `subscriptions` table - manages attorney/firm subscriptions
- `webhook_events` table - idempotent webhook processing
- `refunds` table - refund transaction tracking

## Prerequisites

### Required Accounts
1. **Stripe Account** (Test Mode initially)
   - Sign up at https://stripe.com
   - Get API keys from Dashboard

2. **Supabase Account**
   - Project already configured at https://ahecrufmxtriyivaaeng.supabase.co

### Required Software
- Node.js 18+ and npm
- Git
- GitHub CLI (`gh`)

## Step 1: Database Migration

### Option A: Via Supabase Dashboard (Recommended)
1. Open Supabase SQL Editor:
   ```
   https://ahecrufmxtriyivaaeng.supabase.co/project/_/sql
   ```

2. Open and execute migration file:
   ```
   backend/src/migrations/011_payments.sql
   ```

3. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('payments', 'subscriptions', 'webhook_events', 'refunds');
   ```

### Option B: Via Command Line (if psql available)
```bash
cd /Users/paveltkachenko/prj/cdl-ticket-management/backend
psql $SUPABASE_DB_URL -f src/migrations/011_payments.sql
```

## Step 2: Environment Configuration

### Backend Environment Variables
Update `backend/.env`:

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Subscription Plans (in cents)
STRIPE_ATTORNEY_PLAN_PRICE_ID=price_attorney_monthly
STRIPE_FIRM_PLAN_PRICE_ID=price_firm_monthly
ATTORNEY_SUBSCRIPTION_PRICE=2999  # $29.99/month
FIRM_SUBSCRIPTION_PRICE=9999      # $99.99/month

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5001

# Supabase (already configured)
SUPABASE_URL=https://ahecrufmxtriyivaaeng.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend Environment Variables
Update `frontend/.env` or `frontend/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SUPABASE_URL=https://ahecrufmxtriyivaaeng.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Stripe Configuration

### Create Subscription Products
1. Go to Stripe Dashboard → Products
2. Create "Attorney Monthly Subscription"
   - Price: $29.99/month
   - Recurring billing
   - Copy Price ID to env var

3. Create "Law Firm Monthly Subscription"
   - Price: $99.99/month
   - Recurring billing
   - Copy Price ID to env var

### Configure Webhook Endpoint
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

4. Copy webhook signing secret to env var

### Test Webhook Locally (Development)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5001/api/webhooks/stripe
```

## Step 4: Install Dependencies

### Backend Dependencies
```bash
cd /Users/paveltkachenko/prj/cdl-ticket-management/backend
npm install stripe @supabase/supabase-js
```

### Frontend Dependencies
```bash
cd /Users/paveltkachenko/prj/cdl-ticket-management/frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## Step 5: Start Services

### Terminal 1: Backend Server
```bash
cd /Users/paveltkachenko/prj/cdl-ticket-management/backend
npm run dev
```
Server should start on `http://localhost:5001`

### Terminal 2: Frontend Application
```bash
cd /Users/paveltkachenko/prj/cdl-ticket-management/frontend
npm run dev
```
Application should start on `http://localhost:3000`

### Terminal 3: Stripe Webhook Forwarding (Development)
```bash
stripe listen --forward-to localhost:5001/api/webhooks/stripe
```

## Step 6: Testing the Payment System

### Test Case Payment Flow
1. Login to the application
2. Navigate to a case that requires payment
3. Click "Pay Now" or "Make Payment"
4. Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

5. Submit payment
6. Verify payment success message
7. Check case payment status updated to "paid"

### Test Subscription Flow
1. Login as attorney or firm admin
2. Navigate to Subscriptions page
3. Select subscription plan (Attorney or Firm)
4. Enter payment details (use test card)
5. Complete subscription
6. Verify subscription active status
7. Check subscription details and next billing date

### Test Refund Flow
1. Login as admin
2. Navigate to Payment History
3. Select a successful payment
4. Click "Process Refund"
5. Enter refund amount (full or partial)
6. Submit refund request
7. Verify refund status in payment history

### Test Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **3D Secure Required**: `4000 0025 0000 3155`

## Step 7: Verify API Endpoints

### Payment Endpoints
```bash
# Create payment intent
curl -X POST http://localhost:5001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"caseId": "case-uuid", "amount": 5000}'

# Get payment history
curl http://localhost:5001/api/payments/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Process refund
curl -X POST http://localhost:5001/api/payments/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"paymentId": "payment-uuid", "amount": 5000}'
```

### Subscription Endpoints
```bash
# Create subscription
curl -X POST http://localhost:5001/api/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"planType": "attorney"}'

# Get active subscription
curl http://localhost:5001/api/subscriptions/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Cancel subscription
curl -X POST http://localhost:5001/api/subscriptions/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Analytics Endpoints
```bash
# Get revenue analytics
curl http://localhost:5001/api/payments/analytics/revenue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get subscription metrics
curl http://localhost:5001/api/subscriptions/analytics/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 8: Monitor and Debug

### Check Backend Logs
```bash
# View real-time logs
tail -f /Users/paveltkachenko/prj/cdl-ticket-management/backend/logs/payment.log

# Check for errors
grep -i error /Users/paveltkachenko/prj/cdl-ticket-management/backend/logs/payment.log
```

### Check Stripe Dashboard
1. **Payments**: View all test payments
2. **Customers**: Verify customer creation
3. **Subscriptions**: Check subscription status
4. **Logs**: Review API requests and webhooks
5. **Events**: Monitor webhook delivery

### Check Database
```sql
-- Verify payment records
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check subscription status
SELECT * FROM subscriptions WHERE status = 'active';

-- Review webhook events
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

-- Payment analytics
SELECT 
  DATE_TRUNC('day', created_at) as date,
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments
GROUP BY date, status
ORDER BY date DESC;
```

## Common Issues and Solutions

### Issue: Payment Intent Creation Fails
**Solution**: 
- Verify Stripe secret key is correct
- Check amount is in cents and > 0
- Ensure user is authenticated

### Issue: Webhook Not Received
**Solution**:
- Verify webhook endpoint is accessible
- Check webhook secret matches
- Ensure Stripe CLI is forwarding (dev)
- Review webhook logs in Stripe Dashboard

### Issue: Subscription Creation Fails
**Solution**:
- Verify price IDs are correct
- Check customer exists in Stripe
- Ensure payment method attached
- Review Stripe API logs

### Issue: Refund Processing Fails
**Solution**:
- Verify payment exists and is captured
- Check refund amount <= original amount
- Ensure sufficient funds available
- Review Stripe balance

### Issue: Database Connection Error
**Solution**:
- Verify Supabase credentials
- Check network connectivity
- Ensure RLS policies allow operation
- Use service role key for admin operations

## Performance Optimization

### Database Indexes
```sql
-- Verify indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('payments', 'subscriptions');

-- Add additional indexes if needed
CREATE INDEX idx_payments_created_at_desc ON payments(created_at DESC);
CREATE INDEX idx_subscriptions_status_date ON subscriptions(status, current_period_end);
```

### Caching Strategy
- Cache subscription status (5 minutes)
- Cache payment analytics (15 minutes)
- Use Redis for session management

### Rate Limiting
```javascript
// Implement rate limiting for payment endpoints
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many payment requests, please try again later'
});

app.use('/api/payments', paymentLimiter);
```

## Security Checklist

- [ ] Stripe API keys stored in environment variables
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting implemented
- [ ] Authentication required for all payment endpoints
- [ ] PCI compliance maintained (no card data stored)
- [ ] Audit logging enabled

## Backup and Recovery

### Database Backup
```bash
# Backup via Supabase Dashboard
# Settings → Database → Backups → Manual backup

# Or via SQL
pg_dump $SUPABASE_DB_URL > backup_$(date +%Y%m%d).sql
```

### Stripe Data Export
- Dashboard → Data → Export
- Select date range and data types
- Download CSV or JSON format

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Payment Success Rate**: Target >95%
2. **Average Transaction Value**: Track trends
3. **Subscription Churn Rate**: Target <5%/month
4. **Payment Processing Time**: Target <2 seconds
5. **Webhook Success Rate**: Target >99%

### Set Up Alerts
- Failed payment rate >5%
- Webhook failures
- Database connection errors
- API response time >5 seconds
- Subscription cancellations spike

## Documentation

### API Documentation
Generated with Swagger/OpenAPI:
- Access at: `http://localhost:5001/api-docs`
- Export: `http://localhost:5001/api-docs.json`

### Code Comments
All payment-related code includes:
- Function documentation
- Parameter descriptions
- Return value specifications
- Error handling notes

## Support and Maintenance

### Regular Tasks
- **Daily**: Monitor payment success rate
- **Weekly**: Review failed payments
- **Monthly**: Analyze revenue metrics
- **Quarterly**: Security audit

### Contact Information
- **Stripe Support**: https://support.stripe.com
- **Supabase Support**: https://supabase.com/support
- **Developer Documentation**: See `/docs` folder

## Next Steps

1. Complete testing checklist
2. Review go-live checklist
3. Switch to production mode
4. Enable monitoring and alerts
5. Train support team
6. Launch payment system

## Appendix

### File Structure
```
backend/
├── src/
│   ├── services/
│   │   ├── paymentService.js
│   │   └── subscriptionService.js
│   ├── routes/
│   │   ├── payments.js
│   │   └── webhooks.js
│   ├── migrations/
│   │   └── 011_payments.sql
│   └── middleware/
│       └── paymentValidation.js
frontend/
├── src/
│   └── app/
│       ├── payments/
│       ├── subscriptions/
│       ├── analytics/
│       └── payment-history/
```

### Environment Variables Reference
See `.env.example` files in backend and frontend directories

### Testing Scripts
```bash
# Run payment tests
npm run test:payments

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Ready for Production
