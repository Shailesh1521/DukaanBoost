import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { app, writeAtomicJsonSync, resetTestStateForTesting } from '../server.js';
import {
  validateEnvironmentConfig,
  getActiveAdminPasscode,
  getActiveAdminSessionSecret,
  hashSessionToken,
  loginLimiter,
  redemptionLimiter,
  pinFailureLimiter,
  getClientIp,
  generateUnguessableOrderId,
  generateAccessToken,
  generateBusinessOwnerKey,
  generateStaffPin,
  generateWalletToken,
  isValidIndianPhone,
} from '../server/security.js';
import { db } from '../server/db.js';

let server: http.Server;
let baseUrl: string;

test.before(async () => {
  resetTestStateForTesting();
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
// 1. ENVIRONMENT CONFIGURATION & PRODUCTION SECRETS
// -------------------------------------------------------------
test('Production startup without required secrets fails safely', () => {
  // Missing ADMIN_PASSCODE in production
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_SESSION_SECRET: 'a_very_long_valid_secret_123' }),
    /ADMIN_PASSCODE environment variable is required in production/
  );

  // Short ADMIN_PASSCODE in production (< 8 chars)
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_PASSCODE: 'short', ADMIN_SESSION_SECRET: 'a_very_long_valid_secret_123' }),
    /ADMIN_PASSCODE must be at least 8 characters in production/
  );

  // Missing ADMIN_SESSION_SECRET in production
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_PASSCODE: 'valid_long_passcode_123' }),
    /ADMIN_SESSION_SECRET environment variable is required in production/
  );

  // Short ADMIN_SESSION_SECRET in production (< 16 chars)
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_PASSCODE: 'valid_long_passcode_123', ADMIN_SESSION_SECRET: 'short' }),
    /ADMIN_SESSION_SECRET must be at least 16 characters in production/
  );

  // Valid production environment succeeds
  const valid = validateEnvironmentConfig({
    NODE_ENV: 'production',
    ADMIN_PASSCODE: 'super_secure_production_passcode_123',
    ADMIN_SESSION_SECRET: 'super_secure_admin_session_secret_456',
  });
  assert.equal(valid.isProduction, true);
  assert.equal(valid.adminPasscode, 'super_secure_production_passcode_123');
  assert.equal(valid.adminSessionSecret, 'super_secure_admin_session_secret_456');
});

// -------------------------------------------------------------
// 2. TIMING-SAFE SESSIONS & HASHED SERVER-SIDE STORAGE
// -------------------------------------------------------------
test('Admin login succeeds, uses hashed server-side storage, and is revoked on logout', async () => {
  const activePasscode = getActiveAdminPasscode();

  // Invalid login attempt
  const badLogin = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: 'invalid_wrong_passcode' }),
  });
  assert.equal(badLogin.status, 401);

  // Successful login
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode: activePasscode }),
  });
  assert.equal(loginRes.status, 200);
  const { token } = await loginRes.json();
  assert.ok(token && token.startsWith('dkb_adm_'));

  // Verify HMAC hash computation
  const sessionHash = hashSessionToken(token);
  assert.ok(sessionHash && sessionHash.length === 64, 'Session token must hash to 64-char hex string');

  // Authenticated access with valid session token
  const authRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { 'x-admin-token': token },
  });
  assert.equal(authRes.status, 200);

  // Logout / invalidate session
  const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
    method: 'POST',
    headers: { 'x-admin-token': token },
  });
  assert.equal(logoutRes.status, 200);

  // Subsequent access must now be rejected
  const revokedRes = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { 'x-admin-token': token },
  });
  assert.equal(revokedRes.status, 401, 'Session should be rejected after revocation');
});

