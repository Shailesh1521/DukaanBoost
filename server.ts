import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'dukaan2026';
const ADMIN_SESSION_SECRET = 'dkb_sec_adm_' + (process.env.ADMIN_SECRET || '9876543210_indian_dukaan_boost');

app.use(express.json({ limit: '10mb' }));

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

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Default Seed Data
const DEFAULT_BUSINESS: BusinessProfile = {
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
  staffPin: '1234',
  createdAt: '2026-10-14T05:00:00.000Z',
};

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

const DEFAULT_LOYALTY: LoyaltyConfig = {
  businessId: 'chai-shai-cafe',
  enabled: true,
  pointsPerVisit: 10,
  minHoursBetweenVisits: 12,
  dailyCheckinCode: '8942',
  dailyCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  staffPin: '1234',
  rewards: [
    { id: 'rew-1', title: 'Free Kulhad Masala Chai', description: 'Enjoy 1 free cup of our signature tea', pointsRequired: 30, isActive: true },
    { id: 'rew-2', title: 'Free Bun Maska or 2 Samosas', description: 'Valid with any tea or beverage order', pointsRequired: 50, isActive: true },
    { id: 'rew-3', title: 'Free Cheese Grilled Sandwich', description: 'Your choice of veg cheese grilled sandwich', pointsRequired: 100, isActive: true },
  ],
};

// In-Memory Storage Cache initialized from files
let inMemoryOrders: Order[] = readJsonFile<Order[]>(ORDERS_FILE, []);
let currentSettings: StoreSettings = readJsonFile<StoreSettings>(SETTINGS_FILE, {
  ...DEFAULT_STORE_SETTINGS,
  foundingSetupPrice: 249,
});
let inMemoryBusinesses: Record<string, BusinessProfile> = readJsonFile<Record<string, BusinessProfile>>(
  BUSINESSES_FILE,
  { 'chai-shai-cafe': DEFAULT_BUSINESS }
);
let inMemoryMenus: Record<string, DigitalMenu> = readJsonFile<Record<string, DigitalMenu>>(
  MENUS_FILE,
  { 'chai-shai-cafe': DEFAULT_MENU }
);
let inMemoryFeedback: FeedbackSubmission[] = readJsonFile<FeedbackSubmission[]>(FEEDBACK_FILE, [
  {
    id: 'fb-seed-1',
    businessId: 'chai-shai-cafe',
    rating: 5,
    tags: ['Food Quality', 'Fast Service', 'Ambience'],
    comment: 'The Masala Kulhad Chai is outstanding! Perfectly spiced and hot. Samosas were super crispy.',
    customerName: 'Aman Sharma',
    customerPhone: '9826011111',
    marketingConsent: true,
    createdAt: '2026-10-14T03:30:00.000Z',
  },
  {
    id: 'fb-seed-2',
    businessId: 'chai-shai-cafe',
    rating: 4,
    tags: ['Pricing', 'Food Quality'],
    comment: 'Great value combo for ₹49. Seating gets crowded during 5-7 PM rush.',
    customerName: 'Priya Joshi',
    createdAt: '2026-10-14T04:15:00.000Z',
  },
]);

interface LoyaltyStorage {
  configs: Record<string, LoyaltyConfig>;
  wallets: Record<string, Record<string, { phone: string; name?: string; pointsBalance: number; totalVisits: number; lastVisitAt?: string }>>;
  ledger: LoyaltyLedgerEntry[];
}

let inMemoryLoyalty: LoyaltyStorage = readJsonFile<LoyaltyStorage>(LOYALTY_FILE, {
  configs: { 'chai-shai-cafe': DEFAULT_LOYALTY },
  wallets: {
    'chai-shai-cafe': {
      '9826011111': { phone: '9826011111', name: 'Aman Sharma', pointsBalance: 40, totalVisits: 4, lastVisitAt: '2026-10-14T03:30:00.000Z' },
    },
  },
  ledger: [
    {
      id: 'led-seed-1',
      businessId: 'chai-shai-cafe',
      customerPhone: '9826011111',
      customerName: 'Aman Sharma',
      type: 'visit_award',
      pointsChange: 10,
      staffVerified: true,
      note: 'Visit check-in verified by staff',
      createdAt: '2026-10-14T03:30:00.000Z',
    },
  ],
});

