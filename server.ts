import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  BusinessProfile,
  Order,
  PackageType,
  PromoKit,
  StoreSettings,
  DigitalMenu,
  FeedbackSubmission,
  LoyaltyConfig,
  LoyaltyLedgerEntry,
  CustomerLoyaltyWallet,
  AnalyticsSummary,
} from './src/types';
import { DEFAULT_STORE_SETTINGS, SAMPLE_BUSINESS_PROFILES } from './src/sampleData';
import {
  getActiveAdminPasscode,
  getActiveAdminSessionSecret,
  createAdminSession,
  validateAdminSession,
  invalidateAdminSession,
  clearAllAdminSessions,
  safeCompare,
  loginLimiter,
  loyaltyCheckinLimiter,
  promoGenerationLimiter,
  feedbackLimiter,
  orderCreationLimiter,
  businessCreationLimiter,
  getClientIp,
  withWalletLock,
  generateDailyCheckinCode,
  generateUnguessableOrderId,
  generateAccessToken,
  generateBusinessOwnerKey,
  generateStaffPin,
  generateWalletToken,
  sanitizeString,
  sanitizePhone,
  normalizeIndianPhone,
  sanitizeUpiRef,
  isValidIndianPhone,
} from './server/security';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enforce request size limit to prevent body-parser DOS
app.use(express.json({ limit: '200kb' }));

// Ensure data persistence directory exists
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

// Persistent Storage File Paths
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BUSINESSES_FILE = path.join(DATA_DIR, 'businesses.json');
const MENUS_FILE = path.join(DATA_DIR, 'menus.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const LOYALTY_FILE = path.join(DATA_DIR, 'loyalty.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// File Helper Utilities
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Atomic file write using POSIX rename to prevent partial writes, corruption, or silent loss
export function writeAtomicJsonSync<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempFile = `${filePath}.tmp.${Date.now()}.${crypto.randomBytes(6).toString('hex')}`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (err: any) {
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch {}
    throw new Error(`Storage persistence failure on ${path.basename(filePath)}: ${err.message}`);
  }
}

// -------------------------------------------------------------
// DEMO DATA & ENVIRONMENT ISOLATION
// Production mode NEVER seeds default credentials or demo businesses.
// Development mode provisions dynamic random credentials, never hardcoded strings.
// -------------------------------------------------------------

function getInitialBusinessProfiles(): Record<string, BusinessProfile> {
  if (isProduction) {
    // In production, start empty unless persisted businesses already exist
    return readJsonFile<Record<string, BusinessProfile>>(BUSINESSES_FILE, {});
  }

  // Development mode: load from disk or provision dynamic demo business
  const existing = readJsonFile<Record<string, BusinessProfile>>(BUSINESSES_FILE, {});
  if (Object.keys(existing).length > 0) {
    return existing;
  }

  // Generate dynamic, isolated credentials for development demo
  const devOwnerKey = generateBusinessOwnerKey();
  const devStaffPin = generateStaffPin();

  const devBusiness: BusinessProfile = {
    id: 'chai-shai-cafe',
    businessName: 'Chai Shai & Snacks Corner',
    category: 'cafe',
    city: 'Indore, MP',
    address: 'Shop 14, Chappan Dukan, New Palasia, Indore',
    contactPhone: '9826012345',
    productsServices: 'Special Masala Kulhad Chai, Bun Maska, Crispy Paneer Pakode, Cheese Grilled Sandwiches, Cold Coffee',
    targetAudience: 'College students, office workers, local foodies and tea lovers',
    promotionObjective: 'more_sales',
    offerDiscount: 'Chai + Samosa Combo @ ₹49 Only',
    preferredLanguage: 'hinglish',
    visualStyle: 'chai_bites',
    brandColor: '#ea580c',
    googleReviewUrl: 'https://g.page/r/sample-chai-shai-indore/review',
    ownerKey: devOwnerKey,
    staffPin: devStaffPin,
    createdAt: '2026-10-14T05:00:00.000Z',
  };

  return { 'chai-shai-cafe': devBusiness };
}

const DEFAULT_MENU: DigitalMenu = {
  businessId: 'chai-shai-cafe',
  businessName: 'Chai Shai & Snacks Corner',
  currency: '₹',
  lastUpdated: '2026-10-14T05:00:00.000Z',
  categories: [
    { id: 'cat-tea', name: 'Kadak Chai & Beverages', description: 'Freshly brewed in earthen kulhads', sortOrder: 1 },
    { id: 'cat-snacks', name: 'Desi Snacks & Pakode', description: 'Hot and crispy, served with mint chutney', sortOrder: 2 },
    { id: 'cat-sandwiches', name: 'Grilled Sandwiches & Combos', description: 'Loaded with cheese and butter', sortOrder: 3 },
  ],
  items: [
    {
      id: 'item-1',
      categoryId: 'cat-tea',
      name: 'Special Masala Kulhad Chai',
      description: 'Slow-brewed with fresh ginger, green cardamom and secret spiced tea blend in clay kulhad.',
      price: 25,
      isAvailable: true,
      dietaryTag: 'veg',
      isSpecial: true,
    },
    {
      id: 'item-2',
      categoryId: 'cat-tea',
      name: 'Kesar Elaichi Kulhad Chai',
      description: 'Royal saffron infused tea with crushed green cardamom and rich milk.',
      price: 35,
      isAvailable: true,
      dietaryTag: 'veg',
    },
    {
      id: 'item-3',
      categoryId: 'cat-tea',
      name: 'Thick Cold Coffee with Chocolate Drizzle',
      description: 'Rich creamy blended cold coffee topped with cocoa powder.',
      price: 60,
      isAvailable: true,
      dietaryTag: 'veg',
    },
    {
      id: 'item-4',
      categoryId: 'cat-snacks',
      name: 'Bun Maska with Jam & Butter',
      description: 'Soft bakery pav generously smothered with salted Amul butter and sweet berry jam.',
      price: 40,
      isAvailable: true,
      dietaryTag: 'veg',
      isSpecial: true,
    },
    {
      id: 'item-5',
      categoryId: 'cat-snacks',
      name: 'Crispy Paneer Pakoda (4 Pcs)',
      description: 'Fresh malai paneer slices coated with spiced gram flour and fried golden crisp.',
      price: 70,
      isAvailable: true,
      dietaryTag: 'veg',
    },
    {
      id: 'item-6',
      categoryId: 'cat-sandwiches',
      name: 'Cheese Corn Grilled Sandwich',
      description: 'Sweet corn, diced capsicum and mozzarella grilled to crispy perfection.',
      price: 90,
      isAvailable: true,
      dietaryTag: 'veg',
    },
    {
      id: 'item-7',
      categoryId: 'cat-sandwiches',
      name: 'Superhit Chai + 2 Samosas Combo',
      description: '1 Kulhad Masala Chai paired with 2 hot Punjabi aloo samosas with tangy saunth.',
      price: 49,
      isAvailable: true,
      dietaryTag: 'veg',
      isSpecial: true,
    },
  ],
};