// -------------------------------------------------------------
// 3. BUSINESS CREATION: IGNORE CALLER KEYS & SLUG COLLISION DEFENSE
// -------------------------------------------------------------
test('Business creation ignores caller-supplied ownerKey and staffPin and prevents slug collisions', async () => {
  const customSuppliedKey = 'malicious_caller_owner_key_666';
  const customSuppliedPin = '0000';

  // 1. Create a business with caller attempting to supply keys
  const createRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Apex Chai Hub ' + Date.now(),
      category: 'cafe',
      city: 'Pune',
      contactPhone: '9820011223',
      ownerKey: customSuppliedKey,
      staffPin: customSuppliedPin,
    }),
  });
  assert.equal(createRes.status, 201);
  const bizData = await createRes.json();

  // Server MUST ignore caller-supplied keys and generate secure ones
  assert.notEqual(bizData.ownerKey, customSuppliedKey, 'Server must ignore caller-supplied ownerKey');
  assert.notEqual(bizData.staffPin, customSuppliedPin, 'Server must ignore caller-supplied staffPin');
  assert.ok(bizData.ownerKey.startsWith('biz_key_'), 'Server must generate cryptographically random ownerKey');
  assert.ok(bizData.staffPin.length === 4, 'Server must generate 4-digit staff PIN');

  // 2. Public collision attack: unauthenticated caller tries to overwrite existing business by ID
  const overwriteAttack = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: bizData.id,
      businessName: 'Hijacked Business',
      category: 'cafe',
      city: 'Mumbai',
    }),
  });
  assert.equal(overwriteAttack.status, 409, 'Public request attempting to claim existing ID must return 409 Conflict');

  // 3. Name collision auto-resolution: creating another business with same name must not collide
  const secondRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: bizData.businessName,
      category: 'cafe',
      city: 'Pune',
      contactPhone: '9820011223',
    }),
  });
  assert.equal(secondRes.status, 201);
  const secondBiz = await secondRes.json();
  assert.notEqual(secondBiz.id, bizData.id, 'Duplicate name must auto-resolve with unique suffix to prevent collision');
});