let inMemoryAnalytics: Record<string, { scans: number; menuViews: number; visits: number }> = readJsonFile(
  ANALYTICS_FILE,
  {
    'chai-shai-cafe': { scans: 48, menuViews: 42, visits: 18 },
  }
);

// Admin Auth Middleware
function checkAdminAuth(req: Request, res: Response, next: () => void) {
  const token = req.headers['x-admin-token'] as string;
  if (!token || token !== ADMIN_SESSION_SECRET) {
    res.status(401).json({ error: 'Unauthorized. Invalid admin session.' });
    return;
  }
  next();
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
    version: '2.0.0-qr-suite',
    mode: process.env.NODE_ENV || 'development',
  });
});

// 2. Store Settings
app.get('/api/store-settings', (req, res) => {
  res.json(currentSettings);
});

// 3. Business Management
app.get('/api/businesses', (req, res) => {
  res.json(Object.values(inMemoryBusinesses));
});

app.get('/api/businesses/:id', (req, res) => {
  const b = inMemoryBusinesses[req.params.id];
  if (!b) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }
  res.json(b);
});

app.post('/api/businesses', (req: Request, res: Response): void => {
  const profile = req.body as BusinessProfile;
  if (!profile.businessName) {
    res.status(400).json({ error: 'Business name is required' });
    return;
  }

  const slug = profile.id || profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const updated: BusinessProfile = {
    ...profile,
    id: slug,
    staffPin: profile.staffPin || '1234',
    brandColor: profile.brandColor || '#ea580c',
    createdAt: profile.createdAt || new Date().toISOString(),
  };

  inMemoryBusinesses[slug] = updated;
  writeJsonFile(BUSINESSES_FILE, inMemoryBusinesses);

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
    writeJsonFile(MENUS_FILE, inMemoryMenus);
  }

  if (!inMemoryLoyalty.configs[slug]) {
    inMemoryLoyalty.configs[slug] = {
      ...DEFAULT_LOYALTY,
      businessId: slug,
      staffPin: updated.staffPin || '1234',
    };
    writeJsonFile(LOYALTY_FILE, inMemoryLoyalty);
  }

  res.json(updated);
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
  writeJsonFile(ANALYTICS_FILE, inMemoryAnalytics);

  if (!menu) {
    res.status(404).json({ error: 'Menu not found for this business' });
    return;
  }

  res.json({
    menu,
    business: business || { businessName: menu.businessName, contactPhone: '' },
  });
});

app.post('/api/businesses/:id/menu', (req: Request, res: Response): void => {
  const businessId = req.params.id;
  const menuData = req.body as DigitalMenu;

  menuData.businessId = businessId;
  menuData.lastUpdated = new Date().toISOString();

  inMemoryMenus[businessId] = menuData;
  writeJsonFile(MENUS_FILE, inMemoryMenus);

  res.json({ success: true, menu: menuData });
});

// 5. Customer Feedback System
app.post('/api/feedback', (req: Request, res: Response): void => {
  const { businessId, rating, tags, comment, customerName, customerPhone, marketingConsent } = req.body;

  if (!businessId || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Valid business ID and rating (1-5) are required' });
    return;
  }

  const newFeedback: FeedbackSubmission = {
    id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    businessId,
    rating: Number(rating),
    tags: Array.isArray(tags) ? tags : [],
    comment: (comment || '').trim(),
    customerName: (customerName || '').trim() || undefined,
    customerPhone: (customerPhone || '').trim() || undefined,
    marketingConsent: Boolean(marketingConsent),
    createdAt: new Date().toISOString(),
  };

  inMemoryFeedback.unshift(newFeedback);
  writeJsonFile(FEEDBACK_FILE, inMemoryFeedback);

  res.status(201).json({
    success: true,
    message: 'Thank you for your feedback! The management has received it.',
    feedbackId: newFeedback.id,
  });
});