function getInitialLoyaltyStorage(businessProfiles: Record<string, BusinessProfile>): LoyaltyStorage {
  const existing = readJsonFile<LoyaltyStorage>(LOYALTY_FILE, {
    configs: {},
    wallets: {},
    ledger: [],
  });

  if (isProduction || Object.keys(existing.configs).length > 0) {
    return existing;
  }

  // Development demo seeding
  const devBiz = businessProfiles['chai-shai-cafe'];
  const daily = generateDailyCheckinCode();
  const devStaffPin = devBiz?.staffPin || generateStaffPin();

  return {
    configs: {
      'chai-shai-cafe': {
        businessId: 'chai-shai-cafe',
        enabled: true,
        pointsPerVisit: 10,
        minHoursBetweenVisits: 12,
        dailyCheckinCode: daily.code,
        dailyCodeExpiresAt: daily.expiresAt,
        staffPin: devStaffPin,
        rewards: [
          { id: 'rew-1', title: 'Free Kulhad Masala Chai', description: 'Enjoy 1 free cup of our signature tea', pointsRequired: 30, isActive: true },
          { id: 'rew-2', title: 'Free Bun Maska or 2 Samosas', description: 'Valid with any tea or beverage order', pointsRequired: 50, isActive: true },
          { id: 'rew-3', title: 'Free Cheese Grilled Sandwich', description: 'Your choice of veg cheese grilled sandwich', pointsRequired: 100, isActive: true },
        ],
      },
    },
    wallets: {
      'chai-shai-cafe': {
        '9826011111': {
          phone: '9826011111',
          name: 'Demo Patron',
          pointsBalance: 40,
          totalVisits: 4,
          lastVisitAt: '2026-10-14T03:30:00.000Z',
          walletToken: generateWalletToken(),
        },
      },
    },
    ledger: [
      {
        id: 'led-seed-1',
        businessId: 'chai-shai-cafe',
        customerPhone: '9826011111',
        customerName: 'Demo Patron',
        type: 'visit_award',
        pointsChange: 10,
        staffVerified: true,
        note: 'Visit check-in verified by staff',
        createdAt: '2026-10-14T03:30:00.000Z',
      },
    ],
  };
}

interface LoyaltyStorage {
  configs: Record<string, LoyaltyConfig>;
  wallets: Record<string, Record<string, { phone: string; name?: string; pointsBalance: number; totalVisits: number; lastVisitAt?: string; walletToken?: string }>>;
  ledger: (LoyaltyLedgerEntry & { idempotencyKey?: string })[];
}

// In-Memory Storage Cache initialized from files
let inMemoryOrders: Order[] = readJsonFile<Order[]>(ORDERS_FILE, []);
let currentSettings: StoreSettings = readJsonFile<StoreSettings>(SETTINGS_FILE, {
  ...DEFAULT_STORE_SETTINGS,
  foundingSetupPrice: 249,
});
let inMemoryBusinesses: Record<string, BusinessProfile> = getInitialBusinessProfiles();
let inMemoryMenus: Record<string, DigitalMenu> = readJsonFile<Record<string, DigitalMenu>>(
  MENUS_FILE,
  isProduction ? {} : { 'chai-shai-cafe': DEFAULT_MENU }
);
let inMemoryFeedback: FeedbackSubmission[] = readJsonFile<FeedbackSubmission[]>(FEEDBACK_FILE, []);
let inMemoryLoyalty: LoyaltyStorage = getInitialLoyaltyStorage(inMemoryBusinesses);
let inMemoryAnalytics: Record<string, { scans: number; menuViews: number; visits: number }> = readJsonFile<Record<string, { scans: number; menuViews: number; visits: number }>>(
  ANALYTICS_FILE,
  isProduction ? {} : { 'chai-shai-cafe': { scans: 48, menuViews: 42, visits: 18 } }
);

// -------------------------------------------------------------
// AUTHORIZATION MIDDLEWARES
// -------------------------------------------------------------

// Admin Auth Middleware with Expiring Session Verification
export function checkAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'] as string;
  if (!validateAdminSession(token)) {
    res.status(401).json({ error: 'Unauthorized. Valid expiring admin session required.' });
    return;
  }
  next();
}

// Business Owner or Admin Authorization Middleware
export function checkBusinessAuth(req: Request, res: Response, next: NextFunction): void {
  const businessId = (req.params.id || req.params.businessId || req.body?.businessId) as string;
  if (!businessId) {
    res.status(400).json({ error: 'Business ID is required for authorization.' });
    return;
  }

  // 1. Admin session can access any business
  const adminToken = req.headers['x-admin-token'] as string;
  if (validateAdminSession(adminToken)) {
    next();
    return;
  }

  // 2. Business key validation
  const clientBizKey = req.headers['x-business-key'] as string;
  const business = inMemoryBusinesses[businessId];

  if (!business || !business.ownerKey || !clientBizKey || !safeCompare(clientBizKey, business.ownerKey)) {
    res.status(403).json({
      error: 'Forbidden. Authenticated business owner key (x-business-key) or admin authorization required.',
    });
    return;
  }

  next();
}

// Public Business Profile Serializer (Never leaks ownerKey or staffPin)
export function serializePublicBusinessProfile(b: BusinessProfile) {
  return {
    id: b.id,
    businessName: b.businessName,
    category: b.category,
    city: b.city,
    address: b.address,
    contactPhone: b.contactPhone,
    productsServices: b.productsServices,
    targetAudience: b.targetAudience,
    promotionObjective: b.promotionObjective,
    offerDiscount: b.offerDiscount,
    preferredLanguage: b.preferredLanguage,
    visualStyle: b.visualStyle,
    brandColor: b.brandColor,
    googleReviewUrl: b.googleReviewUrl,
    createdAt: b.createdAt,
  };
}

// Ensure Rotating Daily Checkin Code is Fresh
function ensureFreshDailyCode(config: LoyaltyConfig): LoyaltyConfig {
  const now = Date.now();
  if (!config.dailyCheckinCode || !config.dailyCodeExpiresAt || new Date(config.dailyCodeExpiresAt).getTime() <= now) {
    const { code, expiresAt } = generateDailyCheckinCode();
    config.dailyCheckinCode = code;
    config.dailyCodeExpiresAt = expiresAt;
  }
  return config;
}

// Gemini AI Client Setup
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
    version: '2.6.0-security-hardened',
    mode: process.env.NODE_ENV || 'development',
  });
});

// 2. Public Store Settings (Read-Only)
app.get('/api/store-settings', (req, res) => {
  res.json(currentSettings);
});

// 3. Business Management (Secured)
app.get('/api/businesses', (req, res) => {
  const safeList = Object.values(inMemoryBusinesses).map(serializePublicBusinessProfile);
  res.json(safeList);
});

app.get('/api/businesses/:id', (req, res) => {
  const b = inMemoryBusinesses[req.params.id];
  if (!b) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }

  const clientBizKey = req.headers['x-business-key'] as string;
  const adminToken = req.headers['x-admin-token'] as string;
  const isOwner = Boolean(clientBizKey && b.ownerKey && safeCompare(clientBizKey, b.ownerKey));
  const isAdmin = validateAdminSession(adminToken);

  if (isOwner || isAdmin) {
    res.json(b);
  } else {
    res.json(serializePublicBusinessProfile(b));
  }
});

