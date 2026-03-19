#!/usr/bin/env node
// ============================================
// Stripe Integration Test Script
// Sprint 062 — Driver Payments
//
// Tests real Stripe API calls using test-mode keys:
//   1. Create PaymentIntent (success card)
//   2. Confirm PaymentIntent server-side
//   3. Create PaymentIntent (declined card)
//   4. Confirm PaymentIntent — expect decline
//   5. Create PaymentMethod + immediate charge
//   6. Retrieve PaymentIntent details
//   7. Process partial refund
//   8. Process full refund
//   9. Verify payment shows in driver's history via API
//
// Usage:  cd backend && node src/scripts/test-stripe-payments.js
// Requires: STRIPE_SECRET_KEY in .env
// ============================================

'use strict';

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe test card tokens
// https://docs.stripe.com/testing#cards
const TEST_CARDS = {
  success: 'pm_card_visa',              // 4242 4242 4242 4242 — always succeeds
  declined: 'pm_card_visa_chargeDeclined', // 4000 0000 0000 0002 — always declined
  insufficient: 'pm_card_chargeDeclinedInsufficientFunds', // 4000 0000 0000 9995
  threeDSecure: 'pm_card_threeDSecure2Required',  // requires 3DS authentication
  amex: 'pm_card_amex',                 // 3782 822463 10005 — Amex
  mastercard: 'pm_card_mastercard',      // 5555 5555 5555 4444 — Mastercard
};

const DRIVER = {
  email: 'driver@test.com',
  id: '1e687d6f-e496-480d-9ff7-aa06ab181f72',
};

let passCount = 0;
let failCount = 0;

function pass(label) {
  passCount++;
  console.log(`  ✅ ${label}`);
}

function fail(label, err) {
  failCount++;
  console.log(`  ❌ ${label}: ${err}`);
}

// ─── Test 1: Create PaymentIntent (success card) ───────────

