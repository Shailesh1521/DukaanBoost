import crypto from 'crypto';
import { Request } from 'express';

// -------------------------------------------------------------
// SECURE ENVIRONMENT CONFIGURATION
// -------------------------------------------------------------

export interface EnvValidationResult {
  adminPasscode: string;
  adminSessionSecret: string;
  isProduction: boolean;
}

export function validateEnvironmentConfig(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const isProduction = env.NODE_ENV === 'production';

  let adminPasscode = env.ADMIN_PASSCODE || '';
  let adminSessionSecret = env.ADMIN_SESSION_SECRET || '';

  if (isProduction) {
    if (!adminPasscode) {
      throw new Error('FATAL SECURITY ERROR: ADMIN_PASSCODE environment variable is required in production.');
    }
    if (adminPasscode.length < 8) {
      throw new Error('FATAL SECURITY ERROR: ADMIN_PASSCODE must be at least 8 characters in production.');
    }
    if (!adminSessionSecret) {
      throw new Error('FATAL SECURITY ERROR: ADMIN_SESSION_SECRET environment variable is required in production.');
    }
    if (adminSessionSecret.length < 16) {
      throw new Error('FATAL SECURITY ERROR: ADMIN_SESSION_SECRET must be at least 16 characters in production.');
    }
  } else {
    if (!adminPasscode) {
      adminPasscode = crypto.randomBytes(16).toString('hex');
      console.log('-------------------------------------------------------------');
      console.log('⚠️  DEVELOPMENT NOTICE: No ADMIN_PASSCODE provided.');
      console.log(`🔐 Generated Ephemeral Admin Passcode: ${adminPasscode}`);
      console.log('-------------------------------------------------------------');
    }
    if (!adminSessionSecret) {
      adminSessionSecret = crypto.randomBytes(32).toString('hex');
    }
  }

  return {
    adminPasscode,
    adminSessionSecret,
    isProduction,
  };
}

const envConfig = validateEnvironmentConfig();
let activeAdminPasscode = envConfig.adminPasscode;
let activeAdminSessionSecret = envConfig.adminSessionSecret;

export function getActiveAdminPasscode(): string {
  return activeAdminPasscode;
}

export function getActiveAdminSessionSecret(): string {
  return activeAdminSessionSecret;
}

export function resetActiveSecretsForTesting(passcode: string, secret: string): void {
  activeAdminPasscode = passcode;
  activeAdminSessionSecret = secret;
}

// -------------------------------------------------------------
// TIMING-SAFE EQUALITY HELPER
// -------------------------------------------------------------

export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Constant time dummy comparison
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// -------------------------------------------------------------
// ADMIN SESSIONS (Opaque Tokens, Server-Side HMAC Hash, Expiring)
// Note: Sessions are stored in server process memory (single-instance).
// Server restart invalidates active sessions by design. For multi-instance
// horizontal scaling, an external shared database or Redis is required.
// -------------------------------------------------------------

export interface AdminSessionRecord {
  tokenHash: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const adminSessions = new Map<string, AdminSessionRecord>();

export function hashSessionToken(token: string): string {
  return crypto.createHmac('sha256', activeAdminSessionSecret).update(token).digest('hex');
}

// Cleanup expired sessions every 15 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [tokenHash, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(tokenHash);
    }
  }
}, 15 * 60 * 1000);
cleanupTimer.unref();

export function createAdminSession(ip: string): string {
  const token = 'dkb_adm_' + crypto.randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const now = Date.now();

  adminSessions.set(tokenHash, {
    tokenHash,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip,
  });

  return token;
}

export function validateAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const tokenHash = hashSessionToken(token);
  const session = adminSessions.get(tokenHash);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(tokenHash);
    return false;
  }
  return true;
}

export function invalidateAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const tokenHash = hashSessionToken(token);
  return adminSessions.delete(tokenHash);
}

export function clearAllAdminSessions(): void {
  adminSessions.clear();
}

// -------------------------------------------------------------
// TRUSTED PROXY & RATE LIMITING
// -------------------------------------------------------------