// Business Creation / Update Endpoint
app.post('/api/businesses', (req: Request, res: Response): void => {
  const clientIp = getClientIp(req);
  const limitCheck = businessCreationLimiter.isAllowed(clientIp);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: `Too many business registrations. Please wait ${limitCheck.retryAfterSeconds}s.` });
    return;
  }

  const profile = req.body as BusinessProfile;
  if (!profile.businessName || typeof profile.businessName !== 'string') {
    res.status(400).json({ error: 'Valid business name is required' });
    return;
  }

  const cleanPhone = profile.contactPhone ? normalizeIndianPhone(profile.contactPhone) : '';
  if (cleanPhone && !isValidIndianPhone(cleanPhone)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
    return;
  }

  const slug = profile.id || profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const existing = inMemoryBusinesses[slug];

  // If modifying an existing business, caller MUST prove ownership or be admin
  if (existing) {
    const adminToken = req.headers['x-admin-token'] as string;
    const clientBizKey = req.headers['x-business-key'] as string;
    const isOwner = Boolean(clientBizKey && existing.ownerKey && safeCompare(clientBizKey, existing.ownerKey));
    const isAdmin = validateAdminSession(adminToken);

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Forbidden. Authorization required to modify this existing business.' });
      return;
    }
  }

  const isNew = !existing;
  const ownerKey = existing?.ownerKey || profile.ownerKey || generateBusinessOwnerKey();
  const staffPin = profile.staffPin
    ? String(profile.staffPin).trim().replace(/[^0-9]/g, '').slice(0, 8)
    : (existing?.staffPin || generateStaffPin());

  const updated: BusinessProfile = {
    ...profile,
    id: slug,
    ownerKey,
    staffPin,
    businessName: sanitizeString(profile.businessName, 100),
    city: sanitizeString(profile.city, 80),
    contactPhone: cleanPhone,
    brandColor: profile.brandColor || '#ea580c',
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const prevBusiness = inMemoryBusinesses[slug];
  inMemoryBusinesses[slug] = updated;

  try {
    writeAtomicJsonSync(BUSINESSES_FILE, inMemoryBusinesses);
  } catch (err) {
    if (prevBusiness) {
      inMemoryBusinesses[slug] = prevBusiness;
    } else {
      delete inMemoryBusinesses[slug];
    }
    res.status(500).json({ error: 'Storage persistence failure: business profile could not be saved.' });
    return;
  }

  // Initialize default menu and loyalty if not present
  if (!inMemoryMenus[slug]) {
    inMemoryMenus[slug] = {
      businessId: slug,
      businessName: updated.businessName,
      currency: '₹',
      lastUpdated: new Date().toISOString(),
      categories: [{ id: 'cat-1', name: 'General Menu', sortOrder: 1 }],
      items: [],
    };
    try {
      writeAtomicJsonSync(MENUS_FILE, inMemoryMenus);
    } catch (e) {
      console.warn('Could not persist default menu:', e);
    }
  }

  if (!inMemoryLoyalty.configs[slug]) {
    const { code, expiresAt } = generateDailyCheckinCode();
    inMemoryLoyalty.configs[slug] = {
      businessId: slug,
      enabled: true,
      pointsPerVisit: 10,
      minHoursBetweenVisits: 12,
      staffPin,
      dailyCheckinCode: code,
      dailyCodeExpiresAt: expiresAt,
      rewards: [
        { id: 'rew-1', title: 'Special Welcome Treat', description: 'Enjoy our signature introductory treat', pointsRequired: 30, isActive: true },
      ],
    };
    try {
      writeAtomicJsonSync(LOYALTY_FILE, inMemoryLoyalty);
    } catch (e) {
      console.warn('Could not persist default loyalty config:', e);
    }
  }

  // Return sensitive ownerKey and staffPin ONLY to the creator/authorized owner
  if (isNew) {
    res.status(201).json({
      ...serializePublicBusinessProfile(updated),
      ownerKey,
      staffPin,
      message: 'Business created. Store your ownerKey and staffPin securely in your dashboard.',
    });
  } else {
    res.json({
      ...serializePublicBusinessProfile(updated),
      ownerKey,
      staffPin,
    });
  }
});

// Rotate Business Credentials Endpoint (Requires Owner or Admin Auth)
app.post('/api/businesses/:id/rotate-credentials', checkBusinessAuth, (req: Request, res: Response): void => {
  const businessId = req.params.id;
  const business = inMemoryBusinesses[businessId];
  if (!business) {
    res.status(404).json({ error: 'Business not found.' });
    return;
  }

  const prevOwnerKey = business.ownerKey;
  const prevStaffPin = business.staffPin;

  const newOwnerKey = generateBusinessOwnerKey();
  const newStaffPin = generateStaffPin();

  business.ownerKey = newOwnerKey;
  business.staffPin = newStaffPin;

  const loyaltyConfig = inMemoryLoyalty.configs[businessId];
  if (loyaltyConfig) {
    loyaltyConfig.staffPin = newStaffPin;
  }

  try {
    writeAtomicJsonSync(BUSINESSES_FILE, inMemoryBusinesses);
    writeAtomicJsonSync(LOYALTY_FILE, inMemoryLoyalty);
  } catch (err) {
    business.ownerKey = prevOwnerKey;
    business.staffPin = prevStaffPin;
    if (loyaltyConfig && prevStaffPin) loyaltyConfig.staffPin = prevStaffPin;
    res.status(500).json({ error: 'Storage persistence failure: credential rotation could not be saved.' });
    return;
  }

  res.json({
    success: true,
    ownerKey: newOwnerKey,
    staffPin: newStaffPin,
    message: 'Credentials rotated successfully. Save your new keys safely.',
  });
});

// 4. Digital Menu Endpoints
app.get('/api/public/menu/:businessId', (req: Request, res: Response): void => {
  const businessId = req.params.businessId;
  const menu = inMemoryMenus[businessId];
  const business = inMemoryBusinesses[businessId];

  // Record an analytics view event
  if (!inMemoryAnalytics[businessId]) {
    inMemoryAnalytics[businessId] = { scans: 0, menuViews: 0, visits: 0 };
  }
  inMemoryAnalytics[businessId].menuViews += 1;
  try {
    writeAtomicJsonSync(ANALYTICS_FILE, inMemoryAnalytics);
  } catch (e) {
    // Non-fatal for public view
  }

  if (!menu) {
    res.status(404).json({ error: 'Menu not found for this business' });
    return;
  }

  res.json({
    menu,
    business: business ? serializePublicBusinessProfile(business) : { businessName: menu.businessName, contactPhone: '' },
  });
});

app.post('/api/businesses/:id/menu', checkBusinessAuth, (req: Request, res: Response): void => {
  const businessId = req.params.id;
  const menuData = req.body as DigitalMenu;

  if (!menuData || !Array.isArray(menuData.categories) || !Array.isArray(menuData.items)) {
    res.status(400).json({ error: 'Invalid menu structure. Categories and items arrays are required.' });
    return;
  }

  const prevMenu = inMemoryMenus[businessId];
  menuData.businessId = businessId;
  menuData.lastUpdated = new Date().toISOString();

  inMemoryMenus[businessId] = menuData;
  try {
    writeAtomicJsonSync(MENUS_FILE, inMemoryMenus);
  } catch (err) {
    inMemoryMenus[businessId] = prevMenu;
    res.status(500).json({ error: 'Storage persistence failure: menu could not be saved.' });
    return;
  }

  res.json({ success: true, menu: menuData });
});

