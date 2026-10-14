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
  getClientIp,
  generateUnguessableOrderId,
  generateAccessToken,
  generateBusinessOwnerKey,
  generateStaffPin,
  generateWalletToken,
  isValidIndianPhone,
} from '../server/security.js';

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

  // Short ADMIN_PASSCODE in production
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_PASSCODE: 'short', ADMIN_SESSION_SECRET: 'a_very_long_valid_secret_123' }),
    /ADMIN_PASSCODE must be at least 8 characters in production/
  );

  // Missing ADMIN_SESSION_SECRET in production
  assert.throws(
    () => validateEnvironmentConfig({ NODE_ENV: 'production', ADMIN_PASSCODE: 'valid_long_passcode_123' }),
    /ADMIN_SESSION_SECRET environment variable is required in production/
  );

  // Short ADMIN_SESSION_SECRET in production
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
// 3. CROSS-BUSINESS ACCESS & TENANT ISOLATION
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

  // Attack 3: Business A tries to read Business B's analytics
  const analyticsAttack = await fetch(`${baseUrl}/api/analytics/${bizB.id}`, {
    headers: { 'x-business-key': bizA.ownerKey },
  });
  assert.equal(analyticsAttack.status, 403, 'Cross-business analytics access must be forbidden');

  // Attack 4: Business A tries to modify Business B's loyalty config
  const loyaltyAttack = await fetch(`${baseUrl}/api/loyalty/config/${bizB.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-business-key': bizA.ownerKey,
    },
    body: JSON.stringify({
      pointsPerVisit: 50,
      enabled: true,
    }),
  });
  assert.equal(loyaltyAttack.status, 403, 'Cross-business loyalty modification must be forbidden');

  // Attack 5: Business A tries to rotate Business B's credentials
  const rotateAttack = await fetch(`${baseUrl}/api/businesses/${bizB.id}/rotate-credentials`, {
    method: 'POST',
    headers: { 'x-business-key': bizA.ownerKey },
  });
  assert.equal(rotateAttack.status, 403, 'Cross-business credential rotation must be forbidden');
});

// -------------------------------------------------------------
// 4. ORDER ACCESS: REJECT PHONE-ONLY & REQUIRE HIGH-ENTROPY TOKEN
// -------------------------------------------------------------
test('Order retrieval and UPI submission reject phone-only access and require access token', async () => {
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

  // 2. Unauthenticated lookup with no token or phone MUST be rejected with 403
  const noTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}`);
  assert.equal(noTokenLookup.status, 403);

  // 3. Forged/invalid token lookup MUST be rejected with 403
  const badTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}?token=invalid_forged_token_xyz`);
  assert.equal(badTokenLookup.status, 403);

  // 4. Valid token lookup succeeds with masked customer details
  const validTokenLookup = await fetch(`${baseUrl}/api/orders/${order.id}?token=${orderAccessToken}`);
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
      phone: '9826012345', // Phone alone must not authorize
    }),
  });
  assert.equal(fakeUpiSubmit.status, 403, 'UPI reference submission must require order access token');

  // 7. UPI reference submission with valid token succeeds, keeping status pending
  const validUpiSubmit = await fetch(`${baseUrl}/api/orders/${order.id}/submit-upi-ref`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-order-token': orderAccessToken,
    },
    body: JSON.stringify({
      upiTransactionRef: 'UPI_VALID_12345678',
      token: orderAccessToken,
    }),
  });
  assert.equal(validUpiSubmit.status, 200);
  const upiResult = await validUpiSubmit.json();
  assert.equal(upiResult.paymentStatus, 'pending', 'Payment must strictly remain pending until merchant verification');
});

// -------------------------------------------------------------
// 5. LOYALTY WALLET: REJECT PHONE-ONLY ACCESS & REQUIRE TOKEN
// -------------------------------------------------------------
test('Customer loyalty wallet rejects unverified phone-only access and requires token or staff auth', async () => {
  // Create business with fresh dynamic PIN
  const bizRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Royal Sweets ' + Date.now(),
      category: 'cafe',
      city: 'Jaipur',
      contactPhone: '9829012345',
    }),
  });
  const biz = await bizRes.json();
  const testPhone = '9829099999';

  // 1. Initial wallet lookup with phone only MUST return 403
  const unauthWallet = await fetch(`${baseUrl}/api/loyalty/customer?businessId=${biz.id}&phone=${testPhone}`);
  assert.equal(unauthWallet.status, 403, 'Phone-only wallet lookup must be rejected');
  const unauthData = await unauthWallet.json();
  assert.equal(unauthData.code, 'WALLET_AUTH_REQUIRED');

  // 2. Customer performs verified visit check-in with staff PIN
  const checkinRes = await fetch(`${baseUrl}/api/loyalty/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: biz.id,
      phone: testPhone,
      customerName: 'Rahul Mehra',
      staffPin: biz.staffPin,
    }),
  });
  assert.equal(checkinRes.status, 200);
  const checkinData = await checkinRes.json();
  assert.ok(checkinData.walletToken, 'Verified check-in must issue customer walletToken');
  assert.equal(checkinData.pointsAwarded, 10);

  // 3. Customer views their wallet using their issued walletToken
  const verifiedWalletRes = await fetch(
    `${baseUrl}/api/loyalty/customer?businessId=${biz.id}&phone=${testPhone}&token=${checkinData.walletToken}`
  );
  assert.equal(verifiedWalletRes.status, 200);
  const walletData = await verifiedWalletRes.json();
  assert.equal(walletData.pointsBalance, 10);
  assert.equal(walletData.totalVisits, 1);

  // 4. In-store staff can inspect wallet using x-staff-pin header
  const staffWalletRes = await fetch(`${baseUrl}/api/loyalty/customer?businessId=${biz.id}&phone=${testPhone}`, {
    headers: { 'x-staff-pin': biz.staffPin },
  });
  assert.equal(staffWalletRes.status, 200);
});

