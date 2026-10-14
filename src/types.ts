export type BusinessCategory =
  | 'cafe'
  | 'restaurant'
  | 'tiffin'
  | 'bakery'
  | 'tutor'
  | 'gym'
  | 'hotel'
  | 'salon'
  | 'boutique'
  | 'grocery'
  | 'repair'
  | 'other';

export type PromotionObjective =
  | 'more_sales'
  | 'new_customers'
  | 'repeat_visits'
  | 'festival_offer'
  | 'brand_awareness';

export type LanguageOption = 'hinglish' | 'hindi' | 'english';

export type VisualStyle =
  | 'festive_dhamaka'
  | 'chai_bites'
  | 'salon_glow'
  | 'power_fitness'
  | 'kirana_saver'
  | 'boutique_elegance';

export interface BusinessProfile {
  id?: string;
  businessName: string;
  category: BusinessCategory | string;
  customCategory?: string;
  city: string;
  address?: string;
  productsServices: string;
  targetAudience: string;
  promotionObjective: PromotionObjective;
  offerDiscount: string;
  preferredLanguage: LanguageOption;
  visualStyle: VisualStyle;
  contactPhone: string;
  logoUrl?: string;
  brandColor?: string;
  googleReviewUrl?: string;
  staffPin?: string;
  ownerKey?: string;
  createdAt?: string;
}

// Digital Menu Models
export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  dietaryTag?: 'veg' | 'non_veg' | 'egg' | 'vegan';
  isSpecial?: boolean;
  imageUrl?: string;
}

export interface DigitalMenu {
  businessId: string;
  businessName: string;
  currency: string;
  lastUpdated: string;
  categories: MenuCategory[];
  items: MenuItem[];
}

// Feedback Models
export interface FeedbackSubmission {
  id: string;
  businessId: string;
  rating: number; // 1 to 5
  tags: string[];
  comment: string;
  customerName?: string;
  customerPhone?: string;
  marketingConsent?: boolean;
  createdAt: string;
}

// Customer Loyalty & Fraud-Safe Ledger Models
export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  isActive: boolean;
}

export interface LoyaltyConfig {
  businessId: string;
  enabled: boolean;
  pointsPerVisit: number;
  minHoursBetweenVisits: number;
  dailyCheckinCode: string;
  dailyCodeExpiresAt: string;
  staffPin: string;
  rewards: LoyaltyReward[];
}

export interface LoyaltyLedgerEntry {
  id: string;
  businessId: string;
  customerPhone: string;
  customerName?: string;
  type: 'visit_award' | 'reward_redemption' | 'manual_adjustment';
  pointsChange: number;
  rewardTitle?: string;
  staffVerified: boolean;
  note: string;
  createdAt: string;
}

export interface CustomerLoyaltyWallet {
  phone: string;
  name?: string;
  pointsBalance: number;
  totalVisits: number;
  lastVisitAt?: string;
  walletToken?: string;
  eligibleRewards: LoyaltyReward[];
  recentHistory: LoyaltyLedgerEntry[];
}

// QR Code Models
export type QrDestinationType = 'menu' | 'feedback' | 'review' | 'loyalty' | 'custom';

export interface QrConfig {
  type: QrDestinationType;
  title: string;
  destinationUrl: string;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  includeLogo: boolean;
  tableNumber?: string;
}

// Analytics Models
export interface AnalyticsSummary {
  businessId: string;
  totalQrScans: number;
  totalMenuViews: number;
  totalFeedbackCount: number;
  averageRating: number;
  totalLoyaltyVisits: number;
  totalPointsIssued: number;
  totalRewardsRedeemed: number;
  recentActivity: Array<{
    id: string;
    type: 'scan' | 'menu' | 'feedback' | 'visit' | 'redeem';
    label: string;
    timestamp: string;
  }>;
}

// Marketing Promo Kit Models (Retained from previous phase)
export interface WhatsAppMessage {
  title: string;
  objective: string;
  text: string;
}

export interface SocialCaption {
  hook: string;
  text: string;
  hashtags: string;
}

export interface OfferIdea {
  title: string;
  howItWorks: string;
  marginTip: string;
  bestFor: string;
}

export interface PosterConfig {
  headline: string;
  subheadline: string;
  offerBadge: string;
  bulletPoints: string[];
  callToAction: string;
  phone: string;
  location: string;
  disclaimer?: string;
}

export interface PromoKit {
  businessName: string;
  category: string;
  language: LanguageOption;
  headlines: string[];
  whatsappMessages: WhatsAppMessage[];
  captions: SocialCaption[];
  hashtags: string[];
  offerIdeas: OfferIdea[];
  ctaMessage: string;
  posterConfig: PosterConfig;
  generatedAt: string;
}

// Order & Billing Models
export type PaymentStatus = 'pending' | 'verified' | 'rejected';
export type FulfillmentStatus = 'pending' | 'in_progress' | 'completed';

export type PackageType = 'founding_setup' | 'free_preview' | 'starter' | 'business' | 'menu_setup';

export interface Order {
  id: string;
  packageType: PackageType;
  packageTitle: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  businessDetails: BusinessProfile;
  specialNotes?: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  upiTransactionRef?: string;
  orderAccessToken?: string;
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  generatedKit?: PromoKit;
}

export interface StoreSettings {
  sellerUpiId: string;
  sellerName: string;
  sellerWhatsApp: string;
  currencySymbol: string;
  foundingSetupPrice: number; // ₹249 introductory package
  starterPackPrice: number;
  businessPackPrice: number;
  menuSetupPrice: number;
  acceptingOrders: boolean;
  announcementText?: string;
}
