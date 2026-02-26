# Payment System Go-Live Checklist

## Pre-Launch Preparation

### 1. Stripe Account Setup
- [ ] **Complete Stripe Account Verification**
  - Business details submitted
  - Bank account verified and connected
  - Tax information completed (W-9 or equivalent)
  - Identity verification completed
  - Terms of Service accepted

- [ ] **Business Information**
  - Legal business name correct
  - Business address accurate
  - Support contact information current
  - Public business website URL configured
  - Customer support email/phone listed

### 2. Stripe Live Mode Configuration

#### API Keys
- [ ] Generate Live API Keys
  - Secret Key: `sk_live_...`
  - Publishable Key: `pk_live_...`
  - Store securely in production environment variables
  - NEVER commit to version control

#### Update Environment Variables
```bash
# Production Backend (.env)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY

# Production Frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
```

#### Subscription Products
- [ ] Create Live Mode Products in Stripe Dashboard
  - Attorney Monthly Subscription ($29.99/month)
    - Copy Price ID → Update env: `STRIPE_ATTORNEY_PLAN_PRICE_ID`
  - Firm Monthly Subscription ($99.99/month)
    - Copy Price ID → Update env: `STRIPE_FIRM_PLAN_PRICE_ID`

### 3. Webhook Configuration

- [ ] **Create Production Webhook Endpoint**
  - URL: `https://your-production-domain.com/api/webhooks/stripe`
  - Select Events:
    - [x] `payment_intent.succeeded`
    - [x] `payment_intent.payment_failed`
    - [x] `payment_intent.canceled`
    - [x] `charge.refunded`
    - [x] `customer.subscription.created`
    - [x] `customer.subscription.updated`
    - [x] `customer.subscription.deleted`
    - [x] `invoice.payment_succeeded`
    - [x] `invoice.payment_failed`
  - Copy Webhook Signing Secret → Update env: `STRIPE_WEBHOOK_SECRET`

- [ ] **Verify Webhook Endpoint**
  - Send test webhook from Stripe Dashboard
  - Confirm endpoint responds with 200 OK
  - Check webhook event logged in database

### 4. Database Migration

- [ ] **Run Production Migration**
  - Backup existing database first
  - Execute migration: `backend/src/migrations/011_payments.sql`
  - Verify tables created:
    - `payments`
    - `subscriptions`
    - `webhook_events`
    - `refunds`
  - Verify indexes created
  - Test RLS policies

- [ ] **Database Verification**
  ```sql
  -- Verify tables exist
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'subscriptions', 'webhook_events', 'refunds');
  
  -- Check indexes
  SELECT tablename, indexname FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND tablename IN ('payments', 'subscriptions');
  ```

### 5. Security Configuration

- [ ] **HTTPS/SSL**
  - SSL certificate installed and valid
  - Force HTTPS redirect enabled
  - HSTS headers configured

- [ ] **Environment Security**
  - All secrets in environment variables
  - No credentials in code or logs
  - Environment variables not exposed to client

- [ ] **API Security**
  - CORS configured for production domain only
  - Rate limiting enabled on payment endpoints
  - Authentication required for all payment APIs
  - Input validation on all endpoints

- [ ] **PCI Compliance**
  - No card data stored in database
  - Stripe.js handles all card input
  - Payment tokens only passed to backend
  - Stripe hosted checkout used when possible

### 6. Testing with Real Payments

#### Small Test Transactions
- [ ] **Process Real Test Payment ($0.50)**
  - Login with real account
  - Make minimum payment ($0.50)
  - Verify payment success in Stripe Dashboard
  - Check payment record in database
  - Verify case payment_status updated
  - Confirm email notifications sent

- [ ] **Test Subscription Creation**
  - Create real subscription (attorney plan)
  - Verify subscription active in Stripe
  - Check subscription record in database
  - Confirm subscription confirmation email
  - Verify billing cycle set correctly

- [ ] **Test Refund Processing**
  - Process full refund on test payment
  - Verify refund in Stripe Dashboard
  - Check refund record in database
  - Confirm refund notification email

- [ ] **Test Failed Payment Handling**
  - Attempt payment with insufficient funds card: `4000 0000 0000 9995`
  - Verify graceful error handling
  - Check failed payment logged
  - Confirm error message shown to user

### 7. Monitoring Setup

- [ ] **Stripe Dashboard Monitoring**
  - Email notifications enabled for:
    - Failed payments
    - Disputed charges
    - Refunds
    - Subscription cancellations

- [ ] **Application Monitoring**
  - Error tracking enabled (Sentry, LogRocket, etc.)
  - Payment success/failure rates tracked
  - API response times monitored
  - Database query performance monitored

- [ ] **Alert Configuration**
  - Alert on payment success rate < 95%
  - Alert on webhook failures
  - Alert on database errors
  - Alert on API response time > 5 seconds

### 8. Documentation and Training

- [ ] **Internal Documentation**
  - Payment flow documented
  - Refund process documented
  - Subscription management documented
  - Troubleshooting guide created

- [ ] **Support Team Training**
  - Payment process walkthrough completed
  - Common issues and solutions reviewed
  - Access to Stripe Dashboard provided
  - Escalation procedures established

- [ ] **User Documentation**
  - Help articles published
  - FAQ section updated
  - Payment troubleshooting guide available
  - Contact support information visible

### 9. Backup and Recovery Plan

- [ ] **Database Backups**
  - Automated daily backups enabled
  - Backup retention policy set (30 days minimum)
  - Test restore procedure completed
  - Backup monitoring alerts configured

- [ ] **Disaster Recovery**
  - Recovery time objective (RTO) defined
  - Recovery point objective (RPO) defined
  - Disaster recovery runbook created
  - Contact list for emergency situations

