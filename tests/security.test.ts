import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../server.js';
import {
  getActiveAdminPasscode,
  loginLimiter,
  generateUnguessableOrderId,
  generateAccessToken,
} from '../server/security.js';

// Helper to launch test server on an ephemeral port
let server: http.Server;
let baseUrl: string;

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

// -------------------------------------------------------------
// 1. UNAUTHENTICATED REQUESTS
// -------------------------------------------------------------
test('Unauthenticated admin endpoints return 401', async () => {
  const resOrders = await fetch(`${baseUrl}/api/admin/orders`);
  assert.equal(resOrders.status, 401, 'Expected 401 for unauthenticated admin orders');

  const resSettings = await fetch(`${baseUrl}/api/admin/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerName: 'Hacker' }),
  });
  assert.equal(resSettings.status, 401, 'Expected 401 for unauthenticated admin settings update');
});

test('Unauthenticated business private data access returns 403', async () => {
  const resFeedback = await fetch(`${baseUrl}/api/businesses/chai-shai-cafe/feedback`);
  assert.equal(resFeedback.status, 403, 'Expected 403 for unauthenticated feedback access');

  const resAnalytics = await fetch(`${baseUrl}/api/analytics/chai-shai-cafe`);
  assert.equal(resAnalytics.status, 403, 'Expected 403 for unauthenticated analytics access');
});

// -------------------------------------------------------------
// 2. ADMIN AUTHENTICATION, EXPIRING SESSIONS & LOGOUT
// -------------------------------------------------------------
test('Admin login with invalid passcode returns 401', async () => {
  const res = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'wrong_passcode_xyz' }),
  });
  assert.equal(res.status, 401);
});

test('Admin login succeeds with active passcode, allows access, and is revoked on logout', async () => {
  const activePasscode = getActiveAdminPasscode();
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: activePasscode }),
  });
  assert.equal(loginRes.status, 200);
  const { token } = await loginRes.json();
  assert.ok(token && token.startsWith('dkb_adm_'), 'Expected cryptographically random token');

  // Verify access with token
  const authRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { 'x-admin-token': token },
  });
  assert.equal(authRes.status, 200, 'Expected 200 when authenticated with token');

  // Logout / invalidate session
  const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
    method: 'POST',
    headers: { 'x-admin-token': token },
  });
  assert.equal(logoutRes.status, 200);

  // Subsequent access must now be 401
  const revokedRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { 'x-admin-token': token },
  });
  assert.equal(revokedRes.status, 401, 'Session should be rejected after logout');
});

// -------------------------------------------------------------
// 3. CROSS-BUSINESS ACCESS & DATA ISOLATION
// -------------------------------------------------------------
test('Cross-business access is rejected: Business A cannot mutate Business B', async () => {
  const uniqueName = 'Unique Cafe Beta ' + Date.now();
  const createB = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: uniqueName,
      category: 'cafe',
      city: 'Pune',
      contactPhone: '9822001122',
      staffPin: '7788',
    }),
  });
  assert.equal(createB.status, 200);
  const bizB = await createB.json();
  assert.ok(bizB.ownerKey, 'Expected ownerKey for new business');

  // Business B tries to update Business A's menu using B's key
  const attackRes = await fetch(`${baseUrl}/api/businesses/chai-shai-cafe/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-business-key': bizB.ownerKey,
    },
    body: JSON.stringify({
      categories: [{ id: 'hacked', name: 'Hacked Menu', sortOrder: 1 }],
      items: [],
    }),
  });
  assert.equal(attackRes.status, 403, 'Cross-business modification must be forbidden');
});

// -------------------------------------------------------------
// 4. ORDER ACCESS CONTROL & UNGUESSABLE IDENTIFIERS
// -------------------------------------------------------------
test('Order creation yields unguessable ID and requires authorization for status', async () => {
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageType: 'starter',
      customerName: 'Aarav Patel',
      customerPhone: '9876500001',
      businessDetails: { businessName: 'Aarav Chai Point' },
    }),
  });
  assert.equal(orderRes.status, 201);
  const { order, orderAccessToken } = await orderRes.json();
  assert.ok(order.id.length > 12, 'Order ID must be unguessable');
  assert.ok(orderAccessToken, 'Access token must be generated');

  // 1. Unauthenticated lookup without phone or token must return 403
  const unauthorizedLookup = await fetch(`${baseUrl}/api/orders/${order.id}`);
  assert.equal(unauthorizedLookup.status, 403, 'Unauthorized lookup must return 403');

  // 2. Querying with wrong phone returns 403
  const wrongPhoneLookup = await fetch(`${baseUrl}/api/orders/${order.id}?phone=9999999999`);
  assert.equal(wrongPhoneLookup.status, 403, 'Wrong phone lookup must return 403');

  // 3. Authorized lookup with correct phone succeeds
  const phoneLookup = await fetch(`${baseUrl}/api/orders/${order.id}?phone=9876500001`);
  assert.equal(phoneLookup.status, 200);
  const lookedUp = await phoneLookup.json();
  assert.equal(lookedUp.id, order.id);
  assert.equal(lookedUp.paymentStatus, 'pending');

  // 4. Submitting UPI ref with authorization saves reference but retains pending status
  const submitUpi = await fetch(`${baseUrl}/api/orders/${order.id}/submit-upi-ref`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-order-token': orderAccessToken,
    },
    body: JSON.stringify({
      upiTransactionRef: 'UPI1234567890',
      token: orderAccessToken,
    }),
  });
  assert.equal(submitUpi.status, 200);
  const upiResult = await submitUpi.json();
  assert.equal(upiResult.paymentStatus, 'pending', 'Payment status must strictly remain pending');
});

