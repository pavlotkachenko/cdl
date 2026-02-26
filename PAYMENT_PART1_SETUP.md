# Payment Integration - Part 1 Setup Guide

## Overview
This guide covers the setup and deployment of Part 1 of the payment integration system, which includes core payment processing with Stripe.

## Prerequisites
- Node.js 16+ installed
- Supabase account and project
- Stripe account
- Access to Supabase Dashboard for SQL execution

## 1. Dependencies Installation

### Backend Dependencies
```bash
cd backend
npm install stripe
```

### Frontend Dependencies
```bash
cd frontend
npm install @stripe/stripe-js
```

✅ **Status**: Dependencies installed successfully

## 2. Database Migration

### Migration File
Location: `backend/src/migrations/011_payments.sql`

This migration creates:
- `payments` table - Core payment transactions
- `payment_refunds` table - Refund tracking
- Indexes for performance optimization
- Triggers for automatic timestamp updates
- Payment status fields on tickets table

### Running the Migration

**Method 1: Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `backend/src/migrations/011_payments.sql`
4. Paste and execute the SQL
5. Verify tables are created in the Table Editor

**Method 2: PostgreSQL CLI (If available)**
```bash
psql $DATABASE_URL -f backend/src/migrations/011_payments.sql
```

**Method 3: Using Supabase CLI (If installed)**
```bash
supabase db push
```

⚠️ **Note**: Supabase client SDK cannot execute DDL statements directly. Manual execution via dashboard is required.

## 3. Environment Variables

Add the following environment variables to your `.env` files:

### Backend (.env)
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Payment Configuration
PAYMENT_CURRENCY=USD
PAYMENT_SUCCESS_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel

# Existing Supabase Variables (ensure these are set)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend (.env)
```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# API Configuration
REACT_APP_API_URL=http://localhost:3001
```

## 4. Stripe Setup

### Create Stripe Account
1. Sign up at https://stripe.com
2. Complete account verification
3. Navigate to Developers → API keys
4. Copy your test mode keys

### Configure Webhook
1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payment_intent.canceled`
4. Copy the webhook signing secret
5. Update `STRIPE_WEBHOOK_SECRET` in your `.env`

## 5. Verify Installation

### Test Database Connection
```bash
cd backend
node -e "require('./src/config/supabase').testConnection()"
```

### Check Tables Created
Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('payments', 'payment_refunds');
```

### Test Stripe Connection
```bash
cd backend
node -e "const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); stripe.paymentIntents.list({limit: 1}).then(() => console.log('✅ Stripe connected')).catch(err => console.error('❌ Stripe error:', err.message));"
```

## 6. API Endpoints Available

### Payment Endpoints
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/ticket/:ticketId` - Get ticket payments
- `POST /api/payments/:id/refund` - Process refund

## 7. Testing Payment Flow

### Test Card Numbers (Stripe Test Mode)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication Required: `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## 8. Security Checklist

- ✅ Never commit `.env` files
- ✅ Use `STRIPE_SECRET_KEY` only on backend
- ✅ Validate webhook signatures
- ✅ Use HTTPS in production
- ✅ Enable Stripe radar for fraud detection
- ✅ Set up proper CORS configuration
- ✅ Use Row Level Security (RLS) on Supabase tables

## 9. Deployment Steps

### Backend Deployment
1. Set environment variables in hosting platform
2. Deploy backend application
3. Update webhook URL in Stripe dashboard
4. Test webhook delivery

### Frontend Deployment
1. Set `REACT_APP_STRIPE_PUBLISHABLE_KEY`
2. Update `REACT_APP_API_URL` to production backend
3. Build and deploy frontend
4. Test payment flow end-to-end

## 10. Troubleshooting

### Common Issues

**Migration Failed**
- Solution: Run migration manually via Supabase Dashboard SQL Editor
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

**Stripe Connection Error**
- Verify `STRIPE_SECRET_KEY` is correct
- Check API key mode (test vs. live)
- Ensure no extra whitespace in `.env` file

**Webhook Not Receiving Events**
- Verify webhook URL is accessible publicly
- Check webhook signing secret matches
- Review Stripe dashboard webhook logs

**Payment Intent Creation Failed**
- Check ticket exists and belongs to user
- Verify amount is positive
- Review Stripe API logs in dashboard

## 11. Monitoring and Logs

### What to Monitor
- Payment success/failure rates
- Webhook delivery status
- Refund requests
- Database query performance
- API response times

### Logging
Check logs in:
- Backend application logs
- Stripe Dashboard → Developers → Logs
- Supabase Dashboard → Database → Logs

## 12. Next Steps

Part 1 focuses on core payment processing. Future parts will include:
- **Part 2**: Subscription management and recurring payments
- **Part 3**: Advanced features (partial refunds, split payments)
- **Part 4**: Analytics and reporting dashboards

## Support

For issues or questions:
1. Check Stripe documentation: https://stripe.com/docs
2. Review Supabase docs: https://supabase.com/docs
3. Check application logs for error details
4. Verify all environment variables are set correctly

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Author**: DevOps Team