export function isTrustedProxyEnabled(): boolean {
  const tp = process.env.TRUST_PROXY;
  return tp === 'true' || tp === '1';
}

export function getClientIp(req: Request): string {
  if (isTrustedProxyEnabled()) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const firstIp = forwarded.split(',')[0].trim();
      if (firstIp) return firstIp;
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }
  // Untrusted proxy environment: strictly ignore arbitrary client headers
  return req.socket.remoteAddress || '127.0.0.1';
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

export class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  constructor(
    private maxRequests: number,
    private windowMs: number,
    private lockoutMs: number = 0
  ) {}

  public isAllowed(key: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + this.windowMs };
      this.records.set(key, record);
      return { allowed: true };
    }

    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }

    if (record.count >= this.maxRequests) {
      if (this.lockoutMs > 0) {
        record.lockedUntil = now + this.lockoutMs;
        this.records.set(key, record);
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil(this.lockoutMs / 1000),
        };
      }
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    record.count += 1;
    this.records.set(key, record);
    return { allowed: true };
  }

  public reset(key: string): void {
    this.records.delete(key);
  }

  public clear(): void {
    this.records.clear();
  }
}

// Dedicated Rate Limiters
export const loginLimiter = new MemoryRateLimiter(5, 15 * 60 * 1000, 15 * 60 * 1000); // 5 attempts per 15 min, 15 min lockout
export const loyaltyCheckinLimiter = new MemoryRateLimiter(10, 60 * 1000); // 10 attempts per min per phone/IP
export const promoGenerationLimiter = new MemoryRateLimiter(20, 60 * 60 * 1000); // 20 kits per hour per IP
export const feedbackLimiter = new MemoryRateLimiter(15, 60 * 1000); // 15 reviews per min per IP
export const orderCreationLimiter = new MemoryRateLimiter(10, 60 * 60 * 1000); // 10 orders per hour per IP
export const businessCreationLimiter = new MemoryRateLimiter(10, 60 * 60 * 1000); // 10 signups per hour per IP

// -------------------------------------------------------------
// ATOMIC WALLET MUTEX / IN-MEMORY LOCKING
// Note: In-memory mutex for single-node process. Distributed systems
// require external database row-level locking or distributed redis locks.
// -------------------------------------------------------------

const activeWalletLocks = new Map<string, Promise<void>>();

export async function withWalletLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  while (activeWalletLocks.has(key)) {
    try {
      await activeWalletLocks.get(key);
    } catch {
      // previous task error is ignored for lock queueing
    }
  }

  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  activeWalletLocks.set(key, lockPromise);

  try {
    return await task();
  } finally {
    activeWalletLocks.delete(key);
    releaseLock!();
  }
}

// -------------------------------------------------------------
// SECURE CREDENTIAL & IDENTIFIER GENERATORS
// -------------------------------------------------------------

export function generateDailyCheckinCode(): { code: string; expiresAt: string } {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return { code, expiresAt };
}

export function generateStaffPin(): string {
  return crypto.randomInt(1000, 9999).toString();
}

export function generateUnguessableOrderId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `DKB-${year}-${randomSuffix}`;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function generateWalletToken(): string {
  return 'cwt_' + crypto.randomBytes(24).toString('hex');
}

export function generateBusinessOwnerKey(): string {
  return 'biz_key_' + crypto.randomBytes(24).toString('hex');
}

// -------------------------------------------------------------
// INPUT VALIDATION & SANITIZATION HELPERS
// -------------------------------------------------------------

export function sanitizeString(val: any, maxLen = 200): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function sanitizePhone(val: any): string {
  if (typeof val !== 'string' && typeof val !== 'number') return '';
  const digits = String(val).replace(/[^0-9]/g, '');
  return digits.slice(0, 15);
}

export function normalizeIndianPhone(phone: string): string {
  const clean = sanitizePhone(phone);
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean.slice(2);
  }
  return clean;
}

export function isValidIndianPhone(phone: string): boolean {
  const clean = normalizeIndianPhone(phone);
  // Strict Indian mobile: exactly 10 digits starting with 6, 7, 8, or 9
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

export function sanitizeUpiRef(val: any): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35);
}