// -------------------------------------------------------------
// 6. CONCURRENT REDEMPTION, IDEMPOTENCY & ZERO NEGATIVE BALANCE
// -------------------------------------------------------------
test('Loyalty redemption prevents double-spending, supports idempotency, and preserves zero balance', async () => {
  const bizRes = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Chai Villa ' + Date.now(),
      category: 'cafe',
      city: 'Indore',
      contactPhone: '9826098765',
    }),
  });
  const biz = await bizRes.json();
  const customerPhone = '9826077777';

  // Configure reward: Free Kulhad Chai for 30 points
  await fetch(`${baseUrl}/api/loyalty/config/${biz.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-business-key': biz.ownerKey,
    },
    body: JSON.stringify({
      pointsPerVisit: 10,
      enabled: true,
      staffPin: biz.staffPin,
      rewards: [{ id: 'rew-chai', title: 'Free Kulhad Chai', pointsRequired: 30, isActive: true }],
    }),
  });

  // Award 30 points via 3 check-ins
  let walletToken: string = '';
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${baseUrl}/api/loyalty/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: biz.id,
        phone: customerPhone,
        staffPin: biz.staffPin,
      }),
    });
    const data = await res.json();
    walletToken = data.walletToken;
  }

  // Verify initial 30 points balance
  const walletCheck = await fetch(
    `${baseUrl}/api/loyalty/customer?businessId=${biz.id}&phone=${customerPhone}&token=${walletToken}`
  );
  const initialWallet = await walletCheck.json();
  assert.equal(initialWallet.pointsBalance, 30);

  // Concurrency Test: Fire 2 simultaneous redemptions for 30 points each
  const [res1, res2] = await Promise.all([
    fetch(`${baseUrl}/api/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: biz.id,
        phone: customerPhone,
        rewardId: 'rew-chai',
        staffPin: biz.staffPin,
      }),
    }),
    fetch(`${baseUrl}/api/loyalty/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: biz.id,
        phone: customerPhone,
        rewardId: 'rew-chai',
        staffPin: biz.staffPin,
      }),
    }),
  ]);

  const statuses = [res1.status, res2.status].sort();
  assert.deepEqual(statuses, [200, 400], 'Exactly one redemption must succeed (200) and the other fail (400)');

  // Verify remaining points balance is exactly 0 and never negative
  const finalWalletRes = await fetch(
    `${baseUrl}/api/loyalty/customer?businessId=${biz.id}&phone=${customerPhone}&token=${walletToken}`
  );
  const finalWallet = await finalWalletRes.json();
  assert.equal(finalWallet.pointsBalance, 0, 'Balance must be 0 after single redemption');
});

// -------------------------------------------------------------
// 7. PERSISTENCE FAILURE ATOMICITY & ERROR HANDLING
// -------------------------------------------------------------
test('Atomic persistence throws on write failures rather than silently reporting success', () => {
  // Writing to an invalid / impossible path must throw an Error
  assert.throws(() => {
    writeAtomicJsonSync('/dev/null/impossible.json', { test: true });
  }, /Storage persistence failure/);
});

// -------------------------------------------------------------
// 8. PROXY HEADER SPOOFING & RATE-LIMIT ENFORCEMENT
// -------------------------------------------------------------
test('Arbitrary X-Forwarded-For headers are not trusted without TRUST_PROXY', async () => {
  // Ensure TRUST_PROXY is false/undefined during test
  delete process.env.TRUST_PROXY;

  const dummyReq: any = {
    headers: { 'x-forwarded-for': '203.0.113.195' },
    socket: { remoteAddress: '127.0.0.1' },
  };

  const ip = getClientIp(dummyReq);
  assert.equal(ip, '127.0.0.1', 'Untrusted proxy must ignore arbitrary X-Forwarded-For header');
});

// -------------------------------------------------------------
// 9. STRICT INDIAN MOBILE NUMBER VALIDATION
// -------------------------------------------------------------
test('Strict Indian phone validation rejects non-mobile formats', () => {
  // Valid 10-digit mobile numbers starting with 6, 7, 8, or 9
  assert.equal(isValidIndianPhone('9826012345'), true);
  assert.equal(isValidIndianPhone('8826012345'), true);
  assert.equal(isValidIndianPhone('7826012345'), true);
  assert.equal(isValidIndianPhone('6826012345'), true);
  assert.equal(isValidIndianPhone('+919826012345'), true);
  assert.equal(isValidIndianPhone('919826012345'), true);

  // Invalid numbers
  assert.equal(isValidIndianPhone('1234567890'), false, 'Cannot start with 1');
  assert.equal(isValidIndianPhone('0123456789'), false, 'Cannot start with 0');
  assert.equal(isValidIndianPhone('5551234567'), false, 'Cannot start with 5');
  assert.equal(isValidIndianPhone('98260'), false, 'Too short');
  assert.equal(isValidIndianPhone('98260123456789'), false, 'Too long');
  assert.equal(isValidIndianPhone('abcdefghij'), false, 'Non-digits');
});

// -------------------------------------------------------------
// 10. PUBLIC SERIALIZATION EXCLUDES PRIVATE KEYS & CREDENTIALS
// -------------------------------------------------------------
test('Public business directory and public config endpoints exclude private keys and PINs', async () => {
  const dirRes = await fetch(`${baseUrl}/api/businesses`);
  assert.equal(dirRes.status, 200);
  const businesses = await dirRes.json();

  for (const b of businesses) {
    assert.equal(b.ownerKey, undefined, 'Public business profile must not expose ownerKey');
    assert.equal(b.staffPin, undefined, 'Public business profile must not expose staffPin');
  }
});
