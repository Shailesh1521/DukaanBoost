import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  BusinessProfile,
  DigitalMenu,
  FeedbackSubmission,
  Order,
  LoyaltyConfig,
  CustomerLoyaltyWallet,
  LoyaltyLedgerEntry,
} from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'dukaanboost.db');

export class DukaanDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string = DB_PATH) {
    this.db = new DatabaseSync(dbPath);
    this.initPragmas();
    this.initSchema();
  }

  private initPragmas(): void {
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        business_name TEXT NOT NULL,
        category TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT,
        contact_phone TEXT,
        products_services TEXT,
        target_audience TEXT,
        promotion_objective TEXT,
        offer_discount TEXT,
        preferred_language TEXT,
        visual_style TEXT,
        brand_color TEXT,
        google_review_url TEXT,
        owner_key TEXT NOT NULL,
        staff_pin TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menus (
        business_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        tags_json TEXT NOT NULL,
        comment TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        package_type TEXT NOT NULL,
        package_title TEXT NOT NULL,
        amount REAL NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        business_details_json TEXT NOT NULL,
        special_notes TEXT,
        payment_status TEXT NOT NULL,
        fulfillment_status TEXT NOT NULL,
        upi_transaction_ref TEXT,
        order_access_token TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loyalty_configs (
        business_id TEXT PRIMARY KEY,
        enabled INTEGER NOT NULL DEFAULT 1,
        points_per_visit INTEGER NOT NULL DEFAULT 10,
        min_hours_between_visits REAL NOT NULL DEFAULT 12,
        staff_pin TEXT NOT NULL,
        daily_checkin_code TEXT NOT NULL,
        daily_code_expires_at TEXT NOT NULL,
        rewards_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loyalty_wallets (
        business_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        name TEXT,
        points_balance INTEGER NOT NULL DEFAULT 0,
        total_visits INTEGER NOT NULL DEFAULT 0,
        last_visit_at TEXT,
        wallet_token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (business_id, phone)
      );

      CREATE TABLE IF NOT EXISTS loyalty_ledger (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_name TEXT,
        type TEXT NOT NULL,
        points_change INTEGER NOT NULL,
        reward_title TEXT,
        staff_verified INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        idempotency_key TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS idempotency_records (
        idempotency_key TEXT PRIMARY KEY,
        business_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS analytics (
        business_id TEXT PRIMARY KEY,
        scans INTEGER NOT NULL DEFAULT 0,
        menu_views INTEGER NOT NULL DEFAULT 0,
        visits INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
  }

  public withTransaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch {}
      throw err;
    }
  }

  // -----------------------------------------------------------
  // BUSINESS OPERATIONS
  // -----------------------------------------------------------
  public getBusiness(id: string): BusinessProfile | null {
    const stmt = this.db.prepare('SELECT * FROM businesses WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapBusinessRow(row);
  }

  public getAllBusinesses(): BusinessProfile[] {
    const stmt = this.db.prepare('SELECT * FROM businesses ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((r) => this.mapBusinessRow(r));
  }

  public upsertBusiness(business: BusinessProfile): void {
    const now = new Date().toISOString();
    const id = business.id || `biz-${Date.now()}`;
    const stmt = this.db.prepare(`
      INSERT INTO businesses (
        id, business_name, category, city, address, contact_phone,
        products_services, target_audience, promotion_objective,
        offer_discount, preferred_language, visual_style, brand_color,
        google_review_url, owner_key, staff_pin, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        business_name = excluded.business_name,
        category = excluded.category,
        city = excluded.city,
        address = excluded.address,
        contact_phone = excluded.contact_phone,
        products_services = excluded.products_services,
        target_audience = excluded.target_audience,
        promotion_objective = excluded.promotion_objective,
        offer_discount = excluded.offer_discount,
        preferred_language = excluded.preferred_language,
        visual_style = excluded.visual_style,
        brand_color = excluded.brand_color,
        google_review_url = excluded.google_review_url,
        owner_key = excluded.owner_key,
        staff_pin = excluded.staff_pin,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      id,
      business.businessName,
      business.category,
      business.city,
      business.address || null,
      business.contactPhone || '',
      business.productsServices || '',
      business.targetAudience || '',
      business.promotionObjective || 'more_sales',
      business.offerDiscount || '',
      business.preferredLanguage || 'hinglish',
      business.visualStyle || 'chai_bites',
      business.brandColor || '#ea580c',
      business.googleReviewUrl || null,
      business.ownerKey || '',
      business.staffPin || '',
      now,
      now
    );
  }

  public rotateBusinessCredentials(businessId: string, newOwnerKey: string, newStaffPin: string): void {
    this.withTransaction(() => {
      const now = new Date().toISOString();
      const bizStmt = this.db.prepare('UPDATE businesses SET owner_key = ?, staff_pin = ?, updated_at = ? WHERE id = ?');
      const bizRes = bizStmt.run(newOwnerKey, newStaffPin, now, businessId);
      if (bizRes.changes === 0) {
        throw new Error(`Business not found: ${businessId}`);
      }

      const loyaltyStmt = this.db.prepare('UPDATE loyalty_configs SET staff_pin = ?, updated_at = ? WHERE business_id = ?');
      loyaltyStmt.run(newStaffPin, now, businessId);
    });
  }

  private mapBusinessRow(row: any): BusinessProfile {
    return {
      id: row.id,
      businessName: row.business_name,
      category: row.category,
      city: row.city,
      address: row.address || undefined,
      contactPhone: row.contact_phone || '',
      productsServices: row.products_services || '',
      targetAudience: row.target_audience || '',
      promotionObjective: row.promotion_objective || 'more_sales',
      offerDiscount: row.offer_discount || '',
      preferredLanguage: row.preferred_language || 'hinglish',
      visualStyle: row.visual_style || 'chai_bites',
      brandColor: row.brand_color || '#ea580c',
      googleReviewUrl: row.google_review_url || undefined,
      ownerKey: row.owner_key,
      staffPin: row.staff_pin,
    };
  }

  // -----------------------------------------------------------
  // DIGITAL MENU OPERATIONS
  // -----------------------------------------------------------
  public getMenu(businessId: string): DigitalMenu | null {
    const stmt = this.db.prepare('SELECT data_json FROM menus WHERE business_id = ?');
    const row = stmt.get(businessId) as any;
    if (!row) return null;
    return JSON.parse(row.data_json);
  }

  public upsertMenu(menu: DigitalMenu): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO menus (business_id, data_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(business_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(menu.businessId, JSON.stringify(menu), now);
  }

  // -----------------------------------------------------------
  // CUSTOMER FEEDBACK
  // -----------------------------------------------------------
  public addFeedback(feedback: FeedbackSubmission): void {
    const stmt = this.db.prepare(`
      INSERT INTO feedback (id, business_id, rating, tags_json, comment, customer_name, customer_phone, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      feedback.id,
      feedback.businessId,
      feedback.rating,
      JSON.stringify(feedback.tags || []),
      feedback.comment,
      feedback.customerName || null,
      feedback.customerPhone || null,
      feedback.createdAt
    );
  }

  public getFeedbackByBusiness(businessId: string): FeedbackSubmission[] {
    const stmt = this.db.prepare('SELECT * FROM feedback WHERE business_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(businessId) as any[];
    return rows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      rating: r.rating,
      tags: JSON.parse(r.tags_json || '[]'),
      comment: r.comment,
      customerName: r.customer_name || undefined,
      customerPhone: r.customer_phone || undefined,
      createdAt: r.created_at,
    }));
  }

  // -----------------------------------------------------------
  // ORDER MANAGEMENT
  // -----------------------------------------------------------
  public createOrder(order: Order): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO orders (
        id, package_type, package_title, amount, customer_name,
        customer_phone, customer_email, business_details_json, special_notes,
        payment_status, fulfillment_status, upi_transaction_ref,
        order_access_token, admin_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      order.id,
      order.packageType,
      order.packageTitle,
      order.amount,
      order.customerName,
      order.customerPhone,
      order.customerEmail || null,
      JSON.stringify(order.businessDetails || {}),
      order.specialNotes || null,
      order.paymentStatus,
      order.fulfillmentStatus,
      order.upiTransactionRef || null,
      order.orderAccessToken || null,
      order.adminNotes || null,
      order.createdAt,
      now
    );
  }

  public getOrder(id: string): Order | null {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapOrderRow(row);
  }

  public getAllOrders(): Order[] {
    const stmt = this.db.prepare('SELECT * FROM orders ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map((r) => this.mapOrderRow(r));
  }

  public updateOrderPaymentStatus(orderId: string, paymentStatus: 'paid' | 'pending' | 'verified' | 'rejected', upiRef?: string): void {
    const now = new Date().toISOString();
    if (upiRef) {
      const stmt = this.db.prepare('UPDATE orders SET payment_status = ?, upi_transaction_ref = ?, updated_at = ? WHERE id = ?');
      stmt.run(paymentStatus, upiRef, now, orderId);
    } else {
      const stmt = this.db.prepare('UPDATE orders SET payment_status = ?, updated_at = ? WHERE id = ?');
      stmt.run(paymentStatus, now, orderId);
    }
  }

  public updateOrderFulfillment(orderId: string, status: 'pending' | 'in_progress' | 'completed', adminNotes?: string): void {
    const now = new Date().toISOString();
    if (adminNotes !== undefined) {
      const stmt = this.db.prepare('UPDATE orders SET fulfillment_status = ?, admin_notes = ?, updated_at = ? WHERE id = ?');
      stmt.run(status, adminNotes, now, orderId);
    } else {
      const stmt = this.db.prepare('UPDATE orders SET fulfillment_status = ?, updated_at = ? WHERE id = ?');
      stmt.run(status, now, orderId);
    }
  }

  private mapOrderRow(row: any): Order {
    return {
      id: row.id,
      packageType: row.package_type,
      packageTitle: row.package_title,
      amount: row.amount,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email || undefined,
      businessDetails: JSON.parse(row.business_details_json || '{}'),
      specialNotes: row.special_notes || undefined,
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      upiTransactionRef: row.upi_transaction_ref || undefined,
      orderAccessToken: row.order_access_token || undefined,
      adminNotes: row.admin_notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // -----------------------------------------------------------
  // LOYALTY & REWARDS
  // -----------------------------------------------------------
  public getLoyaltyConfig(businessId: string): LoyaltyConfig | null {
    const stmt = this.db.prepare('SELECT * FROM loyalty_configs WHERE business_id = ?');
    const row = stmt.get(businessId) as any;
    if (!row) return null;
    return {
      businessId: row.business_id,
      enabled: Boolean(row.enabled),
      pointsPerVisit: row.points_per_visit,
      minHoursBetweenVisits: row.min_hours_between_visits,
      staffPin: row.staff_pin,
      dailyCheckinCode: row.daily_checkin_code,
      dailyCodeExpiresAt: row.daily_code_expires_at,
      rewards: JSON.parse(row.rewards_json),
    };
  }

  public upsertLoyaltyConfig(config: LoyaltyConfig): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO loyalty_configs (
        business_id, enabled, points_per_visit, min_hours_between_visits,
        staff_pin, daily_checkin_code, daily_code_expires_at, rewards_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(business_id) DO UPDATE SET
        enabled = excluded.enabled,
        points_per_visit = excluded.points_per_visit,
        min_hours_between_visits = excluded.min_hours_between_visits,
        staff_pin = excluded.staff_pin,
        daily_checkin_code = excluded.daily_checkin_code,
        daily_code_expires_at = excluded.daily_code_expires_at,
        rewards_json = excluded.rewards_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      config.businessId,
      config.enabled ? 1 : 0,
      config.pointsPerVisit,
      config.minHoursBetweenVisits,
      config.staffPin,
      config.dailyCheckinCode,
      config.dailyCodeExpiresAt,
      JSON.stringify(config.rewards || []),
      now
    );
  }

  public getWallet(businessId: string, phone: string): {
    phone: string;
    name?: string;
    pointsBalance: number;
    totalVisits: number;
    lastVisitAt?: string;
    walletToken: string;
  } | null {
    const stmt = this.db.prepare('SELECT * FROM loyalty_wallets WHERE business_id = ? AND phone = ?');
    const row = stmt.get(businessId, phone) as any;
    if (!row) return null;
    return {
      phone: row.phone,
      name: row.name || undefined,
      pointsBalance: row.points_balance,
      totalVisits: row.total_visits,
      lastVisitAt: row.last_visit_at || undefined,
      walletToken: row.wallet_token,
    };
  }

  public getLedgerEntries(businessId: string, phone?: string, limit: number = 20): LoyaltyLedgerEntry[] {
    let rows: any[];
    if (phone) {
      const stmt = this.db.prepare(`
        SELECT * FROM loyalty_ledger
        WHERE business_id = ? AND customer_phone = ?
        ORDER BY created_at DESC LIMIT ?
      `);
      rows = stmt.all(businessId, phone, limit) as any[];
    } else {
      const stmt = this.db.prepare(`
        SELECT * FROM loyalty_ledger
        WHERE business_id = ?
        ORDER BY created_at DESC LIMIT ?
      `);
      rows = stmt.all(businessId, limit) as any[];
    }

    return rows.map((r) => ({
      id: r.id,
      businessId: r.business_id,
      customerPhone: r.customer_phone,
      customerName: r.customer_name || undefined,
      type: r.type,
      pointsChange: r.points_change,
      rewardTitle: r.reward_title || undefined,
      staffVerified: Boolean(r.staff_verified),
      note: r.note || undefined,
      idempotencyKey: r.idempotency_key || undefined,
      createdAt: r.created_at,
    }));
  }

  // -----------------------------------------------------------
  // IDEMPOTENCY
  // -----------------------------------------------------------
  public getIdempotencyRecord(key: string): { operation: string; response: any } | null {
    const stmt = this.db.prepare('SELECT operation, response_json FROM idempotency_records WHERE idempotency_key = ?');
    const row = stmt.get(key) as any;
    if (!row) return null;
    return {
      operation: row.operation,
      response: JSON.parse(row.response_json),
    };
  }

  public saveIdempotencyRecord(key: string, businessId: string, operation: string, response: any): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO idempotency_records (idempotency_key, business_id, operation, response_json, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(idempotency_key) DO UPDATE SET
        response_json = excluded.response_json
    `);
    stmt.run(key, businessId, operation, JSON.stringify(response), now);
  }

  // -----------------------------------------------------------
  // TRANSACTIONAL CHECK-IN
  // -----------------------------------------------------------
  public processCheckin(params: {
    businessId: string;
    phone: string;
    customerName?: string;
    pointsAwarded: number;
    isStaffVerified: boolean;
    note: string;
    walletToken: string;
    idempotencyKey: string;
  }): {
    pointsAwarded: number;
    newBalance: number;
    totalVisits: number;
    walletToken: string;
    ledgerEntryId: string;
  } {
    return this.withTransaction(() => {
      const now = new Date().toISOString();

      const existing = this.getWallet(params.businessId, params.phone);
      const newBalance = (existing?.pointsBalance || 0) + params.pointsAwarded;
      const totalVisits = (existing?.totalVisits || 0) + 1;
      const activeToken = existing?.walletToken || params.walletToken;

      const walletStmt = this.db.prepare(`
        INSERT INTO loyalty_wallets (
          business_id, phone, name, points_balance, total_visits,
          last_visit_at, wallet_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(business_id, phone) DO UPDATE SET
          name = COALESCE(excluded.name, loyalty_wallets.name),
          points_balance = excluded.points_balance,
          total_visits = excluded.total_visits,
          last_visit_at = excluded.last_visit_at,
          updated_at = excluded.updated_at
      `);

      walletStmt.run(
        params.businessId,
        params.phone,
        params.customerName || null,
        newBalance,
        totalVisits,
        now,
        activeToken,
        now,
        now
      );

      const ledgerId = `led-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerStmt = this.db.prepare(`
        INSERT INTO loyalty_ledger (
          id, business_id, customer_phone, customer_name, type,
          points_change, staff_verified, note, idempotency_key, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      ledgerStmt.run(
        ledgerId,
        params.businessId,
        params.phone,
        params.customerName || null,
        'visit_award',
        params.pointsAwarded,
        params.isStaffVerified ? 1 : 0,
        params.note,
        params.idempotencyKey,
        now
      );

      // Update analytics
      const analyticsStmt = this.db.prepare(`
        INSERT INTO analytics (business_id, visits, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT(business_id) DO UPDATE SET
          visits = analytics.visits + 1,
          updated_at = excluded.updated_at
      `);
      analyticsStmt.run(params.businessId, now);

      return {
        pointsAwarded: params.pointsAwarded,
        newBalance,
        totalVisits,
        walletToken: activeToken,
        ledgerEntryId: ledgerId,
      };
    });
  }

  // -----------------------------------------------------------
  // TRANSACTIONAL REDEMPTION
  // -----------------------------------------------------------
  public processRedemption(params: {
    businessId: string;
    phone: string;
    rewardId: string;
    rewardTitle: string;
    pointsRequired: number;
    receiptCode: string;
    idempotencyKey: string;
  }): {
    receiptCode: string;
    rewardTitle: string;
    pointsDeducted: number;
    remainingBalance: number;
    ledgerEntryId: string;
  } {
    return this.withTransaction(() => {
      const now = new Date().toISOString();

      const wallet = this.getWallet(params.businessId, params.phone);
      if (!wallet || wallet.pointsBalance < params.pointsRequired) {
        throw new Error(
          `Insufficient points. Balance: ${wallet?.pointsBalance || 0}, Required: ${params.pointsRequired}`
        );
      }

      const newBalance = wallet.pointsBalance - params.pointsRequired;
      if (newBalance < 0) {
        throw new Error('Illegal transaction: points balance cannot be negative');
      }

      const walletStmt = this.db.prepare(`
        UPDATE loyalty_wallets
        SET points_balance = ?, updated_at = ?
        WHERE business_id = ? AND phone = ?
      `);
      walletStmt.run(newBalance, now, params.businessId, params.phone);

      const ledgerId = `led-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const ledgerStmt = this.db.prepare(`
        INSERT INTO loyalty_ledger (
          id, business_id, customer_phone, customer_name, type,
          points_change, reward_title, staff_verified, note, idempotency_key, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      ledgerStmt.run(
        ledgerId,
        params.businessId,
        params.phone,
        wallet.name || null,
        'reward_redemption',
        -params.pointsRequired,
        params.rewardTitle,
        1,
        `Redeemed: ${params.rewardTitle} (Receipt: ${params.receiptCode})`,
        params.idempotencyKey,
        now
      );

      return {
        receiptCode: params.receiptCode,
        rewardTitle: params.rewardTitle,
        pointsDeducted: params.pointsRequired,
        remainingBalance: newBalance,
        ledgerEntryId: ledgerId,
      };
    });
  }

  // -----------------------------------------------------------
  // ANALYTICS
  // -----------------------------------------------------------
  public getAnalytics(businessId: string): { scans: number; menuViews: number; visits: number } {
    const stmt = this.db.prepare('SELECT scans, menu_views, visits FROM analytics WHERE business_id = ?');
    const row = stmt.get(businessId) as any;
    if (!row) return { scans: 0, menuViews: 0, visits: 0 };
    return {
      scans: row.scans || 0,
      menuViews: row.menu_views || 0,
      visits: row.visits || 0,
    };
  }

  public incrementAnalytics(businessId: string, field: 'scans' | 'menuViews' | 'visits'): void {
    const now = new Date().toISOString();
    const col = field === 'scans' ? 'scans' : field === 'menuViews' ? 'menu_views' : 'visits';
    const stmt = this.db.prepare(`
      INSERT INTO analytics (business_id, ${col}, updated_at)
      VALUES (?, 1, ?)
      ON CONFLICT(business_id) DO UPDATE SET
        ${col} = analytics.${col} + 1,
        updated_at = excluded.updated_at
    `);
    stmt.run(businessId, now);
  }

  public close(): void {
    this.db.close();
  }
}

// Global Singleton Instance
export const db = new DukaanDatabase();