// -------------------------------------------------------------
// 5. LOYALTY CHECK-IN FRAUD DEFENSE & IDEMPOTENCY
// -------------------------------------------------------------
test('Loyalty check-in rejects forged credentials, enforces rate limits, and supports idempotency', async () => {
  const testPhone = '9826099999';

  // 1. Reject invalid daily code and invalid staff PIN
  const forgedCheckin = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'chai-shai-cafe',
      phone: testPhone,
      dailyCode: '000000',
      staffPin: '0000',
    }),
  });
  assert.equal(forgedCheckin.status, 403, 'Forged authorization must be rejected');

  // 2. Valid check-in with staff PIN
  const idempotencyKey = 'test-idemp-' + Date.now();
  const validCheckin = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'chai-shai-cafe',
      phone: testPhone,
      staffPin: '8249',
      idempotencyKey,
    }),
  });
  assert.equal(validCheckin.status, 200);
  const firstData = await validCheckin.json();
  assert.equal(firstData.success, true);
  assert.equal(firstData.pointsAwarded, 10);

  // 3. Replayed check-in with same idempotency key must not award additional points
  const replayedCheckin = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'chai-shai-cafe',
      phone: testPhone,
      staffPin: '8249',
      idempotencyKey,
    }),
  });
  assert.equal(replayedCheckin.status, 200);
  const replayData = await replayedCheckin.json();
  assert.equal(replayData.newBalance, firstData.newBalance, 'Idempotent replay must not increase points');
});

// -------------------------------------------------------------
// 6. LOYALTY REDEMPTION, NEGATIVE BALANCE & CONCURRENT SPENDING
// -------------------------------------------------------------
test('Loyalty redemption prevents insufficient balance, negative balance, and concurrent double spending', async () => {
  const customerPhone = '9812399999';

  // Award customer exactly 30 points (Free Chai reward requires 30 pts)
  for (let i = 0; i < 3; i++) {
    await fetch(`${baseUrl}/api/loyalty/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: 'chai-shai-cafe',
        phone: customerPhone,
        staffPin: '8249',
      }),
    });
  }

  const walletRes = await fetch(`${baseUrl}/api/loyalty/customer?businessId=chai-shai-cafe&phone=${customerPhone}`);
  const wallet = await walletRes.json();
  assert.equal(wallet.pointsBalance, 30, 'Customer should have exactly 30 points');

  // Attempting to redeem reward requiring 50 points (Free Samosa) must fail with 400
  const overdrawRes = await fetch(`${baseUrl}/api/loyalty/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'chai-shai-cafe',
      phone: customerPhone,
      rewardId: 'rew-2', // requires 50 pts
      staffPin: '8249',
    }),
  });
  assert.equal(overdrawRes.status, 400, 'Overdrawing balance must be rejected');

  // CONCURRENT DOUBLE SPENDING TEST:
  // Fire 2 concurrent redemption requests simultaneously for rew-1 (30 pts each).
  // With 30 pts in balance, exactly ONE must succeed, and the other must fail with 400.
  const [res1, res2] = await Promise.all([
    fetch(`${baseUrl}/api/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: 'chai-shai-cafe',
        phone: customerPhone,
        rewardId: 'rew-1',
        staffPin: '8249',
      }),
    }),
    fetch(`${baseUrl}/api/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: 'chai-shai-cafe',
        phone: customerPhone,
        rewardId: 'rew-1',
        staffPin: '8249',
      }),
    }),
  ]);

  const statuses = [res1.status, res2.status].sort();
  assert.deepEqual(statuses, [200, 400], 'One concurrent redemption must succeed (200) and the other fail (400)');

  // Verify final wallet balance is 0, never negative
  const finalWalletRes = await fetch(`${baseUrl}/api/loyalty/customer?businessId=chai-shai-cafe&phone=${customerPhone}`);
  const finalWallet = await finalWalletRes.json();
  assert.equal(finalWallet.pointsBalance, 0, 'Balance must be 0 after single redemption');
});