app.get('/api/businesses/:id/feedback', (req: Request, res: Response): void => {
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
  const config = inMemoryLoyalty.configs[businessId] || { ...DEFAULT_LOYALTY, businessId };
  res.json(config);
});

app.post('/api/loyalty/config/:businessId', (req: Request, res: Response): void => {
  const businessId = req.params.businessId;
  const newConfig = req.body as LoyaltyConfig;

  newConfig.businessId = businessId;
  inMemoryLoyalty.configs[businessId] = newConfig;
  writeJsonFile(LOYALTY_FILE, inMemoryLoyalty);

  res.json({ success: true, config: newConfig });
});

// Customer Wallet Lookup (Points balance, history, eligible rewards)
app.get('/api/loyalty/customer', (req: Request, res: Response): void => {
  const businessId = req.query.businessId as string;
  const phone = (req.query.phone as string || '').replace(/[^0-9]/g, '');

  if (!businessId || !phone) {
    res.status(400).json({ error: 'Business ID and customer phone are required' });
    return;
  }

  const config = inMemoryLoyalty.configs[businessId] || DEFAULT_LOYALTY;
  const businessWallets = inMemoryLoyalty.wallets[businessId] || {};
  const wallet = businessWallets[phone] || {
    phone,
    pointsBalance: 0,
    totalVisits: 0,
  };

  const recentHistory = inMemoryLoyalty.ledger
    .filter((l) => l.businessId === businessId && l.customerPhone === phone)
    .slice(0, 10);

  const eligibleRewards = (config.rewards || []).filter(
    (r) => r.isActive && wallet.pointsBalance >= r.pointsRequired
  );

  const customerData: CustomerLoyaltyWallet = {
    phone: wallet.phone,
    name: wallet.name,
    pointsBalance: wallet.pointsBalance,
    totalVisits: wallet.totalVisits,
    lastVisitAt: wallet.lastVisitAt,
    eligibleRewards,
    recentHistory,
  };

  res.json(customerData);
});