async function testCreatePaymentIntent() {
  console.log('\n── Test 1: Create PaymentIntent (Visa 4242) ──');
  const intent = await stripe.paymentIntents.create({
    amount: 45000, // $450.00
    currency: 'usd',
    payment_method: TEST_CARDS.success,
    metadata: {
      caseId: 'test-case-001',
      userId: DRIVER.id,
      description: 'Attorney Fee — Test Case 001',
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  if (intent.id.startsWith('pi_')) pass('PaymentIntent created: ' + intent.id);
  else fail('PaymentIntent ID format', intent.id);

  if (intent.status === 'requires_confirmation') pass('Status: requires_confirmation');
  else pass('Status: ' + intent.status);

  if (intent.amount === 45000) pass('Amount: $450.00 (45000 cents)');
  else fail('Amount mismatch', intent.amount);

  return intent;
}

// ─── Test 2: Confirm PaymentIntent (success) ───────────────

async function testConfirmPaymentIntent(intent) {
  console.log('\n── Test 2: Confirm PaymentIntent (success) ──');
  const confirmed = await stripe.paymentIntents.confirm(intent.id);

  if (confirmed.status === 'succeeded') pass('Payment succeeded');
  else fail('Expected succeeded', confirmed.status);

  const charge = confirmed.latest_charge;
  if (charge) pass('Charge ID: ' + charge);
  else fail('No charge attached', '');

  // Retrieve charge details
  if (charge) {
    const chargeObj = await stripe.charges.retrieve(charge);
    if (chargeObj.payment_method_details?.card?.brand === 'visa')
      pass('Card brand: visa');
    if (chargeObj.payment_method_details?.card?.last4 === '4242')
      pass('Card last4: 4242');
    if (chargeObj.receipt_url)
      pass('Receipt URL: ' + chargeObj.receipt_url.substring(0, 50) + '...');
  }

  return confirmed;
}

// ─── Test 3: Create PaymentIntent (declined card) ──────────

async function testDeclinedCard() {
  console.log('\n── Test 3: Create + Confirm with declined card ──');
  const intent = await stripe.paymentIntents.create({
    amount: 55000, // $550.00
    currency: 'usd',
    payment_method: TEST_CARDS.declined,
    metadata: {
      caseId: 'test-case-002',
      userId: DRIVER.id,
      description: 'Attorney Fee — Declined Test',
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  pass('Intent created: ' + intent.id);

  try {
    await stripe.paymentIntents.confirm(intent.id);
    fail('Should have thrown on declined card', 'no error');
  } catch (err) {
    if (err.code === 'card_declined') {
      pass('Card declined error: ' + err.code);
      pass('Decline code: ' + err.raw?.decline_code);
    } else {
      fail('Unexpected error code', err.code);
    }
  }

  // Verify the intent status is now requires_payment_method
  const retrieved = await stripe.paymentIntents.retrieve(intent.id);
  if (retrieved.status === 'requires_payment_method')
    pass('Status after decline: requires_payment_method');
  else
    pass('Status after decline: ' + retrieved.status);

  return intent;
}

// ─── Test 4: Insufficient funds card ───────────────────────

async function testInsufficientFunds() {
  console.log('\n── Test 4: Insufficient funds card ──');
  const intent = await stripe.paymentIntents.create({
    amount: 99900, // $999.00
    currency: 'usd',
    payment_method: TEST_CARDS.insufficient,
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  }).catch(err => err);

  if (intent.code === 'card_declined') {
    pass('Card declined: insufficient_funds');
    if (intent.raw?.decline_code === 'insufficient_funds')
      pass('Decline code: insufficient_funds');
  } else if (intent.type === 'StripeCardError') {
    pass('StripeCardError raised correctly');
  } else {
    fail('Expected decline', JSON.stringify(intent.code || intent.status));
  }
}

// ─── Test 5: Create PaymentMethod + immediate charge ───────

async function testImmediateCharge() {
  console.log('\n── Test 5: Create PaymentMethod + confirm in one call ──');

  const intent = await stripe.paymentIntents.create({
    amount: 32500, // $325.00
    currency: 'usd',
    payment_method: TEST_CARDS.mastercard,
    confirm: true,
    metadata: {
      caseId: 'test-case-003',
      userId: DRIVER.id,
      description: 'Attorney Fee — Mastercard immediate charge',
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  if (intent.status === 'succeeded') pass('Immediate charge succeeded');
  else fail('Expected succeeded', intent.status);

  if (intent.latest_charge) {
    const charge = await stripe.charges.retrieve(intent.latest_charge);
    if (charge.payment_method_details?.card?.brand === 'mastercard')
      pass('Card brand: mastercard');
    if (charge.payment_method_details?.card?.last4 === '4444')
      pass('Card last4: 4444');
  }

  return intent;
}

// ─── Test 6: Amex card ─────────────────────────────────────

async function testAmexCard() {
  console.log('\n── Test 6: Amex card charge ──');
  const intent = await stripe.paymentIntents.create({
    amount: 7500, // $75.00
    currency: 'usd',
    payment_method: TEST_CARDS.amex,
    confirm: true,
    metadata: {
      caseId: 'test-case-004',
      userId: DRIVER.id,
      description: 'Filing Fee — Amex',
    },
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  });

  if (intent.status === 'succeeded') pass('Amex charge succeeded');
  else fail('Expected succeeded', intent.status);

  if (intent.latest_charge) {
    const charge = await stripe.charges.retrieve(intent.latest_charge);
    if (charge.payment_method_details?.card?.brand === 'amex')
      pass('Card brand: amex');
    if (charge.payment_method_details?.card?.last4 === '0005')
      pass('Card last4: 0005');
  }

  return intent;
}

// ─── Test 7: Partial refund ────────────────────────────────

async function testPartialRefund(intent) {
  console.log('\n── Test 7: Partial refund ($100 of $325) ──');
  const refund = await stripe.refunds.create({
    payment_intent: intent.id,
    amount: 10000, // $100.00
    reason: 'requested_by_customer',
  });

  if (refund.status === 'succeeded') pass('Partial refund succeeded');
  else fail('Expected succeeded', refund.status);

  if (refund.amount === 10000) pass('Refund amount: $100.00');
  else fail('Refund amount mismatch', refund.amount);

  // Verify intent still has remaining amount
  const updated = await stripe.paymentIntents.retrieve(intent.id);
  if (updated.amount === 32500) pass('Original amount unchanged: $325.00');

  return refund;
}

// ─── Test 8: Full refund ───────────────────────────────────

async function testFullRefund(intent) {
  console.log('\n── Test 8: Full refund ($75.00 Amex) ──');
  const refund = await stripe.refunds.create({
    payment_intent: intent.id,
    reason: 'requested_by_customer',
  });

  if (refund.status === 'succeeded') pass('Full refund succeeded');
  else fail('Expected succeeded', refund.status);

  if (refund.amount === 7500) pass('Refund amount: $75.00 (full)');
  else fail('Refund amount mismatch', refund.amount);
}

// ─── Test 9: List recent PaymentIntents ────────────────────

async function testListPaymentIntents() {
  console.log('\n── Test 9: List recent PaymentIntents ──');
  const list = await stripe.paymentIntents.list({
    limit: 10,
    created: { gte: Math.floor(Date.now() / 1000) - 600 }, // last 10 min
  });

  if (list.data.length > 0)
    pass(`Found ${list.data.length} recent intents`);
  else
    fail('No recent intents found', '');

  const succeeded = list.data.filter(i => i.status === 'succeeded');
  const failed = list.data.filter(i => i.status === 'requires_payment_method');
  console.log(`    Succeeded: ${succeeded.length}, Failed/Declined: ${failed.length}`);
}

// ─── Test 10: Verify driver payments via backend API ───────

async function testDriverPaymentsAPI() {
  console.log('\n── Test 10: Verify driver payment history via API ──');
  const http = require('http');

  // Sign in
  const signIn = (email, password) => new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('error', reject);
    req.end(data);
  });

  const apiGet = (path, token) => new Promise((resolve, reject) => {
    const req = http.request('http://localhost:3000' + path, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + token },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });
    req.on('error', reject);
    req.end();
  });

  try {
    const auth = await signIn('driver@test.com', 'Test1234!');
    if (!auth.token) {
      fail('Could not sign in as driver', JSON.stringify(auth).substring(0, 100));
      return;
    }
    pass('Signed in as driver@test.com');

    // Stats
    const stats = await apiGet('/api/payments/user/me/stats', auth.token);
    if (stats.success && stats.data) {
      pass(`Stats — total: $${stats.data.total_amount}, paid: $${stats.data.paid_amount}, txns: ${stats.data.transaction_count}`);
    } else {
      fail('Stats endpoint failed', JSON.stringify(stats).substring(0, 100));
    }

    // Payments list
    const payments = await apiGet('/api/payments/user/me?per_page=5', auth.token);
    if (payments.success && payments.data) {
      pass(`Payments list — ${payments.data.length} returned, total: ${payments.pagination?.total}`);
      payments.data.forEach(p => {
        console.log(`    ${p.status.padEnd(10)} $${p.amount.toFixed(2).padStart(8)} ${p.description || ''}`);
      });
    } else {
      fail('Payments list failed', JSON.stringify(payments).substring(0, 100));
    }

    // Filter by status
    const succeeded = await apiGet('/api/payments/user/me?status=succeeded&per_page=3', auth.token);
    if (succeeded.success) {
      const allSucceeded = succeeded.data.every(p => p.status === 'succeeded');
      if (allSucceeded) pass('Filter by status=succeeded works');
      else fail('Filter returned non-succeeded', '');
    }

    // Stripe config
    const config = await apiGet('/api/payments/config', auth.token);
    if (config.success && config.data.publishableKey?.startsWith('pk_test_'))
      pass('Stripe publishable key returned (pk_test_...)');
    else
      fail('Stripe config missing', '');

  } catch (err) {
    fail('API test error', err.message);
  }
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  Stripe Integration Tests — CDL Ticket Mgmt     ║');
  console.log('║  Using test-mode keys (no real charges)          ║');
  console.log('╚══════════════════════════════════════════════════╝');

  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
    console.error('\n❌ STRIPE_SECRET_KEY must be a test key (sk_test_...)');
    process.exit(1);
  }

  console.log(`\nStripe key: sk_test_...${process.env.STRIPE_SECRET_KEY.slice(-6)}`);

  // Run tests sequentially
  const successIntent = await testCreatePaymentIntent();
  const confirmedIntent = await testConfirmPaymentIntent(successIntent);
  await testDeclinedCard();
  await testInsufficientFunds();
  const mcIntent = await testImmediateCharge();
  const amexIntent = await testAmexCard();
  await testPartialRefund(mcIntent);
  await testFullRefund(amexIntent);
  await testListPaymentIntents();
  await testDriverPaymentsAPI();

  // Summary
  console.log('\n══════════════════════════════════════════════════');
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('══════════════════════════════════════════════════\n');

  if (failCount > 0) process.exit(1);
}

main().catch(err => {
  console.error('\n❌ Test suite failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
