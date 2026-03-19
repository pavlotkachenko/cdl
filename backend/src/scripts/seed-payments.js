#!/usr/bin/env node
// ============================================
// Seed Script: Payment Test Data
// Sprint 062 — Driver Payments Page
//
// Creates realistic payment records for driver@test.com
// with a mix of statuses, card brands, amounts, and dates.
// Idempotent — safe to run multiple times.
//
// Usage:  cd backend && node src/scripts/seed-payments.js
// ============================================

'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Known IDs from seed-messages.js
const DRIVER = {
  email: 'driver@test.com',
  pubId: '1e687d6f-e496-480d-9ff7-aa06ab181f72',
};

const ATTORNEY = {
  email: 'attorney@test.com',
  pubId: 'b253caea-6d25-4e5f-b9c7-d06d11a27269',
};

// ---- Helpers ----
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

async function hasCardColumns() {
  const { error } = await supabase.from('payments').select('card_brand').limit(0);
  return !error;
}

function fakeStripeId(prefix, i) {
  return `${prefix}_seed_${Date.now()}_${i}`;
}

// ---- Ensure cases exist (reuse existing or create) ----
async function ensureCase(caseNumber, opts = {}) {
  const { data: existing } = await supabase
    .from('cases')
    .select('id')
    .eq('case_number', caseNumber)
    .maybeSingle();

  if (existing) {
    // Update payment fields if provided
    if (opts.payment_status || opts.payment_amount) {
      await supabase.from('cases').update({
        ...(opts.payment_status && { payment_status: opts.payment_status }),
        ...(opts.payment_amount && { payment_amount: opts.payment_amount }),
      }).eq('id', existing.id);
    }
    console.log(`  ✓ Case ${caseNumber} exists (${existing.id})`);
    return existing.id;
  }

  const { data: newCase, error } = await supabase.from('cases').insert({
    case_number: caseNumber,
    driver_id: DRIVER.pubId,
    assigned_attorney_id: opts.attorney_id || ATTORNEY.pubId,
    status: opts.status || 'assigned_to_attorney',
    violation_type: opts.violation_type || 'speeding',
    state: opts.state || 'TX',
    county: opts.county || 'Travis County',
    customer_name: 'John Driver',
    customer_type: 'one_time_driver',
    payment_status: opts.payment_status || 'unpaid',
    payment_amount: opts.payment_amount || null,
  }).select('id').single();

  if (error) throw new Error(`Failed to create case ${caseNumber}: ${error.message}`);
  console.log(`  ✓ Case ${caseNumber} created (${newCase.id})`);
  return newCase.id;
}