// -------------------------------------------------------------
// 4. CROSS-BUSINESS ACCESS & TENANT ISOLATION
// -------------------------------------------------------------
test('Cross-business access is rejected across all sensitive operations', async () => {
  // Setup Business Alpha
  const alphaRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Alpha Cafe ' + Date.now(),
      category: 'cafe',
      city: 'Mumbai',
      contactPhone: '9820011223',
    }),
  });
  assert.equal(alphaRes.status, 201);
  const bizA = await alphaRes.json();

  // Setup Business Beta
  const betaRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Beta Cafe ' + Date.now(),
      category: 'cafe',
      city: 'Delhi',
      contactPhone: '9810011223',
    }),
  });
  assert.equal(betaRes.status, 201);
  const bizB = await betaRes.json();

  // Attack 1: Business A tries to modify Business B's menu
  const menuAttack = await fetch(`${baseUrl}/api/businesses/${bizB.id}/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-business-key': bizA.ownerKey,
    },
    body: JSON.stringify({
      categories: [{ id: 'malicious', name: 'Tampered Menu', sortOrder: 1 }],
      items: [],
    }),
  });
  assert.equal(menuAttack.status, 403, 'Cross-business menu modification must be forbidden');

  // Attack 2: Business A tries to read Business B's customer feedback
  const feedbackAttack = await fetch(`${baseUrl}/api/businesses/${bizB.id}/feedback`, {
    headers: { 'x-business-key': bizA.ownerKey },
  });
  assert.equal(feedbackAttack.status, 403, 'Cross-business feedback access must be forbidden');

  // Attack 3: Business A tries to rotate Business B's credentials
  const rotateAttack = await fetch(`${baseUrl}/api/businesses/${bizB.id}/rotate-credentials`, {
    method: 'POST',
    headers: { 'x-business-key': bizA.ownerKey },
  });
  assert.equal(rotateAttack.status, 403, 'Cross-business credential rotation must be forbidden');
});

// -------------------------------------------------------------
// 5. URL CREDENTIAL LEAKAGE REJECTION
// -------------------------------------------------------------
test('Staff PINs, wallet tokens, and order tokens in URL query parameters are rejected', async () => {
  // 1. Order lookup with token in URL query parameter must be rejected with 400
  const urlOrderLookup = await fetch(`${baseUrl}/api/orders/DKB-2026-TEST?token=secret_token_123`);
  assert.equal(urlOrderLookup.status, 400, 'Order token in query param must be rejected with 400');
  const urlOrderErr = await urlOrderLookup.json();
  assert.ok(urlOrderErr.error.includes('Security violation'));

  // 2. Loyalty customer lookup with token in query param must be rejected with 400
  const urlLoyaltyLookup = await fetch(`${baseUrl}/api/loyalty/customer?businessId=chai-shai-cafe&phone=9826012345&token=cwt_12345`);
  assert.equal(urlLoyaltyLookup.status, 400, 'Wallet token in query param must be rejected with 400');

  // 3. Loyalty customer lookup with staffPin in query param must be rejected with 400
  const urlPinLookup = await fetch(`${baseUrl}/api/loyalty/customer?businessId=chai-shai-cafe&phone=9826012345&staffPin=1234`);
  assert.equal(urlPinLookup.status, 400, 'Staff PIN in query param must be rejected with 400');
});

// -------------------------------------------------------------
// 6. ORDER ACCESS: REJECT PHONE-ONLY & REQUIRE TOKEN IN HEADERS
// -------------------------------------------------------------
test('Order retrieval and UPI submission reject phone-only access and require access token in headers', async () => {
  // Create order
  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      packageType: 'starter',
      customerName: 'Kavita Sharma',
      customerPhone: '9826012345',
      businessDetails: { businessName: 'Kavita Sweets' },
    }),
  });
  assert.equal(orderRes.status, 201);
  const { order, orderAccessToken } = await orderRes.json();
  assert.ok(order.id.startsWith('DKB-'), 'Order ID must have unguessable format');
  assert.ok(orderAccessToken && orderAccessToken.length >= 32, 'Access token must have high entropy');

  // 1. Phone-only lookup MUST be rejected with 403 Forbidden
  const phoneOnlyLookup = await fetch(`${baseUrl}/api/orders/${order.id}?phone=9826012345`);
  assert.equal(phoneOnlyLookup.status, 403, 'Phone-only lookup must be rejected');

  // 2. Unauthenticated lookup with no token MUST be rejected with 403
  const noTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}`);
  assert.equal(noTokenLookup.status, 403);

  // 3. Forged/invalid token in header MUST be rejected with 403
  const badTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}`, {
    headers: { 'x-order-token': 'invalid_forged_token_xyz' },
  });
  assert.equal(badTokenLookup.status, 403);

  // 4. Valid token in HTTP header succeeds with masked customer details
  const validTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}`, {
    headers: { 'x-order-token': orderAccessToken },
  });
  assert.equal(validTokenLookup.status, 200);
  const validDetails = await validTokenLookup.json();
  assert.equal(validDetails.id, order.id);
  assert.equal(validDetails.customerName, 'Kavita Sharma');
  assert.equal(validDetails.customerPhoneMasked, '98******45');

  // 5. Minimal public tracking status returns ONLY non-sensitive progress info
  const publicTracking = await fetch(`${baseUrl}/api/orders/${order.id}?public=true`);
  assert.equal(publicTracking.status, 200);
  const publicData = await publicTracking.json();
  assert.equal(publicData.id, order.id);
  assert.equal(publicData.paymentStatus, 'pending');
  assert.equal(publicData.customerName, undefined, 'Public tracking must not leak customer name');
  assert.equal(publicData.customerPhoneMasked, undefined, 'Public tracking must not leak customer phone');

  // 6. UPI reference submission without valid token MUST be rejected
  const fakeUpiSubmit = await fetch(`${baseUrl}/api/orders/${order.id}/submit-upi-ref`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upiTransactionRef: 'UPI_TEST_999888',
      phone: '9826012345',
    }),
  });
  assert.equal(fakeUpiSubmit.status, 403, 'UPI reference submission must require order access token');

  // 7. UPI reference submission with valid token header succeeds
  const validUpiSubmit = await fetch(`${baseUrl}/api/orders/${order.id}/submit-upi-ref`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-order-token': orderAccessToken,
    },
    body: JSON.stringify({
      upiTransactionRef: 'UPI_VALID_12345678',
    }),
  });
  assert.equal(validUpiSubmit.status, 200);
  const upiResult = await validUpiSubmit.json();
  assert.equal(upiResult.paymentStatus, 'pending');
});