// Fraud-Safe Visit Check-in
app.post('/api/loyalty/checkin', (req: Request, res: Response): void => {
  const { businessId, phone, customerName, staffPin, dailyCode } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  if (!businessId || !cleanPhone || cleanPhone.length < 10) {
    res.status(400).json({ error: 'Valid 10-digit customer mobile number is required' });
    return;
  }

  const config = inMemoryLoyalty.configs[businessId] || DEFAULT_LOYALTY;
  if (!config.enabled) {
    res.status(400).json({ error: 'Loyalty programme is currently paused by this business' });
    return;
  }

  // FRAUD SAFEGUARD 1: Verification via either correct Staff PIN OR valid rotating daily code
  const isStaffVerified = Boolean(staffPin && staffPin === config.staffPin);
  const isDailyCodeValid = Boolean(dailyCode && dailyCode === config.dailyCheckinCode);

  if (!isStaffVerified && !isDailyCodeValid) {
    res.status(403).json({
      error: 'Invalid authorization. Please have staff enter their PIN or use the active daily store code.',
    });
    return;
  }

  // FRAUD SAFEGUARD 2: Enforce minimum interval between check-ins (e.g. 12 hours)
  if (!inMemoryLoyalty.wallets[businessId]) {
    inMemoryLoyalty.wallets[businessId] = {};
  }
  const wallet = inMemoryLoyalty.wallets[businessId][cleanPhone] || {
    phone: cleanPhone,
    name: customerName || undefined,
    pointsBalance: 0,
    totalVisits: 0,
  };

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

  // Award points
  const pointsAwarded = config.pointsPerVisit || 10;
  wallet.pointsBalance += pointsAwarded;
  wallet.totalVisits += 1;
  wallet.lastVisitAt = new Date().toISOString();
  if (customerName) wallet.name = customerName;

  inMemoryLoyalty.wallets[businessId][cleanPhone] = wallet;

  // Append to auditable ledger
  const ledgerEntry: LoyaltyLedgerEntry = {
    id: `led-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    businessId,
    customerPhone: cleanPhone,
    customerName: wallet.name,
    type: 'visit_award',
    pointsChange: pointsAwarded,
    staffVerified: isStaffVerified,
    note: isStaffVerified ? 'Verified by staff PIN' : 'Verified via daily store code',
    createdAt: new Date().toISOString(),
  };

  inMemoryLoyalty.ledger.unshift(ledgerEntry);
  writeJsonFile(LOYALTY_FILE, inMemoryLoyalty);

  // Track analytics
  if (!inMemoryAnalytics[businessId]) {
    inMemoryAnalytics[businessId] = { scans: 0, menuViews: 0, visits: 0 };
  }
  inMemoryAnalytics[businessId].visits += 1;
  writeJsonFile(ANALYTICS_FILE, inMemoryAnalytics);

  res.json({
    success: true,
    pointsAwarded,
    newBalance: wallet.pointsBalance,
    totalVisits: wallet.totalVisits,
    message: `🎉 Success! +${pointsAwarded} points added. New balance: ${wallet.pointsBalance} pts!`,
  });
});

// Reward Redemption (Requires Staff PIN to verify physical handoff)
app.post('/api/loyalty/redeem', (req: Request, res: Response): void => {
  const { businessId, phone, rewardId, staffPin } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  if (!businessId || !cleanPhone || !rewardId) {
    res.status(400).json({ error: 'Business ID, phone, and reward ID are required' });
    return;
  }

  const config = inMemoryLoyalty.configs[businessId] || DEFAULT_LOYALTY;
  if (!staffPin || staffPin !== config.staffPin) {
    res.status(403).json({ error: 'Staff verification PIN is required to complete reward redemption' });
    return;
  }

  const reward = (config.rewards || []).find((r) => r.id === rewardId);
  if (!reward || !reward.isActive) {
    res.status(404).json({ error: 'Reward not found or inactive' });
    return;
  }

  const businessWallets = inMemoryLoyalty.wallets[businessId] || {};
  const wallet = businessWallets[cleanPhone];

  if (!wallet || wallet.pointsBalance < reward.pointsRequired) {
    res.status(400).json({
      error: `Insufficient points. You have ${wallet ? wallet.pointsBalance : 0} pts, but this reward requires ${reward.pointsRequired} pts.`,
    });
    return;
  }

  // Deduct points
  wallet.pointsBalance -= reward.pointsRequired;
  inMemoryLoyalty.wallets[businessId][cleanPhone] = wallet;

  // Append redemption to ledger
  const receiptCode = `RDM-${Math.floor(100000 + Math.random() * 900000)}`;
  const ledgerEntry: LoyaltyLedgerEntry = {
    id: `led-${Date.now()}`,
    businessId,
    customerPhone: cleanPhone,
    customerName: wallet.name,
    type: 'reward_redemption',
    pointsChange: -reward.pointsRequired,
    rewardTitle: reward.title,
    staffVerified: true,
    note: `Redeemed: ${reward.title} (Receipt: ${receiptCode})`,
    createdAt: new Date().toISOString(),
  };

  inMemoryLoyalty.ledger.unshift(ledgerEntry);
  writeJsonFile(LOYALTY_FILE, inMemoryLoyalty);

  res.json({
    success: true,
    receiptCode,
    rewardTitle: reward.title,
    pointsDeducted: reward.pointsRequired,
    remainingBalance: wallet.pointsBalance,
    message: `🎉 Reward "${reward.title}" redeemed! Please hand this treat to the customer.`,
  });
});

// 7. Business Analytics Endpoint
app.get('/api/analytics/:businessId', (req: Request, res: Response): void => {
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
      label: l.type === 'reward_redemption' ? `Redeemed: ${l.rewardTitle}` : `Visit check-in by ${l.customerPhone}`,
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

// Analytics Tracking Endpoint
app.post('/api/analytics/track', (req: Request, res: Response): void => {
  const { businessId, eventType } = req.body;
  if (!businessId) {
    res.status(400).json({ error: 'businessId is required' });
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

  writeJsonFile(ANALYTICS_FILE, inMemoryAnalytics);
  res.json({ success: true });
});

// 8. Public API Integration (TheMealDB - Food & Dish Auto-Search)
app.get('/api/integrations/food-search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.query as string || '').trim();
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
      name: m.strMeal,
      category: m.strCategory,
      area: m.strArea,
      description: m.strInstructions ? m.strInstructions.slice(0, 150) + '...' : '',
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

    const promptText = `Generate a high-converting promotional marketing kit for an Indian local business:
- Business Name: "${profile.businessName}"
- Category: "${profile.category}"
- City / Area: "${profile.city || 'India'}"
- Products/Services: "${profile.productsServices || 'Quality local products'}"
- Target Customers: "${profile.targetAudience || 'Local neighborhood residents'}"
- Objective: "${profile.promotionObjective}"
- Active Offer: "${profile.offerDiscount || 'Special inaugural offer'}"
- Language: "${langName}"

Produce clean, culturally resonant copy with ₹ Rupee pricing, 3 headlines, 3 WhatsApp promos with emojis, 5 captions, 10 hashtags, 3 offer ideas, and poster copy.`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = aiClient || new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction: 'You are DukaanBoost AI, the premier marketing copywriter for Indian small businesses.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                whatsappMessages: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      objective: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['title', 'objective', 'text'],
                  },
                },
                captions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hook: { type: Type.STRING },
                      text: { type: Type.STRING },
                      hashtags: { type: Type.STRING },
                    },
                    required: ['hook', 'text', 'hashtags'],
                  },
                },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                offerIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      howItWorks: { type: Type.STRING },
                      marginTip: { type: Type.STRING },
                      bestFor: { type: Type.STRING },
                    },
                    required: ['title', 'howItWorks', 'marginTip', 'bestFor'],
                  },
                },
                ctaMessage: { type: Type.STRING },
                posterConfig: {
                  type: Type.OBJECT,
                  properties: {
                    headline: { type: Type.STRING },
                    subheadline: { type: Type.STRING },
                    offerBadge: { type: Type.STRING },
                    bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    callToAction: { type: Type.STRING },
                    disclaimer: { type: Type.STRING },
                  },
                  required: ['headline', 'subheadline', 'offerBadge', 'bulletPoints', 'callToAction'],
                },
              },
              required: ['headlines', 'whatsappMessages', 'captions', 'hashtags', 'offerIdeas', 'ctaMessage', 'posterConfig'],
            },
          },
        });

        const rawText = response.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          const finalKit: PromoKit = {
            businessName: profile.businessName,
            category: profile.category,
            language: profile.preferredLanguage,
            headlines: parsed.headlines || [],
            whatsappMessages: parsed.whatsappMessages || [],
            captions: parsed.captions || [],
            hashtags: parsed.hashtags || [],
            offerIdeas: parsed.offerIdeas || [],
            ctaMessage: parsed.ctaMessage || `Call/WhatsApp ${profile.contactPhone || profile.businessName} to order now!`,
            posterConfig: {
              headline: parsed.posterConfig?.headline || profile.businessName.toUpperCase(),
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
        console.error('Gemini error, using fallback:', geminiError);
      }
    }

    // Fallback template
    const fallbackTemplate = SAMPLE_BUSINESS_PROFILES[profile.category as string] || SAMPLE_BUSINESS_PROFILES['cafe'];
    res.json({ kit: fallbackTemplate.kit, source: 'smart_engine' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate kit: ' + err.message });
  }
});

// 10. Orders & Manual UPI Checkout
app.post('/api/orders', (req: Request, res: Response): void => {
  try {
    const { packageType, customerName, customerPhone, customerEmail, businessDetails, specialNotes, upiTransactionRef } = req.body;

    if (!packageType || !customerName || !customerPhone) {
      res.status(400).json({ error: 'Package type, customer name, and phone are required.' });
      return;
    }

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

    const year = new Date().getFullYear();
    const orderId = `DKB-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      packageType: packageType as PackageType,
      packageTitle,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      businessDetails: businessDetails || {},
      specialNotes,
      paymentStatus: 'pending',
      fulfillmentStatus: 'pending',
      upiTransactionRef: upiTransactionRef || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryOrders.unshift(newOrder);
    writeJsonFile(ORDERS_FILE, inMemoryOrders);

    res.status(201).json({
      success: true,
      order: newOrder,
      sellerUpiId: currentSettings.sellerUpiId,
      sellerWhatsApp: currentSettings.sellerWhatsApp,
      message: 'Order created successfully. Payment verification pending.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create order: ' + err.message });
  }
});

