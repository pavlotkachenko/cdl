#!/usr/bin/env node
// ============================================
// Seed Script: Messaging Test Data
// Sprint 058 / MSG-4
//
// Creates realistic conversations & messages for the driver@test.com user.
// Idempotent — safe to run multiple times.
//
// Usage:  cd backend && node src/scripts/seed-messages.js
// ============================================

'use strict';

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---- Known IDs ----
const DRIVER = {
  email: 'driver@test.com',
  pubId: '1e687d6f-e496-480d-9ff7-aa06ab181f72',
  authId: 'c3baee5c-a13a-480b-ab5a-347626358bf0',
};

const EXISTING_ATTORNEY = {
  email: 'attorney@test.com',
  pubId: 'b253caea-6d25-4e5f-b9c7-d06d11a27269',
  authId: 'ab52e847-e651-4cd4-afb1-ecfcfc69fb20',
};

const EXISTING_OPERATOR = {
  email: 'operator@test.com',
  pubId: '04798b7d-a9c1-45ff-91a2-558ef8c0196d',
  authId: 'd18093c8-1fd2-411f-90d2-0b8000c62330',
};

// Users to create if they don't exist
const SEED_USERS = [
  { email: 'maria.santos@cdltickets.com', name: 'Maria Santos', role: 'attorney' },
  { email: 'david.park@cdltickets.com',   name: 'David Park',   role: 'attorney' },
  { email: 'robert.chen@cdltickets.com',  name: 'Robert Chen',  role: 'attorney' },
  { email: 'cdl.support@cdltickets.com',  name: 'CDL Support',  role: 'operator' },
];

// ---- Helper: ensure a user exists (auth + public) ----
async function ensureUser(email, fullName, role) {
  // Check if public.users row already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, auth_user_id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.auth_user_id) {
    console.log(`  ✓ ${email} already exists (auth=${existing.auth_user_id})`);
    return { pubId: existing.id, authId: existing.auth_user_id };
  }

  // Create auth user via Admin API
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { full_name: fullName, role }
  });

  if (authErr) {
    // Might already exist in auth — try to list
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const found = (list?.users || []).find(u => u.email === email);
    if (found) {
      // Create or update public.users
      if (existing) {
        await supabase.from('users').update({ auth_user_id: found.id, full_name: fullName, role }).eq('id', existing.id);
        console.log(`  ✓ ${email} linked to auth ${found.id}`);
        return { pubId: existing.id, authId: found.id };
      }
      const { data: newPub } = await supabase.from('users').insert({
        email, full_name: fullName, role, auth_user_id: found.id, email_verified: true
      }).select('id').single();
      console.log(`  ✓ ${email} created (pub=${newPub.id}, auth=${found.id})`);
      return { pubId: newPub.id, authId: found.id };
    }
    throw new Error(`Failed to create auth user ${email}: ${authErr.message}`);
  }

  const authId = authUser.user.id;

  // Create public.users row (or update existing)
  if (existing) {
    await supabase.from('users').update({ auth_user_id: authId, full_name: fullName, role }).eq('id', existing.id);
    console.log(`  ✓ ${email} linked to new auth ${authId}`);
    return { pubId: existing.id, authId };
  }

  const { data: newPub } = await supabase.from('users').insert({
    email, full_name: fullName, role, auth_user_id: authId, email_verified: true
  }).select('id').single();

  console.log(`  ✓ ${email} created (pub=${newPub.id}, auth=${authId})`);
  return { pubId: newPub.id, authId };
}

// ---- Helper: ensure a case exists ----
async function ensureCase(caseNumber, driverPubId, attorneyPubId, status, violationType) {
  const { data: existing } = await supabase
    .from('cases')
    .select('id')
    .eq('case_number', caseNumber)
    .maybeSingle();

  if (existing) {
    // Update attorney assignment if needed
    if (attorneyPubId) {
      await supabase.from('cases').update({
        assigned_attorney_id: attorneyPubId,
        status
      }).eq('id', existing.id);
    }
    console.log(`  ✓ Case ${caseNumber} exists (${existing.id})`);
    return existing.id;
  }

  const { data: newCase, error } = await supabase.from('cases').insert({
    case_number: caseNumber,
    driver_id: driverPubId,
    assigned_attorney_id: attorneyPubId,
    status,
    violation_type: violationType || 'speeding',
    state: 'TX',
    county: 'Travis County',
    customer_name: 'John Driver',
    customer_type: 'one_time_driver',
  }).select('id').single();

  if (error) throw new Error(`Failed to create case ${caseNumber}: ${error.message}`);
  console.log(`  ✓ Case ${caseNumber} created (${newCase.id})`);
  return newCase.id;
}