// -------------------------------------------------------------
// 7. MANDATORY IDEMPOTENCY & REPLAY PROTECTION
// -------------------------------------------------------------
test('Check-in and redemption require idempotencyKey, and concurrent duplicate requests are deduplicated', async () => {
  const bizRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Idempotency Cafe ' + Date.now(),
      category: 'cafe',
      city: 'Delhi',
      contactPhone: '9810099887',
    }),
  });
  const biz = await bizRes.json();
  const testPhone = '9810011111';

  // 1. Check-in without idempotency key MUST be rejected with 400
  const missingKeyRes = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: biz.id,
      phone: testPhone,
      staffPin: biz.staffPin,
    }),
  });
  assert.equal(missingKeyRes.status, 400, 'Check-in without idempotency key must return 400');

  // 2. Concurrent check-ins with identical idempotencyKey
  const fixedIdemKey = 'idem_chk_test_' + Date.now();
  const [chk1, chk2] = await Promise.all([
    fetch(`${baseUrl}/api/loyalty/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': fixedIdemKey,
      },
      body: JSON.stringify({
        businessId: biz.id,
        phone: testPhone,
        staffPin: biz.staffPin,
        idempotencyKey: fixedIdemKey,
      }),
    }),
    fetch(`${baseUrl}/api/loyalty/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': fixedIdemKey,
      },
      body: JSON.stringify({
        businessId: biz.id,
        phone: testPhone,
        staffPin: biz.staffPin,
        idempotencyKey: fixedIdemKey,
      }),
    }),
  ]);

  assert.equal(chk1.status, 200);
  assert.equal(chk2.status, 200);
  const data1 = await chk1.json();
  const data2 = await chk2.json();

  // Points balance must be exactly 10, NOT 20 (no double-crediting)
  assert.equal(data1.newBalance, 10);
  assert.equal(data2.newBalance, 10);
  assert.equal(data2.totalVisits, 1, 'Total visits must not be incremented twice on replayed request');

  // 3. Subsequent replay of same key returns cached result
  const replayRes = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': fixedIdemKey,
    },
    body: JSON.stringify({
      businessId: biz.id,
      phone: testPhone,
      staffPin: biz.staffPin,
      idempotencyKey: fixedIdemKey,
    }),
  });
  assert.equal(replayRes.status, 200);
  const replayData = await replayRes.json();
  assert.equal(replayData.newBalance, 10);
});