app.post('/api/orders/:id/submit-upi-ref', (req: Request, res: Response): void => {
  const orderId = req.params.id;
  const { upiTransactionRef } = req.body;

  if (!upiTransactionRef) {
    res.status(400).json({ error: 'UPI transaction reference is required.' });
    return;
  }

  const orderIndex = inMemoryOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  inMemoryOrders[orderIndex].upiTransactionRef = String(upiTransactionRef).trim();
  inMemoryOrders[orderIndex].updatedAt = new Date().toISOString();
  writeJsonFile(ORDERS_FILE, inMemoryOrders);

  res.json({
    success: true,
    order: inMemoryOrders[orderIndex],
    message: 'UPI reference saved. Our team will verify and begin customization.',
  });
});

app.get('/api/orders/:id', (req: Request, res: Response): void => {
  const order = inMemoryOrders.find((o) => o.id.toLowerCase() === req.params.id.toLowerCase());
  if (!order) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  res.json({
    id: order.id,
    packageType: order.packageType,
    packageTitle: order.packageTitle,
    amount: order.amount,
    customerName: order.customerName,
    businessName: order.businessDetails?.businessName || '',
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    upiTransactionRef: order.upiTransactionRef ? order.upiTransactionRef.slice(0, 4) + '****' : '',
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  });
});