// ---- Main ----
async function main() {
  console.log('=== Seed Payments Script ===\n');

  // Check if payments already seeded
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', DRIVER.pubId);

  if (count >= 10) {
    console.log(`Driver already has ${count} payments. Skipping to avoid duplicates.`);
    console.log('To re-seed, first delete: DELETE FROM payments WHERE user_id = \'...\';');
    return;
  }

  // 1. Ensure we have enough cases for diverse payments
  console.log('1. Ensuring cases...');
  const cases = {};
  cases.c058 = await ensureCase('CASE-2026-000058', {
    violation_type: 'speeding',
    payment_status: 'paid', payment_amount: 450.00, status: 'closed',
  });
  cases.c122 = await ensureCase('CASE-2026-000122', {
    violation_type: 'dot_inspection', // location:'I-10 El Paso, TX',
    payment_status: 'paid', payment_amount: 850.00, status: 'closed',
  });
  cases.c189 = await ensureCase('CASE-2026-000189', {
    violation_type: 'hos_logbook', // location:'US-75 Dallas, TX',
    payment_status: 'pending', payment_amount: 325.00, status: 'assigned_to_attorney',
  });
  cases.c201 = await ensureCase('CASE-2026-000201', {
    violation_type: 'speeding', // location:'I-20 Midland, TX',
    payment_status: 'paid', payment_amount: 275.00, status: 'closed',
  });
  cases.c245 = await ensureCase('CASE-2026-000245', {
    violation_type: 'other', // location:'US-59 Houston, TX',
    payment_status: 'unpaid', payment_amount: 550.00, status: 'assigned_to_attorney',
  });
  cases.c310 = await ensureCase('CASE-2026-000310', {
    violation_type: 'speeding', // location:'I-35W Fort Worth, TX',
    payment_status: 'refunded', payment_amount: 400.00, status: 'closed',
  });
  cases.c378 = await ensureCase('CASE-2026-000378', {
    violation_type: 'dot_inspection', // location:'I-30 Arlington, TX',
    payment_status: 'paid', payment_amount: 725.00, status: 'closed',
  });
  cases.c412 = await ensureCase('CASE-2026-000412', {
    violation_type: 'hos_logbook', // location:'US-281 San Antonio, TX',
    payment_status: 'pending', payment_amount: 195.00, status: 'assigned_to_attorney',
  });

  // 2. Check if card detail columns exist (migration 026)
  const cardColumnsExist = await hasCardColumns();
  if (cardColumnsExist) {
    console.log('\n  ✓ card_brand/card_last4/receipt_url columns exist');
  } else {
    console.log('\n  ⚠ card_brand/card_last4/receipt_url columns NOT found');
    console.log('    Run migration 026 in Supabase SQL Editor to add them.');
    console.log('    Payments will be inserted without card details for now.\n');
  }

  // 3. Insert payments
  console.log('3. Inserting payments...');

  const payments = [
    // --- Succeeded payments (diverse card brands, amounts, dates) ---
    {
      case_id: cases.c058, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 1),
      stripe_charge_id: fakeStripeId('ch', 1),
      amount: 450.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000058',
      card_brand: 'visa', card_last4: '4242',
      receipt_url: 'https://pay.stripe.com/receipts/seed-001',
      created_at: daysAgo(45), paid_at: daysAgo(45),
    },
    {
      case_id: cases.c122, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 2),
      stripe_charge_id: fakeStripeId('ch', 2),
      amount: 850.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000122',
      card_brand: 'mastercard', card_last4: '8210',
      receipt_url: 'https://pay.stripe.com/receipts/seed-002',
      created_at: daysAgo(30), paid_at: daysAgo(30),
    },
    {
      case_id: cases.c201, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 3),
      stripe_charge_id: fakeStripeId('ch', 3),
      amount: 275.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000201',
      card_brand: 'amex', card_last4: '0005',
      receipt_url: 'https://pay.stripe.com/receipts/seed-003',
      created_at: daysAgo(20), paid_at: daysAgo(20),
    },
    {
      case_id: cases.c058, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 4),
      stripe_charge_id: fakeStripeId('ch', 4),
      amount: 75.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Filing Fee — CASE-2026-000058',
      card_brand: 'visa', card_last4: '4242',
      receipt_url: 'https://pay.stripe.com/receipts/seed-004',
      created_at: daysAgo(44), paid_at: daysAgo(44),
    },
    {
      case_id: cases.c378, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 5),
      stripe_charge_id: fakeStripeId('ch', 5),
      amount: 725.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000378',
      card_brand: 'discover', card_last4: '6789',
      receipt_url: 'https://pay.stripe.com/receipts/seed-005',
      created_at: daysAgo(10), paid_at: daysAgo(10),
    },

    // --- Pending payments ---
    {
      case_id: cases.c189, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 6),
      amount: 325.00, currency: 'USD', status: 'pending',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000189',
      card_brand: 'visa', card_last4: '1234',
      created_at: daysAgo(3),
    },
    {
      case_id: cases.c412, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 7),
      amount: 195.00, currency: 'USD', status: 'pending',
      payment_method: 'card', description: 'Filing Fee — CASE-2026-000412',
      card_brand: 'mastercard', card_last4: '5555',
      created_at: daysAgo(1),
    },

    // --- Failed payment ---
    {
      case_id: cases.c245, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 8),
      amount: 550.00, currency: 'USD', status: 'failed',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000245',
      card_brand: 'visa', card_last4: '0002',
      metadata: { failure_reason: 'card_declined' },
      created_at: daysAgo(7),
    },

    // --- Refunded payment ---
    {
      case_id: cases.c310, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 9),
      stripe_charge_id: fakeStripeId('ch', 9),
      amount: 400.00, currency: 'USD', status: 'refunded',
      payment_method: 'card', description: 'Refund — CASE-2026-000310 (case dismissed)',
      card_brand: 'visa', card_last4: '4242',
      receipt_url: 'https://pay.stripe.com/receipts/seed-009',
      created_at: daysAgo(60), paid_at: daysAgo(60),
    },

    // --- Installment payments (plan) ---
    {
      case_id: cases.c122, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 10),
      stripe_charge_id: fakeStripeId('ch', 10),
      amount: 212.50, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Installment 1/4 — CASE-2026-000122',
      card_brand: 'mastercard', card_last4: '8210',
      receipt_url: 'https://pay.stripe.com/receipts/seed-010',
      created_at: daysAgo(28), paid_at: daysAgo(28),
    },
    {
      case_id: cases.c122, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 11),
      stripe_charge_id: fakeStripeId('ch', 11),
      amount: 212.50, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Installment 2/4 — CASE-2026-000122',
      card_brand: 'mastercard', card_last4: '8210',
      receipt_url: 'https://pay.stripe.com/receipts/seed-011',
      created_at: daysAgo(21), paid_at: daysAgo(21),
    },
    {
      case_id: cases.c122, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 12),
      stripe_charge_id: fakeStripeId('ch', 12),
      amount: 212.50, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Installment 3/4 — CASE-2026-000122',
      card_brand: 'mastercard', card_last4: '8210',
      receipt_url: 'https://pay.stripe.com/receipts/seed-012',
      created_at: daysAgo(14), paid_at: daysAgo(14),
    },
    {
      case_id: cases.c122, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 13),
      amount: 212.50, currency: 'USD', status: 'pending',
      payment_method: 'card', description: 'Installment 4/4 — CASE-2026-000122',
      card_brand: 'mastercard', card_last4: '8210',
      created_at: daysAgo(0),
    },

    // --- Another failed (older) to test retry ---
    {
      case_id: cases.c245, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 14),
      amount: 550.00, currency: 'USD', status: 'failed',
      payment_method: 'card', description: 'Attorney Fee — CASE-2026-000245 (retry)',
      card_brand: 'amex', card_last4: '3782',
      metadata: { failure_reason: 'insufficient_funds' },
      created_at: daysAgo(5),
    },

    // --- One more succeeded to get good stats ---
    {
      case_id: cases.c378, user_id: DRIVER.pubId,
      stripe_payment_intent_id: fakeStripeId('pi', 15),
      stripe_charge_id: fakeStripeId('ch', 15),
      amount: 50.00, currency: 'USD', status: 'succeeded',
      payment_method: 'card', description: 'Court Filing Fee — CASE-2026-000378',
      card_brand: 'discover', card_last4: '6789',
      receipt_url: 'https://pay.stripe.com/receipts/seed-015',
      created_at: daysAgo(9), paid_at: daysAgo(9),
    },
  ];

  // Strip card columns if migration 026 hasn't been applied
  const toInsert = cardColumnsExist ? payments : payments.map(p => {
    const { card_brand, card_last4, receipt_url, ...rest } = p;
    return rest;
  });

  const { data: inserted, error } = await supabase
    .from('payments')
    .insert(toInsert)
    .select('id, amount, status, description');

  if (error) {
    throw new Error(`Failed to insert payments: ${error.message}`);
  }

  console.log(`  ✓ ${inserted.length} payments inserted\n`);

  // 3. Summary
  const succeeded = payments.filter(p => p.status === 'succeeded');
  const pending = payments.filter(p => p.status === 'pending');
  const failed = payments.filter(p => p.status === 'failed');
  const refunded = payments.filter(p => p.status === 'refunded');

  const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0);

  console.log('=== Seed Complete ===');
  console.log(`Total payments:  ${payments.length}`);
  console.log(`  Succeeded:     ${succeeded.length}  ($${sum(succeeded).toFixed(2)})`);
  console.log(`  Pending:       ${pending.length}  ($${sum(pending).toFixed(2)})`);
  console.log(`  Failed:        ${failed.length}  ($${sum(failed).toFixed(2)})`);
  console.log(`  Refunded:      ${refunded.length}  ($${sum(refunded).toFixed(2)})`);
  console.log(`\nTotal amount:    $${sum(payments).toFixed(2)}`);
  console.log('\nCard brands used: visa, mastercard, amex, discover');
  console.log('Log in as driver@test.com / Test1234! to see the payments page.');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