// 5. Customer Feedback System (Rate Limited & Validated)
app.post('/api/feedback', (req: Request, res: Response): void => {
  const clientIp = getClientIp(req);
  const limitCheck = feedbackLimiter.isAllowed(clientIp);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: `Too many submissions. Please wait ${limitCheck.retryAfterSeconds} seconds.` });
    return;
  }

  const { businessId, rating, tags, comment, customerName, customerPhone, marketingConsent } = req.body;

  if (!businessId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Valid business ID and numeric rating (1-5) are required' });
    return;
  }

  const cleanPhone = customerPhone ? normalizeIndianPhone(customerPhone) : undefined;
  if (cleanPhone && cleanPhone.length > 0 && !isValidIndianPhone(cleanPhone)) {
    res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number' });
    return;
  }

  const newFeedback: FeedbackSubmission = {
    id: `fb-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    businessId: sanitizeString(businessId, 60),
    rating: Math.round(rating),
    tags: Array.isArray(tags) ? tags.map((t) => sanitizeString(t, 40)).slice(0, 8) : [],
    comment: sanitizeString(comment, 500),
    customerName: sanitizeString(customerName, 80) || undefined,
    customerPhone: cleanPhone,
    marketingConsent: Boolean(marketingConsent),
    createdAt: new Date().toISOString(),
  };

  inMemoryFeedback.unshift(newFeedback);
  try {
    writeAtomicJsonSync(FEEDBACK_FILE, inMemoryFeedback);
  } catch (err) {
    inMemoryFeedback.shift();
    res.status(500).json({ error: 'Storage persistence failure: feedback could not be saved.' });
    return;
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! The management has received it.',
    feedbackId: newFeedback.id,
  });
});

// Protected: Only business owner or admin may view customer feedback inbox
app.get('/api/businesses/:id/feedback', checkBusinessAuth, (req: Request, res: Response): void => {
  const businessId = req.params.id;
  const list = inMemoryFeedback.filter((f) => f.businessId === businessId);
  const avgRating = list.length > 0 ? list.reduce((sum, f) => sum + f.rating, 0) / list.length : 5.0;

  res.json({
    feedback: list,
    stats: {
      total: list.length,
      averageRating: parseFloat(avgRating.toFixed(1)),
      breakdown: {
        5: list.filter((f) => f.rating === 5).length,
        4: list.filter((f) => f.rating === 4).length,
        3: list.filter((f) => f.rating === 3).length,
        2: list.filter((f) => f.rating === 2).length,
        1: list.filter((f) => f.rating === 1).length,
      },
    },
  });
});

// 6. Fraud-Safe Customer Loyalty System
app.get('/api/loyalty/config/:businessId', (req: Request, res: Response): void => {
  const businessId = req.params.businessId;
  let config = inMemoryLoyalty.configs[businessId];
  if (!config) {
    const { code, expiresAt } = generateDailyCheckinCode();
    config = {
      businessId,
      enabled: true,
      pointsPerVisit: 10,
      minHoursBetweenVisits: 12,
      staffPin: generateStaffPin(),
      dailyCheckinCode: code,
      dailyCodeExpiresAt: expiresAt,
      rewards: [],
    };
    inMemoryLoyalty.configs[businessId] = config;
  }

  config = ensureFreshDailyCode(config);
  inMemoryLoyalty.configs[businessId] = config;

  const clientBizKey = req.headers['x-business-key'] as string;
  const adminToken = req.headers['x-admin-token'] as string;
  const business = inMemoryBusinesses[businessId];
  const isOwner = Boolean(clientBizKey && business?.ownerKey && safeCompare(clientBizKey, business.ownerKey));
  const isAdmin = validateAdminSession(adminToken);

  if (isOwner || isAdmin) {
    res.json(config);
  } else {
    // Sanitize config for public patron: do NOT leak staffPin
    res.json({
      businessId: config.businessId,
      enabled: config.enabled,
      pointsPerVisit: config.pointsPerVisit,
      minHoursBetweenVisits: config.minHoursBetweenVisits,
      rewards: config.rewards,
      dailyCodeExpiresAt: config.dailyCodeExpiresAt,
    });
  }
});

app.post('/api/loyalty/config/:businessId', checkBusinessAuth, (req: Request, res: Response): void => {
  const businessId = req.params.businessId;
  const newConfig = req.body as LoyaltyConfig;

  if (!newConfig || typeof newConfig.pointsPerVisit !== 'number' || newConfig.pointsPerVisit <= 0) {
    res.status(400).json({ error: 'Valid pointsPerVisit (greater than 0) is required.' });
    return;
  }

  const existingConfig = inMemoryLoyalty.configs[businessId];
  const staffPin = newConfig.staffPin
    ? String(newConfig.staffPin).trim().replace(/[^0-9]/g, '').slice(0, 8)
    : (existingConfig?.staffPin || generateStaffPin());

  const prevConfig = inMemoryLoyalty.configs[businessId];
  const updatedConfig: LoyaltyConfig = {
    ...existingConfig,
    ...newConfig,
    businessId,
    staffPin,
  };

  inMemoryLoyalty.configs[businessId] = updatedConfig;
  try {
    writeAtomicJsonSync(LOYALTY_FILE, inMemoryLoyalty);
  } catch (err) {
    inMemoryLoyalty.configs[businessId] = prevConfig;
    res.status(500).json({ error: 'Storage persistence failure: loyalty settings could not be saved.' });
    return;
  }

  res.json({ success: true, config: updatedConfig });
});

// Customer Wallet Lookup (Protected: Requires Verified Customer Wallet Token OR In-Store Staff Verification)
app.get('/api/loyalty/customer', (req: Request, res: Response): void => {
  const businessId = req.query.businessId as string;
  const rawPhone = sanitizePhone(req.query.phone);

  if (!businessId || !rawPhone || !isValidIndianPhone(rawPhone)) {
    res.status(400).json({ error: 'Valid business ID and 10-digit Indian mobile number are required' });
    return;
  }

  const clientPhone = normalizeIndianPhone(rawPhone);
  const config = inMemoryLoyalty.configs[businessId];
  if (!config) {
    res.status(404).json({ error: 'Loyalty program not found for this business' });
    return;
  }

  const businessWallets = inMemoryLoyalty.wallets[businessId] || {};
  const wallet = businessWallets[clientPhone];

  // Authorization Check:
  // 1. Admin session
  const adminToken = req.headers['x-admin-token'] as string;
  const isAdmin = validateAdminSession(adminToken);

  // 2. Business Owner key (x-business-key)
  const clientBizKey = req.headers['x-business-key'] as string;
  const business = inMemoryBusinesses[businessId];
  const isOwner = Boolean(clientBizKey && business?.ownerKey && safeCompare(clientBizKey, business.ownerKey));

  // 3. Staff PIN (x-staff-pin or ?staffPin=)
  const clientStaffPin = (req.headers['x-staff-pin'] as string) || (req.query.staffPin as string);
  const isStaff = Boolean(clientStaffPin && config.staffPin && safeCompare(String(clientStaffPin).trim(), config.staffPin));

  // 4. Customer Wallet Token (x-wallet-token or ?token=)
  const clientWalletToken = (req.headers['x-wallet-token'] as string) || (req.query.token as string);
  const isCustomerTokenValid = Boolean(
    clientWalletToken && wallet?.walletToken && safeCompare(clientWalletToken, wallet.walletToken)
  );

  // Phone alone MUST NOT authorize access to personal customer balance & history
  if (!isAdmin && !isOwner && !isStaff && !isCustomerTokenValid) {
    res.status(403).json({
      error: 'Customer wallet verification required. Present your in-store daily check-in code or have staff verify your visit.',
      code: 'WALLET_AUTH_REQUIRED',
    });
    return;
  }

  const pointsBalance = wallet?.pointsBalance || 0;
  const totalVisits = wallet?.totalVisits || 0;
  const recentHistory = inMemoryLoyalty.ledger
    .filter((l) => l.businessId === businessId && l.customerPhone === clientPhone)
    .slice(0, 10);

  const eligibleRewards = (config.rewards || []).filter(
    (r) => r.isActive && pointsBalance >= r.pointsRequired
  );

  const customerData: CustomerLoyaltyWallet = {
    phone: clientPhone,
    name: wallet?.name,
    pointsBalance,
    totalVisits,
    lastVisitAt: wallet?.lastVisitAt,
    walletToken: isCustomerTokenValid ? wallet?.walletToken : undefined,
    eligibleRewards,
    recentHistory,
  };

  res.json(customerData);
});

// Fraud-Safe Visit Check-in (Atomic Lock, Rate Limiting, Idempotency, Rotating Code)
app.post('/api/loyalty/checkin', async (req: Request, res: Response): Promise<void> => {
  const clientIp = getClientIp(req);
  const { businessId, phone, customerName, staffPin, dailyCode, idempotencyKey } = req.body;
  const rawPhone = sanitizePhone(phone);

  if (!businessId || !rawPhone || !isValidIndianPhone(rawPhone)) {
    res.status(400).json({ error: 'Valid 10-digit Indian customer mobile number is required' });
    return;
  }

  const cleanPhone = normalizeIndianPhone(rawPhone);

  // Rate Limiting on Check-in Attempts
  const limitCheck = loyaltyCheckinLimiter.isAllowed(`${clientIp}:${cleanPhone}`);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: `Too many check-in attempts. Please wait ${limitCheck.retryAfterSeconds}s.` });
    return;
  }

  let config = inMemoryLoyalty.configs[businessId];
  if (!config) {
    res.status(404).json({ error: 'Loyalty program not found for this business' });
    return;
  }

  config = ensureFreshDailyCode(config);
  inMemoryLoyalty.configs[businessId] = config;

  if (!config.enabled) {
    res.status(400).json({ error: 'Loyalty programme is currently paused by this business' });
    return;
  }

  // Atomic Wallet Lock per Customer
  const lockKey = `${businessId}:${cleanPhone}`;
  await withWalletLock(lockKey, async () => {
    // Idempotency check: if request was already processed, return existing result
    if (idempotencyKey) {
      const existing = inMemoryLoyalty.ledger.find(
        (l) => l.businessId === businessId && l.customerPhone === cleanPhone && l.idempotencyKey === idempotencyKey
      );
      if (existing) {
        const wallet = inMemoryLoyalty.wallets[businessId]?.[cleanPhone] || { pointsBalance: 0, totalVisits: 0 };
        res.json({
          success: true,
          pointsAwarded: existing.pointsChange,
          newBalance: wallet.pointsBalance,
          totalVisits: wallet.totalVisits,
          walletToken: wallet.walletToken,
          message: 'Check-in already recorded (idempotent)',
        });
        return;
      }
    }

    // Verify Authorization: Verified Staff PIN OR Active Daily Rotating Code
    const isStaffVerified = Boolean(staffPin && safeCompare(String(staffPin).trim(), config.staffPin));
    const now = Date.now();
    const isCodeNotExpired = config.dailyCodeExpiresAt && new Date(config.dailyCodeExpiresAt).getTime() > now;
    const isDailyCodeValid = Boolean(dailyCode && isCodeNotExpired && safeCompare(String(dailyCode).trim(), config.dailyCheckinCode));

    if (!isStaffVerified && !isDailyCodeValid) {
      res.status(403).json({
        error: 'Invalid authorization. Please have staff enter their PIN or use the active daily store code.',
      });
      return;
    }

    // Verify Interval: Minimum hours between check-ins
    if (!inMemoryLoyalty.wallets[businessId]) {
      inMemoryLoyalty.wallets[businessId] = {};
    }
    const wallet = inMemoryLoyalty.wallets[businessId][cleanPhone] || {
      phone: cleanPhone,
      name: sanitizeString(customerName, 80) || undefined,
      pointsBalance: 0,
      totalVisits: 0,
      walletToken: generateWalletToken(),
    };

    if (!wallet.walletToken) {
      wallet.walletToken = generateWalletToken();
    }

    if (wallet.lastVisitAt) {
      const hoursSinceLast = (Date.now() - new Date(wallet.lastVisitAt).getTime()) / (1000 * 3600);
      const minHours = config.minHoursBetweenVisits || 12;
      if (hoursSinceLast < minHours && !isStaffVerified) {
        res.status(429).json({
          error: `Only 1 check-in allowed every ${minHours} hours. Your last check-in was ${hoursSinceLast.toFixed(1)} hours ago.`,
        });
        return;
      }
    }

    // Award Points
    const pointsAwarded = Math.max(1, config.pointsPerVisit || 10);
    wallet.pointsBalance += pointsAwarded;
    wallet.totalVisits += 1;
    wallet.lastVisitAt = new Date().toISOString();
    if (customerName) wallet.name = sanitizeString(customerName, 80);

    inMemoryLoyalty.wallets[businessId][cleanPhone] = wallet;

    // Append to Auditable Ledger
    const ledgerEntry = {
      id: `led-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId,
      customerPhone: cleanPhone,
      customerName: wallet.name,
      type: 'visit_award' as const,
      pointsChange: pointsAwarded,
      staffVerified: isStaffVerified,
      note: isStaffVerified ? 'Verified by staff PIN' : 'Verified via daily store code',
      idempotencyKey: idempotencyKey ? String(idempotencyKey).slice(0, 64) : undefined,
      createdAt: new Date().toISOString(),
    };

    inMemoryLoyalty.ledger.unshift(ledgerEntry);

    // Track analytics
    if (!inMemoryAnalytics[businessId]) {
      inMemoryAnalytics[businessId] = { scans: 0, menuViews: 0, visits: 0 };
    }
    inMemoryAnalytics[businessId].visits += 1;

    try {
      writeAtomicJsonSync(LOYALTY_FILE, inMemoryLoyalty);
      writeAtomicJsonSync(ANALYTICS_FILE, inMemoryAnalytics);
    } catch (err) {
      // Rollback on storage failure to ensure consistency
      wallet.pointsBalance -= pointsAwarded;
      wallet.totalVisits -= 1;
      inMemoryLoyalty.ledger.shift();
      inMemoryAnalytics[businessId].visits -= 1;
      res.status(500).json({ error: 'Storage persistence failure: check-in could not be recorded.' });
      return;
    }

    res.json({
      success: true,
      pointsAwarded,
      newBalance: wallet.pointsBalance,
      totalVisits: wallet.totalVisits,
      walletToken: wallet.walletToken,
      message: `🎉 Success! +${pointsAwarded} points added. New balance: ${wallet.pointsBalance} pts!`,
    });
  });
});