// 11. Admin Endpoints
app.post('/api/admin/login', (req: Request, res: Response): void => {
  const { passcode } = req.body;
  if (!passcode || passcode !== ADMIN_PASSCODE) {
    res.status(401).json({ error: 'Invalid admin passcode.' });
    return;
  }

  res.json({
    success: true,
    token: ADMIN_SESSION_SECRET,
    sellerWhatsApp: currentSettings.sellerWhatsApp,
  });
});

app.get('/api/admin/orders', checkAdminAuth, (req: Request, res: Response): void => {
  res.json({
    orders: inMemoryOrders,
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

  const orderIndex = inMemoryOrders.findIndex((o) => o.id === orderId);
  if (orderIndex === -1) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  if (paymentStatus) inMemoryOrders[orderIndex].paymentStatus = paymentStatus;
  if (fulfillmentStatus) inMemoryOrders[orderIndex].fulfillmentStatus = fulfillmentStatus;
  if (adminNotes !== undefined) inMemoryOrders[orderIndex].adminNotes = adminNotes;

  inMemoryOrders[orderIndex].updatedAt = new Date().toISOString();
  writeJsonFile(ORDERS_FILE, inMemoryOrders);

  res.json({ success: true, order: inMemoryOrders[orderIndex] });
});

app.get('/api/admin/settings', checkAdminAuth, (req: Request, res: Response): void => {
  res.json(currentSettings);
});

app.post('/api/admin/settings', checkAdminAuth, (req: Request, res: Response): void => {
  currentSettings = { ...currentSettings, ...req.body };
  writeJsonFile(SETTINGS_FILE, currentSettings);
  res.json({ success: true, settings: currentSettings });
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
    console.log(`🚀 DukaanBoost AI QR & Loyalty Platform running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