// -------------------------------------------------------------
// 8. BRUTE FORCE PIN GUESSING & RATE LIMITING LOCKOUT
// -------------------------------------------------------------
test('Brute force staff PIN guessing triggers per-business rate limiting lockout', async () => {
  const bizRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Secure Sweets ' + Date.now(),
      category: 'cafe',
      city: 'Jaipur',
      contactPhone: '9829011223',
    }),
  });
  const biz = await bizRes.json();
  const victimPhone = '9829033333';

  // Attempt 5 incorrect PIN guesses
  for (let i = 0; i < 5; i++) {
    const badGuessRes = await fetch(`${baseUrl}/api/loyalty/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `guess_${Date.now()}_${i}`,
      },
      body: JSON.stringify({
        businessId: biz.id,
        phone: victimPhone,
        staffPin: '9999', // wrong pin
        idempotencyKey: `guess_${Date.now()}_${i}`,
      }),
    });
    // First 4 return 403, 5th or subsequent triggers 429 lockout
    if (i < 4) {
      assert.equal(badGuessRes.status, 403);
    }
  }

  // 6th attempt must be locked out with 429 Too Many Requests
  const lockedRes = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `guess_locked_${Date.now()}`,
    },
    body: JSON.stringify({
      businessId: biz.id,
      phone: victimPhone,
      staffPin: '9999',
      idempotencyKey: `guess_locked_${Date.now()}`,
    }),
  });
  assert.equal(lockedRes.status, 429, 'Repeated invalid staff PIN attempts must trigger 429 lockout');
  const lockedData = await lockedRes.json();
  assert.ok(lockedData.error.includes('Too many invalid staff credential attempts'));
});

// -------------------------------------------------------------
// 9. TRANSACTIONAL PERSISTENCE & ROLLBACK
// -------------------------------------------------------------
test('Multi-entity SQLite transactions guarantee atomic commit or complete rollback', () => {
  const testBizId = 'txn-test-biz-' + Date.now();

  // Test 1: Successful multi-entity insertion
  db.withTransaction(() => {
    db.upsertBusiness({
      id: testBizId,
      businessName: 'Transaction Test Biz',
      category: 'cafe',
      city: 'Indore',
      contactPhone: '9826012345',
      productsServices: 'Special Chai',
      targetAudience: 'Locals',
      promotionObjective: 'more_sales',
      offerDiscount: '10% off',
      preferredLanguage: 'hinglish',
      visualStyle: 'chai_bites',
      ownerKey: 'biz_key_test_123',
      staffPin: '4321',
    });
    db.upsertLoyaltyConfig({
      businessId: testBizId,
      enabled: true,
      pointsPerVisit: 15,
      minHoursBetweenVisits: 12,
      staffPin: '4321',
      dailyCheckinCode: '998877',
      dailyCodeExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      rewards: [],
    });
  });

  const savedBiz = db.getBusiness(testBizId);
  const savedCfg = db.getLoyaltyConfig(testBizId);
  assert.ok(savedBiz);
  assert.ok(savedCfg);
  assert.equal(savedCfg.pointsPerVisit, 15);

  // Test 2: Multi-entity failure causes complete rollback with zero partial state
  assert.throws(() => {
    db.withTransaction(() => {
      // Step A: modify config
      db.upsertLoyaltyConfig({
        ...savedCfg!,
        pointsPerVisit: 99,
      });
      // Step B: simulate failure
      throw new Error('Simulated mid-transaction system crash');
    });
  }, /Simulated mid-transaction system crash/);

  // Verify pointsPerVisit was NOT left at 99 (rolled back to 15)
  // Because SQLite rollback preserves prior committed state
  // We re-query the config
  const afterRollbackCfg = db.getLoyaltyConfig(testBizId);
  assert.equal(afterRollbackCfg?.pointsPerVisit, 15, 'Failed transaction must roll back partial updates');
});

// -------------------------------------------------------------
// 10. PROXY HEADER SPOOFING & STRICT PHONE VALIDATION
// -------------------------------------------------------------
test('Arbitrary X-Forwarded-For headers are ignored without TRUST_PROXY, and phone validation enforces 10 digits', () => {
  delete process.env.TRUST_PROXY;

  const dummyReq: any = {
    headers: { 'x-forwarded-for': '203.0.113.195' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  assert.equal(getClientIp(dummyReq), '127.0.0.1');

  // Phone validation
  assert.equal(isValidIndianPhone('9826012345'), true);
  assert.equal(isValidIndianPhone('1234567890'), false);
  assert.equal(isValidIndianPhone('0123456789'), false);
  assert.equal(isValidIndianPhone('abcdefghij'), false);
});
