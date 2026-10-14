import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// -------------------------------------------------------------
// SECURE ENVIRONMENT CONFIGURATION
// -------------------------------------------------------------

const isProduction = process.env.NODE_ENV === 'production';

let activeAdminPasscode: string;

if (process.env.ADMIN_PASSCODE) {
  if (isProduction && process.env.ADMIN_PASSCODE.length < 10) {
    throw new Error('FATAL SECURITY ERROR: ADMIN_PASSCODE must be at least 10 characters in production.');
  }
  activeAdminPasscode = process.env.ADMIN_PASSCODE;
} else {
  if (isProduction) {
    throw new Error('FATAL SECURITY ERROR: ADMIN_PASSCODE environment variable is required in production.');
  }
  // Secure ephemeral admin passcode for development
  activeAdminPasscode = crypto.randomBytes(12).toString('hex');
  console.log('-------------------------------------------------------------');
  console.log('⚠️  DEVELOPMENT NOTICE: No ADMIN_PASSCODE provided.');
  console.log(`🔐 Generated Ephemeral Admin Passcode: ${activeAdminPasscode}`);
  console.log('-------------------------------------------------------------');
}

export function getActiveAdminPasscode(): string {
  return activeAdminPasscode;
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
// ADMIN SESSIONS (Cryptographically Random, Expiring, Invalidation)
// -------------------------------------------------------------

export interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const adminSessions = new Map<string, AdminSession>();

// Cleanup expired sessions every 15 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt <= now) {
      adminSessions.delete(token);
    }
  }
}, 15 * 60 * 1000);
cleanupTimer.unref();

export function createAdminSession(ip: string): string {
  const token = 'dkb_adm_' + crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  adminSessions.set(token, {
    token,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip,
  });
  return token;
}

export function validateAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  const session = adminSessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return false;
  }
  return true;
}

export function invalidateAdminSession(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  return adminSessions.delete(token);
}

// -------------------------------------------------------------
// RATE LIMITING & BRUTE FORCE LOCKOUT
// -------------------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}

class MemoryRateLimiter {
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
}

// Dedicated Rate Limiters
export const loginLimiter = new MemoryRateLimiter(5, 15 * 60 * 1000, 15 * 60 * 1000); // 5 attempts per 15 min, 15 min lockout
export const loyaltyCheckinLimiter = new MemoryRateLimiter(10, 60 * 1000); // 10 attempts per min per phone/IP
export const promoGenerationLimiter = new MemoryRateLimiter(20, 60 * 60 * 1000); // 20 kits per hour per IP
export const feedbackLimiter = new MemoryRateLimiter(15, 60 * 1000); // 15 reviews per min per IP
export const orderCreationLimiter = new MemoryRateLimiter(10, 60 * 60 * 1000); // 10 orders per hour per IP

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// -------------------------------------------------------------
// ATOMIC WALLET MUTEX / LOCKING
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
// DYNAMIC DAILY ROTATING CODE
// -------------------------------------------------------------

export function generateDailyCheckinCode(): { code: string; expiresAt: string } {
  // Generate random 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();
  // Expires in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  return { code, expiresAt };
}

// -------------------------------------------------------------
// UNGUESSABLE IDENTIFIERS
// -------------------------------------------------------------

export function generateUnguessableOrderId(): string {
  const year = new Date().getFullYear();
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `DKB-${year}-${randomSuffix}`;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(16).toString('hex');
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

export function isValidIndianPhone(phone: string): boolean {
  const clean = sanitizePhone(phone);
  // Valid Indian mobile numbers are 10 digits, or 12 with 91 prefix
  if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) return true;
  if (clean.length === 12 && clean.startsWith('91') && /^91[6-9]\d{9}$/.test(clean)) return true;
  // Also support demo/test numbers that are 10 digits
  return clean.length >= 10 && clean.length <= 12;
}

export function sanitizeUpiRef(val: any): string {
  if (typeof val !== 'string') return '';
  // UPI transaction references are alphanumeric, typically 8 to 35 chars
  return val.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35);
}