// Reward Redemption (Requires Staff PIN, Atomic Lock, Double-Spending & Negative Balance Prevention)
app.post('/api/loyalty/redeem', async (req: Request, res: Response): Promise<void> => {
  const { businessId, phone, rewardId, staffPin, idempotencyKey } = req.body;
  const rawPhone = sanitizePhone(phone);

  if (!businessId || !rawPhone || !rewardId) {
    res.status(400).json({ error: 'Business ID, phone, and reward ID are required' });
    return;
  }

  const cleanPhone = normalizeIndianPhone(rawPhone);

  const config = inMemoryLoyalty.configs[businessId];
  if (!config) {
    res.status(404).json({ error: 'Loyalty program not found for this business' });
    return;
  }

  if (!staffPin || !safeCompare(String(staffPin).trim(), config.staffPin)) {
    res.status(403).json({ error: 'Staff verification PIN is required to complete reward redemption' });
    return;
  }

  const reward = (config.rewards || []).find((r) => r.id === rewardId);
  if (!reward || !reward.isActive) {
    res.status(404).json({ error: 'Reward not found or inactive' });
    return;
  }

  const lockKey = `${businessId}:${cleanPhone}`;
  await withWalletLock(lockKey, async () => {
    // Idempotency check
    if (idempotencyKey) {
      const existing = inMemoryLoyalty.ledger.find(
        (l) => l.businessId === businessId && l.customerPhone === cleanPhone && l.idempotencyKey === idempotencyKey
      );
      if (existing) {
        const wallet = inMemoryLoyalty.wallets[businessId]?.[cleanPhone] || { pointsBalance: 0 };
        res.json({
          success: true,
          receiptCode: 'RDM-REPLAY',
          rewardTitle: existing.rewardTitle,
          pointsDeducted: Math.abs(existing.pointsChange),
          remainingBalance: wallet.pointsBalance,
          message: 'Redemption already recorded (idempotent)',
        });
        return;
      }
    }

    const businessWallets = inMemoryLoyalty.wallets[businessId] || {};
    const wallet = businessWallets[cleanPhone];

    if (!wallet || wallet.pointsBalance < reward.pointsRequired) {
      res.status(400).json({
        error: `Insufficient points. You have ${wallet ? wallet.pointsBalance : 0} pts, but this reward requires ${reward.pointsRequired} pts.`,
      });
      return;
    }

    // Invariant: Balance must NEVER drop below zero
    if (wallet.pointsBalance - reward.pointsRequired < 0) {
      res.status(400).json({ error: 'Illegal transaction: balance cannot be negative' });
      return;
    }

    // Deduct Points
    wallet.pointsBalance -= reward.pointsRequired;
    inMemoryLoyalty.wallets[businessId][cleanPhone] = wallet;

    // Append Redemption to Auditable Ledger
    const receiptCode = `RDM-${Math.floor(100000 + Math.random() * 900000)}`;
    const ledgerEntry = {
      id: `led-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      businessId,
      customerPhone: cleanPhone,
      customerName: wallet.name,
      type: 'reward_redemption' as const,
      pointsChange: -reward.pointsRequired,
      rewardTitle: reward.title,
      staffVerified: true,
      note: `Redeemed: ${reward.title} (Receipt: ${receiptCode})`,
      idempotencyKey: idempotencyKey ? String(idempotencyKey).slice(0, 64) : undefined,
      createdAt: new Date().toISOString(),
    };

    inMemoryLoyalty.ledger.unshift(ledgerEntry);

    try {
      writeAtomicJsonSync(LOYALTY_FILE, inMemoryLoyalty);
    } catch (err) {
      // Rollback
      wallet.pointsBalance += reward.pointsRequired;
      inMemoryLoyalty.ledger.shift();
      res.status(500).json({ error: 'Storage persistence failure: redemption could not be recorded.' });
      return;
    }

    res.json({
      success: true,
      receiptCode,
      rewardTitle: reward.title,
      pointsDeducted: reward.pointsRequired,
      remainingBalance: wallet.pointsBalance,
      message: `🎉 Reward "${reward.title}" redeemed! Please hand this treat to the customer.`,
    });
  });
});

// 7. Business Analytics Endpoint (Protected)
app.get('/api/analytics/:businessId', checkBusinessAuth, (req: Request, res: Response): void => {
  const businessId = req.params.businessId;
  const storeAnalytics = inMemoryAnalytics[businessId] || { scans: 0, menuViews: 0, visits: 0 };

  const feedbackList = inMemoryFeedback.filter((f) => f.businessId === businessId);
  const avgRating = feedbackList.length > 0
    ? feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length
    : 5.0;

  const businessLedger = inMemoryLoyalty.ledger.filter((l) => l.businessId === businessId);
  const pointsIssued = businessLedger
    .filter((l) => l.type === 'visit_award')
    .reduce((sum, l) => sum + l.pointsChange, 0);

  const rewardsRedeemed = businessLedger.filter((l) => l.type === 'reward_redemption').length;

  const recentActivity = [
    ...feedbackList.slice(0, 4).map((f) => ({
      id: f.id,
      type: 'feedback' as const,
      label: `New ${f.rating}★ rating from ${f.customerName || 'Customer'}`,
      timestamp: f.createdAt,
    })),
    ...businessLedger.slice(0, 4).map((l) => ({
      id: l.id,
      type: (l.type === 'reward_redemption' ? 'redeem' : 'visit') as ('redeem' | 'visit'),
      label: l.type === 'reward_redemption' ? `Redeemed: ${l.rewardTitle}` : `Visit check-in by ${l.customerPhone.slice(0, 2)}******${l.customerPhone.slice(-2)}`,
      timestamp: l.createdAt,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

  const summary: AnalyticsSummary = {
    businessId,
    totalQrScans: storeAnalytics.scans + storeAnalytics.menuViews,
    totalMenuViews: storeAnalytics.menuViews,
    totalFeedbackCount: feedbackList.length,
    averageRating: parseFloat(avgRating.toFixed(1)),
    totalLoyaltyVisits: storeAnalytics.visits,
    totalPointsIssued: pointsIssued,
    totalRewardsRedeemed: rewardsRedeemed,
    recentActivity,
  };

  res.json(summary);
});

// Analytics Tracking Endpoint (Public, Sanitized Event Types)
app.post('/api/analytics/track', (req: Request, res: Response): void => {
  const { businessId, eventType } = req.body;
  if (!businessId || typeof businessId !== 'string') {
    res.status(400).json({ error: 'Valid businessId is required' });
    return;
  }

  if (eventType !== 'qr_scan' && eventType !== 'menu_view') {
    res.status(400).json({ error: 'Invalid eventType' });
    return;
  }

  if (!inMemoryAnalytics[businessId]) {
    inMemoryAnalytics[businessId] = { scans: 0, menuViews: 0, visits: 0 };
  }

  if (eventType === 'qr_scan') {
    inMemoryAnalytics[businessId].scans += 1;
  } else if (eventType === 'menu_view') {
    inMemoryAnalytics[businessId].menuViews += 1;
  }

  try {
    writeAtomicJsonSync(ANALYTICS_FILE, inMemoryAnalytics);
  } catch (e) {
    // Non-fatal
  }
  res.json({ success: true });
});

// 8. Public API Integration (TheMealDB - Food & Dish Auto-Search)
app.get('/api/integrations/food-search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = sanitizeString(req.query.query, 60);
    if (!query) {
      res.json({ results: [] });
      return;
    }

    const apiUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      res.json({ results: [] });
      return;
    }

    const data = await response.json();
    const meals = (data.meals || []).slice(0, 5).map((m: any) => ({
      name: sanitizeString(m.strMeal, 80),
      category: sanitizeString(m.strCategory, 50),
      area: sanitizeString(m.strArea, 50),
      description: m.strInstructions ? sanitizeString(m.strInstructions, 150) + '...' : '',
      thumbnail: m.strMealThumb,
    }));

    res.json({ results: meals });
  } catch (err: any) {
    console.error('TheMealDB API error:', err);
    res.json({ results: [] });
  }
});

// 9. Promotional Kit Generation (Gemini AI with model gemini-3.8-flash)
app.post('/api/generate-promo-kit', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = getClientIp(req);
    const limitCheck = promoGenerationLimiter.isAllowed(clientIp);
    if (!limitCheck.allowed) {
      res.status(429).json({ error: `Promotional kit rate limit exceeded. Please wait ${limitCheck.retryAfterSeconds}s.` });
      return;
    }

    const profile = req.body as BusinessProfile;
    if (!profile.businessName || !profile.category) {
      res.status(400).json({ error: 'Business name and category are required.' });
      return;
    }

    const langName =
      profile.preferredLanguage === 'hindi'
        ? 'Hindi (Shuddh/Colloquial)'
        : profile.preferredLanguage === 'hinglish'
        ? 'Hinglish (Hindi words written in English alphabet)'
        : 'Indian English';

    const safeBizName = sanitizeString(profile.businessName, 80);
    const safeCategory = sanitizeString(profile.category, 50);

    if (aiClient) {
      try {
        const prompt = `You are DukaanBoost AI, an expert retail growth copywriter and marketing director for local Indian neighborhood small businesses.
Create a complete high-converting promotional marketing campaign kit for the following business:
- Business Name: ${safeBizName}
- Category: ${safeCategory}
- City / Area: ${sanitizeString(profile.city, 60) || 'Local neighborhood'}
- Core Offerings: ${sanitizeString(profile.productsServices, 250) || 'Local specialties'}
- Target Audience: ${sanitizeString(profile.targetAudience, 150) || 'Local community customers'}
- Campaign Goal: ${sanitizeString(profile.promotionObjective, 50) || 'more footfall & orders'}
- Active Deal / Discount: ${sanitizeString(profile.offerDiscount, 100) || 'Special limited time offer'}
- Preferred Language: ${langName}

Return a valid JSON object matching this schema:
{
  "headlines": ["3 catchy, local-flavored headlines"],
  "whatsappMessages": [
    {
      "title": "Short descriptive label",
      "objective": "Campaign intent",
      "text": "Full WhatsApp broadcast message with emojis, urgency, and clear CTA"
    }
  ],
  "captions": [
    {
      "hook": "Attention-grabbing opening sentence",
      "text": "Engaging caption copy",
      "hashtags": "Space-separated hashtags"
    }
  ],
  "hashtags": ["10 high-reach regional and category hashtags"],
  "offerIdeas": [
    {
      "title": "Creative offer name",
      "howItWorks": "Simple mechanics for the shopkeeper",
      "marginTip": "Profitability guidance",
      "bestFor": "Footfall / Repeat sales"
    }
  ],
  "ctaMessage": "Direct call to action",
  "posterConfig": {
    "headline": "Short punchy header for graphic poster",
    "subheadline": "Secondary supporting line",
    "offerBadge": "Highlighted badge text",
    "bulletPoints": ["3 short bullet points"],
    "callToAction": "Call or WhatsApp today",
    "disclaimer": "Terms apply"
  }
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          const finalKit: PromoKit = {
            businessName: safeBizName,
            category: safeCategory,
            language: profile.preferredLanguage,
            headlines: parsed.headlines || [],
            whatsappMessages: parsed.whatsappMessages || [],
            captions: parsed.captions || [],
            hashtags: parsed.hashtags || [],
            offerIdeas: parsed.offerIdeas || [],
            ctaMessage: parsed.ctaMessage || `Call/WhatsApp ${profile.contactPhone || safeBizName} to order now!`,
            posterConfig: {
              headline: parsed.posterConfig?.headline || safeBizName.toUpperCase(),
              subheadline: parsed.posterConfig?.subheadline || profile.productsServices || 'Special Offer',
              offerBadge: parsed.posterConfig?.offerBadge || profile.offerDiscount || 'LIMITED TIME OFFER',
              bulletPoints: parsed.posterConfig?.bulletPoints || [
                'Premium Quality & Fresh Preparation',
                'Best Prices Guaranteed in Town',
                'Doorstep Delivery & Takeaway Available',
              ],
              callToAction: parsed.posterConfig?.callToAction || 'ORDER VIA WHATSAPP TODAY',
              phone: profile.contactPhone || 'Contact Us Today',
              location: profile.city || 'Local Store',
              disclaimer: parsed.posterConfig?.disclaimer || '*Terms & Conditions Apply.',
            },
            generatedAt: new Date().toISOString(),
          };

          res.json({ kit: finalKit, source: 'gemini-3.8-flash' });
          return;
        }
      } catch (geminiError) {
        console.error('Gemini API call failure, using fallback template:', geminiError);
      }
    }

    // Fallback template
    const fallbackTemplate = SAMPLE_BUSINESS_PROFILES[profile.category as string] || SAMPLE_BUSINESS_PROFILES['cafe'];
    res.json({ kit: fallbackTemplate.kit, source: 'smart_engine' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate promotional kit.' });
  }
});

// 10. Orders & Manual UPI Checkout (Unguessable IDs, Access Token, Customer Authorization)
app.post('/api/orders', (req: Request, res: Response): void => {
  try {
    const clientIp = getClientIp(req);
    const limitCheck = orderCreationLimiter.isAllowed(clientIp);
    if (!limitCheck.allowed) {
      res.status(429).json({ error: `Order creation limit reached. Please wait ${limitCheck.retryAfterSeconds}s.` });
      return;
    }

    const { packageType, customerName, customerPhone, customerEmail, businessDetails, specialNotes, upiTransactionRef } = req.body;

    if (!packageType || !customerName || !customerPhone) {
      res.status(400).json({ error: 'Package type, customer name, and customer mobile number are required.' });
      return;
    }

    const rawPhone = sanitizePhone(customerPhone);
    if (!isValidIndianPhone(rawPhone)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian customer mobile number.' });
      return;
    }

    const cleanPhone = normalizeIndianPhone(rawPhone);

    let amount = currentSettings.starterPackPrice || 99;
    let packageTitle = 'Starter Promotional Pack';

    if (packageType === 'founding_setup') {
      amount = currentSettings.foundingSetupPrice || 249;
      packageTitle = 'Founding Business Setup (Done-for-you QR & Menu)';
    } else if (packageType === 'business') {
      amount = currentSettings.businessPackPrice || 199;
      packageTitle = 'Business Growth Pack (3 Variations)';
    } else if (packageType === 'menu_setup') {
      amount = currentSettings.menuSetupPrice || 299;
      packageTitle = 'Digital Menu & Tabletop QR Setup';
    }

    const orderId = generateUnguessableOrderId();
    const orderAccessToken = generateAccessToken();

    const newOrder: Order = {
      id: orderId,
      packageType: packageType as PackageType,
      packageTitle,
      amount,
      customerName: sanitizeString(customerName, 80),
      customerPhone: cleanPhone,
      customerEmail: sanitizeString(customerEmail, 100) || undefined,
      businessDetails: businessDetails || {},
      specialNotes: sanitizeString(specialNotes, 300) || undefined,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      upiTransactionRef: sanitizeUpiRef(upiTransactionRef) || undefined,
      orderAccessToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryOrders.unshift(newOrder);

    try {
      writeAtomicJsonSync(ORDERS_FILE, inMemoryOrders);
    } catch (err) {
      inMemoryOrders.shift();
      res.status(500).json({ error: 'Failed to persist order record.' });
      return;
    }

    res.status(201).json({
      success: true,
      order: {
        ...newOrder,
        orderAccessToken: undefined, // Do not expose token inside order object
      },
      orderAccessToken, // Return once explicitly to the customer on creation
      sellerUpiId: currentSettings.sellerUpiId,
      sellerWhatsApp: currentSettings.sellerWhatsApp,
      message: 'Order created successfully. Manual payment verification pending.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// Submit UPI Reference (Restricted to Customer with Valid Order Access Token; Never Trust Phone-Only)
app.post('/api/orders/:id/submit-upi-ref', (req: Request, res: Response): void => {
  const orderId = req.params.id;
  const { upiTransactionRef, token } = req.body;

  const orderIndex = inMemoryOrders.findIndex((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const order = inMemoryOrders[orderIndex];
  const clientToken = (req.headers['x-order-token'] as string) || token;
  const adminToken = req.headers['x-admin-token'] as string;
  const isAdmin = validateAdminSession(adminToken);

  const hasValidToken = Boolean(clientToken && order.orderAccessToken && safeCompare(clientToken, order.orderAccessToken));

  // Phone-only submissions are strictly forbidden
  if (!isAdmin && !hasValidToken) {
    res.status(403).json({ error: 'Forbidden. Valid customer order access token required to update this order.' });
    return;
  }

  const cleanRef = sanitizeUpiRef(upiTransactionRef);
  if (!cleanRef || cleanRef.length < 6) {
    res.status(400).json({ error: 'Valid UPI transaction reference (minimum 6 characters) is required.' });
    return;
  }

  const prevRef = order.upiTransactionRef;
  const prevUpdatedAt = order.updatedAt;

  order.upiTransactionRef = cleanRef;
  order.updatedAt = new Date().toISOString();
  // Payment status strictly remains pending until verified by authorized seller/staff
  order.paymentStatus = 'pending';

  try {
    writeAtomicJsonSync(ORDERS_FILE, inMemoryOrders);
  } catch (err) {
    order.upiTransactionRef = prevRef;
    order.updatedAt = prevUpdatedAt;
    res.status(500).json({ error: 'Failed to save UPI reference due to storage failure.' });
    return;
  }

  res.json({
    success: true,
    message: 'UPI reference saved. Seller will verify against bank records before confirming.',
    orderId: order.id,
    paymentStatus: order.paymentStatus,
  });
});

// Customer-Scoped Order Lookup (Requires Order Access Token; Phone-Only Lookups Strictly Forbidden)
app.get('/api/orders/:id', (req: Request, res: Response): void => {
  const orderId = req.params.id;
  const order = inMemoryOrders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const adminToken = req.headers['x-admin-token'] as string;
  const isAdmin = validateAdminSession(adminToken);

  const clientToken = (req.headers['x-order-token'] as string) || (req.query.token as string);
  const hasValidToken = Boolean(clientToken && order.orderAccessToken && safeCompare(clientToken, order.orderAccessToken));

  if (!isAdmin && !hasValidToken) {
    // If public minimal tracking status is requested
    if (req.query.public === 'true') {
      res.json({
        id: order.id,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
      });
      return;
    }

    // Phone-only access is rejected with 403 Forbidden
    res.status(403).json({
      error: 'Customer order access token is required to view order details. Phone-only access is not permitted for privacy and security.',
    });
    return;
  }

  // Return privacy-masked details to authorized viewer
  const maskedPhone = order.customerPhone ? order.customerPhone.slice(0, 2) + '******' + order.customerPhone.slice(-2) : '';
  const maskedUpi = order.upiTransactionRef ? order.upiTransactionRef.slice(0, 3) + '****' + order.upiTransactionRef.slice(-3) : '';

  res.json({
    id: order.id,
    packageType: order.packageType,
    packageTitle: order.packageTitle,
    amount: order.amount,
    customerName: order.customerName,
    customerPhoneMasked: maskedPhone,
    businessName: order.businessDetails?.businessName || '',
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    upiTransactionRef: maskedUpi,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});

// 11. Admin Endpoints (Expiring Sessions, Login Rate Limiting, Logout)
app.post('/api/admin/login', (req: Request, res: Response): void => {
  const clientIp = getClientIp(req);

  // Rate Limiting on Admin Login
  const limitCheck = loginLimiter.isAllowed(clientIp);
  if (!limitCheck.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. Locked out for ${limitCheck.retryAfterSeconds} seconds.`,
    });
    return;
  }

  const { passcode } = req.body;
  const expectedPasscode = getActiveAdminPasscode();

  if (!passcode || typeof passcode !== 'string' || !safeCompare(passcode, expectedPasscode)) {
    res.status(401).json({ error: 'Invalid admin passcode.' });
    return;
  }

  // Reset failed attempts on success
  loginLimiter.reset(clientIp);

  // Create cryptographically random expiring session
  const token = createAdminSession(clientIp);

  res.json({
    success: true,
    token,
    sellerWhatsApp: currentSettings.sellerWhatsApp,
  });
});

app.post('/api/admin/logout', checkAdminAuth, (req: Request, res: Response): void => {
  const token = req.headers['x-admin-token'] as string;
  invalidateAdminSession(token);
  res.json({ success: true, message: 'Admin session invalidated successfully.' });
});

app.get('/api/admin/orders', checkAdminAuth, (req: Request, res: Response): void => {
  // Sanitize orders in admin list: do not expose customer orderAccessToken
  const safeOrders = inMemoryOrders.map((o) => ({
    ...o,
    orderAccessToken: undefined,
  }));

  res.json({
    orders: safeOrders,
    stats: {
      totalOrders: inMemoryOrders.length,
      pendingPayment: inMemoryOrders.filter((o) => o.paymentStatus === 'pending').length,
      verifiedOrders: inMemoryOrders.filter((o) => o.paymentStatus === 'verified').length,
      completedOrders: inMemoryOrders.filter((o) => o.fulfillmentStatus === 'completed').length,
      totalGrossSales: inMemoryOrders
        .filter((o) => o.paymentStatus === 'verified')
        .reduce((sum, o) => sum + (o.amount || 0), 0),
    },
  });
});

app.patch('/api/admin/orders/:id', checkAdminAuth, (req: Request, res: Response): void => {
  const orderId = req.params.id;
  const { paymentStatus, fulfillmentStatus, adminNotes } = req.body;

  const orderIndex = inMemoryOrders.findIndex((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const prevOrder = { ...inMemoryOrders[orderIndex] };

  if (paymentStatus && ['pending', 'verified', 'rejected'].includes(paymentStatus)) {
    inMemoryOrders[orderIndex].paymentStatus = paymentStatus;
  }
  if (fulfillmentStatus && ['pending', 'in_progress', 'completed'].includes(fulfillmentStatus)) {
    inMemoryOrders[orderIndex].fulfillmentStatus = fulfillmentStatus;
  }
  if (adminNotes !== undefined) {
    inMemoryOrders[orderIndex].adminNotes = sanitizeString(adminNotes, 500);
  }

  inMemoryOrders[orderIndex].updatedAt = new Date().toISOString();

  try {
    writeAtomicJsonSync(ORDERS_FILE, inMemoryOrders);
  } catch (err) {
    inMemoryOrders[orderIndex] = prevOrder;
    res.status(500).json({ error: 'Storage persistence failure: order status could not be updated.' });
    return;
  }

  res.json({
    success: true,
    order: {
      ...inMemoryOrders[orderIndex],
      orderAccessToken: undefined,
    },
  });
});

app.get('/api/admin/settings', checkAdminAuth, (req: Request, res: Response): void => {
  res.json(currentSettings);
});

app.post('/api/admin/settings', checkAdminAuth, (req: Request, res: Response): void => {
  const updates = req.body as Partial<StoreSettings>;
  const prevSettings = { ...currentSettings };

  currentSettings = {
    ...currentSettings,
    sellerUpiId: updates.sellerUpiId ? sanitizeString(updates.sellerUpiId, 50) : currentSettings.sellerUpiId,
    sellerName: updates.sellerName ? sanitizeString(updates.sellerName, 80) : currentSettings.sellerName,
    sellerWhatsApp: updates.sellerWhatsApp ? sanitizePhone(updates.sellerWhatsApp) : currentSettings.sellerWhatsApp,
    foundingSetupPrice: typeof updates.foundingSetupPrice === 'number' ? updates.foundingSetupPrice : currentSettings.foundingSetupPrice,
    starterPackPrice: typeof updates.starterPackPrice === 'number' ? updates.starterPackPrice : currentSettings.starterPackPrice,
    businessPackPrice: typeof updates.businessPackPrice === 'number' ? updates.businessPackPrice : currentSettings.businessPackPrice,
    menuSetupPrice: typeof updates.menuSetupPrice === 'number' ? updates.menuSetupPrice : currentSettings.menuSetupPrice,
    acceptingOrders: updates.acceptingOrders !== undefined ? Boolean(updates.acceptingOrders) : currentSettings.acceptingOrders,
    announcementText: updates.announcementText ? sanitizeString(updates.announcementText, 250) : currentSettings.announcementText,
  };

  try {
    writeAtomicJsonSync(SETTINGS_FILE, currentSettings);
  } catch (err) {
    currentSettings = prevSettings;
    res.status(500).json({ error: 'Storage persistence failure: settings could not be saved.' });
    return;
  }

  res.json({ success: true, settings: currentSettings });
});

// Global Safe Error Handler to avoid leaking internal server stack traces
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// Vite dev middleware or production static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DukaanBoost AI Security-Remediated Server running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

// Test State Reset Helper
export function resetTestStateForTesting() {
  inMemoryOrders = [];
  inMemoryBusinesses = {};
  inMemoryMenus = {};
  inMemoryFeedback = [];
  inMemoryLoyalty = {
    configs: {},
    wallets: {},
    ledger: [],
  };
  inMemoryAnalytics = {};
  clearAllAdminSessions();
}

export {
  app,
  inMemoryBusinesses,
  inMemoryLoyalty,
  inMemoryOrders,
  inMemoryMenus,
  inMemoryFeedback,
  inMemoryAnalytics,
};