### 10. Legal and Compliance

- [ ] **Terms of Service**
  - Payment terms clearly stated
  - Refund policy published
  - Subscription terms explained
  - Auto-renewal disclosure included

- [ ] **Privacy Policy**
  - Payment data handling explained
  - Third-party processor (Stripe) disclosed
  - Data retention policy stated
  - User rights outlined

- [ ] **Tax Compliance**
  - Sales tax collection configured (if applicable)
  - Tax reporting set up in Stripe
  - Accounting integration configured

## Go-Live Execution

### Launch Day (D-Day)

#### Morning (Before Launch)
- [ ] **Final System Check** (8:00 AM)
  - All services running
  - Database connections stable
  - Stripe API responding
  - Webhooks endpoint accessible

- [ ] **Deploy to Production** (9:00 AM)
  - Deploy backend with live Stripe keys
  - Deploy frontend with live publishable key
  - Verify deployment successful
  - Run smoke tests

- [ ] **Enable Payment System** (10:00 AM)
  - Switch feature flag to enable payments
  - Monitor first transactions closely
  - Check webhook delivery

#### Afternoon (Monitoring)
- [ ] **Monitor First Transactions** (12:00 PM - 6:00 PM)
  - Watch payment success rate
  - Check for errors in logs
  - Verify webhook processing
  - Monitor user feedback

- [ ] **Performance Check** (3:00 PM)
  - API response times normal
  - Database performance stable
  - No memory leaks detected
  - Error rate within acceptable range

#### Evening (Review)
- [ ] **End of Day Review** (6:00 PM)
  - Review all transactions
  - Address any issues encountered
  - Update team on status
  - Plan for overnight monitoring

## Post-Launch Monitoring (24-72 Hours)

### Day 1 (Launch Day)
- [ ] Monitor every 2 hours
- [ ] Review all payment transactions
- [ ] Check webhook success rate
- [ ] Address any user-reported issues immediately

### Day 2 (D+1)
- [ ] Monitor every 4 hours
- [ ] Review payment analytics
- [ ] Check subscription creation rate
- [ ] Verify refund processing working

### Day 3 (D+2)
- [ ] Monitor every 6 hours
- [ ] Analyze payment patterns
- [ ] Review customer feedback
- [ ] Check for any edge cases

### Week 1 Review (D+7)
- [ ] Full system performance review
- [ ] Payment success rate analysis
- [ ] Customer satisfaction survey
- [ ] Identify optimization opportunities

## Key Metrics to Track

### Payment Metrics
- **Payment Success Rate**: Target >95%
- **Average Transaction Value**: Baseline established
- **Payment Processing Time**: Target <2 seconds
- **Failed Payment Rate**: Target <5%

### Subscription Metrics
- **Subscription Conversion Rate**: Track week over week
- **Active Subscriptions**: Monitor growth
- **Churn Rate**: Target <5% per month
- **Average Subscription Lifetime**: Track trends

### Technical Metrics
- **API Response Time**: Target <500ms (p95)
- **Webhook Success Rate**: Target >99%
- **Database Query Time**: Target <100ms
- **Error Rate**: Target <0.1%

## Rollback Plan

### If Critical Issues Arise

#### Immediate Actions
1. **Disable New Payments**
   - Set feature flag to disable payment form
   - Display maintenance message to users
   - Process existing queued payments

2. **Assess Impact**
   - How many transactions affected?
   - What is the root cause?
   - Can it be fixed quickly?

3. **Communication**
   - Notify affected users
   - Update status page
   - Inform support team

#### Rollback Procedure
```bash
# Revert to previous deployment
git revert <commit-hash>
git push origin main

# Switch back to test mode (if needed)
# Update environment variables to use test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Redeploy
./deploy.sh

# Verify rollback successful
curl https://your-domain.com/health
```

## Support Contacts

### Emergency Contacts
- **Technical Lead**: [Phone/Email]
- **DevOps Engineer**: [Phone/Email]
- **Product Manager**: [Phone/Email]
- **On-Call Engineer**: [Phone/Email]

### External Support
- **Stripe Support**: https://support.stripe.com (24/7)
- **Supabase Support**: https://supabase.com/support
- **Hosting Provider**: [Support URL/Phone]

## Success Criteria

### Launch Considered Successful If:
- [ ] Payment success rate >95% for first 24 hours
- [ ] Zero critical bugs reported
- [ ] Webhook delivery rate >99%
- [ ] No security incidents
- [ ] Customer satisfaction positive
- [ ] All subscriptions processing correctly

## Post-Launch Tasks (Week 1)

- [ ] **Monday**: Review weekend performance
- [ ] **Tuesday**: Optimize based on usage patterns
- [ ] **Wednesday**: Address any user feedback
- [ ] **Thursday**: Financial reconciliation with Stripe
- [ ] **Friday**: Week 1 retrospective meeting

## Continuous Improvement

### Monthly Reviews
- Analyze payment trends
- Review failed payments
- Optimize conversion rates
- Update documentation
- Train new team members

### Quarterly Reviews
- Security audit
- Performance optimization
- Feature enhancements
- Competitive analysis
- Cost optimization

---

## Sign-Off

### Pre-Launch Approval
- [ ] Technical Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______
- [ ] DevOps Engineer: _________________ Date: _______
- [ ] Legal/Compliance: _________________ Date: _______

### Go-Live Authorization
- [ ] CEO/CTO: _________________ Date: _______

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Next Review**: Before Go-Live

**Notes**:
- This checklist should be reviewed and updated before each major release
- All checkboxes must be completed before going live
- Any items that cannot be completed must be documented with mitigation plan
- Keep a copy of this checklist with all boxes checked as proof of due diligence