// ---- Helper: create conversation if not exists ----
async function ensureConversation({ driverAuthId, attorneyAuthId, operatorAuthId, caseId, type, closedAt }) {
  // Build a filter to check for existing
  let query = supabase.from('conversations').select('id').eq('driver_id', driverAuthId);
  if (attorneyAuthId) query = query.eq('attorney_id', attorneyAuthId);
  if (operatorAuthId) query = query.eq('operator_id', operatorAuthId);
  if (caseId) query = query.eq('case_id', caseId);
  query = query.eq('conversation_type', type);

  const { data: existing } = await query.maybeSingle();
  if (existing) {
    console.log(`  ✓ Conversation already exists (${existing.id})`);
    return existing.id;
  }

  const retentionDate = new Date();
  retentionDate.setFullYear(retentionDate.getFullYear() + 7);

  const insertData = {
    driver_id: driverAuthId,
    conversation_type: type,
    retention_until: retentionDate.toISOString(),
    accessed_by: [driverAuthId],
  };
  if (attorneyAuthId) insertData.attorney_id = attorneyAuthId;
  if (operatorAuthId) insertData.operator_id = operatorAuthId;
  if (caseId) insertData.case_id = caseId;
  if (closedAt) insertData.closed_at = closedAt;

  const { data: conv, error } = await supabase.from('conversations').insert(insertData).select('id').single();
  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  console.log(`  ✓ Conversation created (${conv.id})`);
  return conv.id;
}

// ---- Helper: insert messages ----
async function insertMessages(conversationId, messages) {
  // Check if messages already exist for this conversation
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (count > 0) {
    console.log(`  ✓ ${count} messages already exist, skipping`);
    return;
  }

  const rows = messages.map((m, i) => ({
    conversation_id: conversationId,
    sender_id: m.senderAuthId,
    recipient_id: m.recipientAuthId,
    content: m.content,
    message_type: m.type || 'text',
    is_read: m.unread ? false : true,
    read_at: m.unread ? null : new Date(Date.now() - (messages.length - i) * 3600000).toISOString(),
    priority: 'normal',
    encrypted: true,
    created_at: m.createdAt || new Date(Date.now() - (messages.length - i) * 3600000).toISOString(),
  }));

  const { error } = await supabase.from('messages').insert(rows);
  if (error) throw new Error(`Failed to insert messages: ${error.message}`);

  // Update conversation last_message with the last message content
  const lastMsg = messages[messages.length - 1];
  const preview = lastMsg.content.length > 100 ? lastMsg.content.substring(0, 100) + '...' : lastMsg.content;
  const unreadCount = messages.filter(m => m.unread).length;

  await supabase.from('conversations').update({
    last_message: preview,
    last_message_at: rows[rows.length - 1].created_at,
    unread_count: unreadCount,
  }).eq('id', conversationId);

  console.log(`  ✓ ${rows.length} messages inserted (${unreadCount} unread)`);
}

