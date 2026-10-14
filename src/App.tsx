import React, { useState, useEffect, useRef } from 'react';
import {
  BusinessProfile,
  BusinessCategory,
  PromoKit,
  PackageType,
  StoreSettings,
  Order,
} from './types';
import { DEFAULT_STORE_SETTINGS, SAMPLE_BUSINESS_PROFILES } from './sampleData';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FoundingSetupBanner } from './components/FoundingSetupBanner';
import { BusinessOverview } from './components/dashboard/BusinessOverview';
import { QrStudio } from './components/qr/QrStudio';
import { DigitalMenuBuilder } from './components/menu/DigitalMenuBuilder';
import { FeedbackManager } from './components/feedback/FeedbackManager';
import { LoyaltyManager } from './components/loyalty/LoyaltyManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CustomerMenuView } from './components/customer/CustomerMenuView';
import { CustomerFeedbackForm } from './components/customer/CustomerFeedbackForm';
import { CustomerLoyaltyView } from './components/customer/CustomerLoyaltyView';
import { ResultsWorkspace } from './components/ResultsWorkspace';
import { BeforeAfterShowcase } from './components/BeforeAfterShowcase';
import { SampleKitsShowcase } from './components/SampleKitsShowcase';
import { PricingSection } from './components/PricingSection';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderLookupModal } from './components/OrderLookupModal';
import { AdminPortal } from './components/AdminPortal';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { WizardModal } from './components/WizardModal';
import { Sparkles, ArrowRight, ArrowLeft, QrCode, Utensils, Star, Gift, TrendingUp, Palette } from 'lucide-react';

type AppModule =
  | 'overview'
  | 'qr'
  | 'menu'
  | 'feedback'
  | 'loyalty'
  | 'analytics'
  | 'marketing'
  | 'customer_menu'
  | 'customer_feedback'
  | 'customer_loyalty';