// ---- Main ----
async function main() {
  console.log('=== Seed Messages Script ===\n');

  // 1. Ensure all users exist
  console.log('1. Ensuring users...');
  const users = {};

  // Update existing attorney name to "James Wilson" for display purposes
  await supabase.from('users').update({ full_name: 'James Wilson' }).eq('id', EXISTING_ATTORNEY.pubId);
  users.jamesWilson = { pubId: EXISTING_ATTORNEY.pubId, authId: EXISTING_ATTORNEY.authId };
  console.log(`  ✓ attorney@test.com → James Wilson`);

  // Update existing operator name
  await supabase.from('users').update({ full_name: 'Case Coordinator' }).eq('id', EXISTING_OPERATOR.pubId);
  users.coordinator = { pubId: EXISTING_OPERATOR.pubId, authId: EXISTING_OPERATOR.authId };
  console.log(`  ✓ operator@test.com → Case Coordinator`);

  for (const su of SEED_USERS) {
    const key = su.name.replace(/\s+/g, '').toLowerCase();
    users[key] = await ensureUser(su.email, su.name, su.role);
  }

  console.log('\n2. Ensuring cases...');
  const cases = {};
  cases.c847 = await ensureCase('CASE-2026-000847', DRIVER.pubId, users.jamesWilson.pubId, 'assigned_to_attorney', 'speeding');
  cases.c622 = await ensureCase('CASE-2026-000622', DRIVER.pubId, users.mariasantos.pubId, 'assigned_to_attorney', 'other');
  cases.c715 = await ensureCase('CASE-2026-000715', DRIVER.pubId, users.davidpark.pubId, 'assigned_to_attorney', 'speeding');
  cases.c503 = await ensureCase('CASE-2026-000503', DRIVER.pubId, users.robertchen.pubId, 'closed', 'other');

  console.log('\n3. Creating conversations...');

  // Helper dates
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
  const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

  // Conv 1: James Wilson (attorney_case) — 8 messages, 2 unread
  const conv1 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    attorneyAuthId: users.jamesWilson.authId,
    caseId: cases.c847,
    type: 'attorney_case',
  });

  // Conv 2: Maria Santos (attorney_case) — 4 messages, 1 unread
  const conv2 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    attorneyAuthId: users.mariasantos.authId,
    caseId: cases.c622,
    type: 'attorney_case',
  });

  // Conv 3: David Park (attorney_case) — 3 messages, 0 unread
  const conv3 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    attorneyAuthId: users.davidpark.authId,
    caseId: cases.c715,
    type: 'attorney_case',
  });

  // Conv 4: Case Coordinator (operator) — 3 messages, 1 unread
  const conv4 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    operatorAuthId: users.coordinator.authId,
    type: 'operator',
  });

  // Conv 5: CDL Support (support) — 2 messages, 0 unread
  const conv5 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    operatorAuthId: users.cdlsupport.authId,
    type: 'support',
  });

  // Conv 6: Robert Chen (attorney_case, closed) — 3 messages, 0 unread
  const conv6 = await ensureConversation({
    driverAuthId: DRIVER.authId,
    attorneyAuthId: users.robertchen.authId,
    caseId: cases.c503,
    type: 'attorney_case',
    closedAt: daysAgo(14),
  });

  console.log('\n4. Inserting messages...');

  const JW = users.jamesWilson.authId;
  const MS = users.mariasantos.authId;
  const DP = users.davidpark.authId;
  const RC = users.robertchen.authId;
  const CC = users.coordinator.authId;
  const SP = users.cdlsupport.authId;
  const DR = DRIVER.authId;

  // Conv 1: James Wilson — 8 messages
  console.log('  Conv 1 (James Wilson):');
  await insertMessages(conv1, [
    { senderAuthId: JW, recipientAuthId: DR, content: 'Hello! I\'ve reviewed your ticket. The citation shows 78mph in a 65mph zone on I-35. I\'ve handled many similar cases in Travis County.', createdAt: daysAgo(5) },
    { senderAuthId: JW, recipientAuthId: DR, content: 'My initial strategy is to challenge the radar gun calibration records. Officers are required to calibrate before each shift — many don\'t.', createdAt: daysAgo(5) },
    { senderAuthId: DR, recipientAuthId: JW, content: 'It was on I-35 North, around mile marker 42. The officer had a handheld radar gun, not a dash-mounted one.', createdAt: daysAgo(4) },
    { senderAuthId: DR, recipientAuthId: JW, content: 'Also I had my dashcam running. Do you need the footage?', createdAt: daysAgo(4) },
    { senderAuthId: JW, recipientAuthId: DR, content: 'Yes, dashcam footage is excellent evidence — please upload it via the file attachment button. I\'ll review it alongside the officer\'s report.', createdAt: daysAgo(3) },
    { senderAuthId: DR, recipientAuthId: JW, content: 'Just uploaded the dashcam clip from that day. You can see the traffic flow was about the same speed.', createdAt: daysAgo(2) },
    { senderAuthId: JW, recipientAuthId: DR, content: 'I\'ve completed the initial case review. Here\'s a summary of our defense strategy: we\'ll challenge calibration records and use the dashcam evidence showing traffic flow speed.', createdAt: hoursAgo(3), unread: true },
    { senderAuthId: JW, recipientAuthId: DR, content: 'I\'m reviewing your driving log — can you also send the ELD data export for March 10-12? It will help establish the route context.', createdAt: hoursAgo(1), unread: true },
  ]);

  // Conv 2: Maria Santos — 4 messages
  console.log('  Conv 2 (Maria Santos):');
  await insertMessages(conv2, [
    { senderAuthId: MS, recipientAuthId: DR, content: 'Hello! I\'ll be handling your case for the overweight violation on I-10. These are common at the Texas checkpoint.', createdAt: daysAgo(3) },
    { senderAuthId: DR, recipientAuthId: MS, content: 'Hi Maria, the scale was at the Texas checkpoint on I-10 westbound. My manifest showed I was within limits.', createdAt: daysAgo(3) },
    { senderAuthId: MS, recipientAuthId: DR, content: 'Good — we can challenge the scale calibration. I\'ve seen several cases at that checkpoint where the scales were off.', createdAt: daysAgo(2) },
    { senderAuthId: MS, recipientAuthId: DR, content: 'Court date confirmed: March 20, 2026 at 9:00 AM. Travis County Municipal Court. Make sure you arrive 30 minutes early and bring your manifest.', createdAt: hoursAgo(5), unread: true },
  ]);

  // Conv 3: David Park — 3 messages, all read
  console.log('  Conv 3 (David Park):');
  await insertMessages(conv3, [
    { senderAuthId: DP, recipientAuthId: DR, content: 'Good news — the judge agreed to reduce the charge to a non-moving violation. This means no points on your CDL.', createdAt: daysAgo(2) },
    { senderAuthId: DR, recipientAuthId: DP, content: 'That\'s great! What do I need to do next? Any paperwork?', createdAt: daysAgo(1) },
    { senderAuthId: DR, recipientAuthId: DP, content: 'Thanks for the update. I\'ll prepare the documents you mentioned.', createdAt: daysAgo(1) },
  ]);

  // Conv 4: Case Coordinator — 3 messages, 1 unread
  console.log('  Conv 4 (Case Coordinator):');
  await insertMessages(conv4, [
    { senderAuthId: CC, recipientAuthId: DR, content: 'Welcome! I\'m your case coordinator. I\'ll help you through the entire process from ticket to resolution.', createdAt: daysAgo(6) },
    { senderAuthId: CC, recipientAuthId: DR, content: 'Your payment plan has been set up. First installment of $75 is due March 25. You can pay directly from your dashboard.', createdAt: daysAgo(1), unread: true },
    { senderAuthId: DR, recipientAuthId: CC, content: 'Thanks, I\'ll make the payment before the 25th.', createdAt: hoursAgo(12) },
  ]);

  // Conv 5: CDL Support — 2 messages, all read
  console.log('  Conv 5 (CDL Support):');
  await insertMessages(conv5, [
    { senderAuthId: SP, recipientAuthId: DR, content: 'Welcome to CDL Advisor! We\'re here to help you manage your CDL tickets efficiently. Feel free to reach out anytime.', createdAt: daysAgo(10) },
    { senderAuthId: SP, recipientAuthId: DR, content: 'Quick tip: You can submit a ticket photo and our OCR system will auto-fill the citation details. Try it from your dashboard!', createdAt: daysAgo(10) },
  ]);

  // Conv 6: Robert Chen (closed) — 3 messages, all read
  console.log('  Conv 6 (Robert Chen — closed):');
  await insertMessages(conv6, [
    { senderAuthId: RC, recipientAuthId: DR, content: 'Case dismissed! The calibration records showed the radar device was 45 days overdue for service. The judge agreed this invalidates the reading.', createdAt: daysAgo(20) },
    { senderAuthId: DR, recipientAuthId: RC, content: 'Thank you so much for your help! This is a huge relief.', createdAt: daysAgo(19) },
    { senderAuthId: RC, recipientAuthId: DR, content: 'You\'re welcome. Case #0503 is now closed. Drive safe out there!', createdAt: daysAgo(19) },
  ]);

  console.log('\n=== Seed complete! ===');
  console.log('Created 6 conversations with 23 messages (4 unread)');
  console.log('Log in as driver@test.com / Test1234! to see them.');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