export default function App() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    ...DEFAULT_STORE_SETTINGS,
    foundingSetupPrice: 249,
  });

  // Current Business Profile
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile>({
    id: 'chai-shai-cafe',
    businessName: 'Chai Shai & Snacks Corner',
    category: 'cafe',
    city: 'Indore, MP',
    address: 'Shop 14, Chappan Dukan, New Palasia, Indore',
    contactPhone: '9826012345',
    productsServices: 'Special Masala Kulhad Chai, Bun Maska, Crispy Paneer Pakode, Cheese Sandwiches',
    targetAudience: 'College students, office workers, local foodies and evening tea lovers',
    promotionObjective: 'more_sales',
    offerDiscount: 'Chai + Samosa Combo @ ₹49 Only',
    preferredLanguage: 'hinglish',
    visualStyle: 'chai_bites',
    brandColor: '#ea580c',
    googleReviewUrl: 'https://g.page/r/sample-chai-shai-indore/review',
    ownerKey: 'biz_key_chai_shai_sample_demo_8921',
    staffPin: '8249',
    createdAt: '2026-10-14T05:00:00.000Z',
  });

  // Active UI Module
  const [activeModule, setActiveModule] = useState<AppModule>('overview');

  // Retained Marketing Kit State
  const [currentKit, setCurrentKit] = useState<PromoKit | null>(SAMPLE_BUSINESS_PROFILES.cafe.kit);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardCategory, setWizardCategory] = useState<BusinessCategory>('cafe');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutPackage, setCheckoutPackage] = useState<PackageType>('founding_setup');
  const [isOrderLookupOpen, setIsOrderLookupOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check URL Hash & Search Params on Initial Load to route QR scans directly to customer views
  useEffect(() => {
    const handleRouteFromUrl = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const bizParam = params.get('biz');

      if (bizParam && bizParam !== currentBusiness.id) {
        // Fetch specific business
        fetch(`/api/businesses/${bizParam}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((b) => {
            if (b) setCurrentBusiness(b);
          })
          .catch((err) => console.warn('Could not load param business:', err));
      }

      if (hash === '#customer-menu') {
        setActiveModule('customer_menu');
      } else if (hash === '#customer-feedback') {
        setActiveModule('customer_feedback');
      } else if (hash === '#customer-loyalty') {
        setActiveModule('customer_loyalty');
      }
    };

    handleRouteFromUrl();
    window.addEventListener('hashchange', handleRouteFromUrl);
    return () => window.removeEventListener('hashchange', handleRouteFromUrl);
  }, []);

  // Fetch Store Settings
  useEffect(() => {
    fetch('/api/store-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sellerUpiId) {
          setStoreSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.warn('Using default store settings:', err));

    // Fetch initial business
    fetch('/api/businesses/chai-shai-cafe', {
      headers: {
        'x-business-key': 'biz_key_chai_shai_sample_demo_8921',
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentBusiness(data);
      })
      .catch((err) => console.warn('Using default business:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCheckout = (pkg: PackageType) => {
    setCheckoutPackage(pkg);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    showToast(`Order #${order.id} placed! Please complete UPI payment verification.`);
  };

  // If currently in a dedicated Customer-facing view (rendered on patron's mobile phone)
  if (activeModule === 'customer_menu') {
    return (
      <CustomerMenuView
        businessId={currentBusiness.id}
        onBackToDashboard={() => setActiveModule('menu')}
      />
    );
  }

  if (activeModule === 'customer_feedback') {
    return (
      <CustomerFeedbackForm
        business={currentBusiness}
        onBackToDashboard={() => setActiveModule('feedback')}
      />
    );
  }

  if (activeModule === 'customer_loyalty') {
    return (
      <CustomerLoyaltyView
        business={currentBusiness}
        onBackToDashboard={() => setActiveModule('loyalty')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeModule={activeModule}
        onSelectModule={(mod) => setActiveModule(mod)}
        onPreviewCustomer={(view) => setActiveModule(view)}
        onOpenOrderLookup={() => setIsOrderLookupOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOrderFoundingSetup={() => handleOpenCheckout('founding_setup')}
        storeSettings={storeSettings}
      />

      <main className="flex-1">
        {/* VIEW 1: OVERVIEW & DASHBOARD */}
        {activeModule === 'overview' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            {/* Model A Done-For-You Founding Setup Banner */}
            <FoundingSetupBanner
              onOrderFoundingSetup={() => handleOpenCheckout('founding_setup')}
              storeSettings={storeSettings}
            />

            {/* Business Overview & Quick Launchpad */}
            <BusinessOverview
              business={currentBusiness}
              onUpdateBusiness={(updated) => {
                setCurrentBusiness(updated);
                showToast('Business profile updated!');
              }}
              onNavigateToTab={(tab) => setActiveModule(tab)}
            />

            {/* Pricing Section with Founding Setup Highlight */}
            <PricingSection
              onSelectPackage={(pkg) => handleOpenCheckout(pkg)}
              onOpenFreePreview={() => setActiveModule('qr')}
              storeSettings={storeSettings}
            />

            {/* Before and After Comparison */}
            <BeforeAfterShowcase />

            {/* FAQ Section */}
            <FaqSection storeSettings={storeSettings} />
          </div>
        )}

        {/* VIEW 2: QR CODE STUDIO */}
        {activeModule === 'qr' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveModule('overview')}
                className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <button
                onClick={() => handleOpenCheckout('founding_setup')}
                className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-100 cursor-pointer"
              >
                Want Us to Print & Setup For You? Order Setup (₹249) →
              </button>
            </div>

            <QrStudio business={currentBusiness} appUrl={window.location.origin} />
          </div>
        )}

        {/* VIEW 3: DIGITAL MENU BUILDER */}
        {activeModule === 'menu' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveModule('overview')}
                className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <button
                onClick={() => setActiveModule('qr')}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Generate Menu QR & Table Standee →</span>
              </button>
            </div>

            <DigitalMenuBuilder
              business={currentBusiness}
              onPreviewCustomerMenu={() => setActiveModule('customer_menu')}
            />
          </div>
        )}

        {/* VIEW 4: CUSTOMER FEEDBACK INBOX */}
        {activeModule === 'feedback' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <button
              onClick={() => setActiveModule('overview')}
              className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>

            <FeedbackManager
              business={currentBusiness}
              onOpenCustomerFeedback={() => setActiveModule('customer_feedback')}
            />
          </div>
        )}

        {/* VIEW 5: FRAUD-SAFE CUSTOMER LOYALTY */}
        {activeModule === 'loyalty' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <button
              onClick={() => setActiveModule('overview')}
              className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>

            <LoyaltyManager
              business={currentBusiness}
              onOpenCustomerLoyalty={() => setActiveModule('customer_loyalty')}
            />
          </div>
        )}

        {/* VIEW 6: BUSINESS ANALYTICS */}
        {activeModule === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <button
              onClick={() => setActiveModule('overview')}
              className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>

            <AnalyticsView business={currentBusiness} />
          </div>
        )}

        {/* VIEW 7: MARKETING KIT STUDIO (Retained Gemini AI Promos & 1080p Poster Editor) */}
        {activeModule === 'marketing' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveModule('overview')}
                className="text-xs font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Overview</span>
              </button>

              <button
                onClick={() => setIsWizardOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate New Promotional Pack</span>
              </button>
            </div>

            {currentKit && (
              <ResultsWorkspace
                kit={currentKit}
                profile={currentBusiness}
                onCreateNew={() => setIsWizardOpen(true)}
                onOrderPack={(pack) => handleOpenCheckout(pack)}
              />
            )}

            <SampleKitsShowcase
              onLoadSampleIntoWorkspace={(kit) => {
                setCurrentKit(kit);
                showToast(`Loaded "${kit.businessName}" into Poster Studio!`);
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenOrderLookup={() => setIsOrderLookupOpen(true)}
        storeSettings={storeSettings}
      />

      {/* MODALS */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onKitGenerated={(kit, profile) => {
          setCurrentKit(kit);
          setCurrentBusiness((prev) => ({ ...prev, ...profile }));
          showToast(`Promotional pack for "${kit.businessName}" generated!`);
        }}
        initialCategory={wizardCategory}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPackage={checkoutPackage}
        currentProfile={currentBusiness}
        storeSettings={storeSettings}
        onOrderSuccess={handleOrderSuccess}
      />

      <OrderLookupModal
        isOpen={isOrderLookupOpen}
        onClose={() => setIsOrderLookupOpen(false)}
        storeSettings={storeSettings}
      />

      <AdminPortal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onSettingsUpdated={(newSettings) => setStoreSettings(newSettings)}
        onFulfillInGenerator={(profile) => {
          setCurrentBusiness((prev) => ({ ...prev, ...profile }));
          setIsWizardOpen(true);
        }}
      />
    </div>
  );
}
