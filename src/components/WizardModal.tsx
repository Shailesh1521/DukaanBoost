import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Upload, Flame } from 'lucide-react';
import { BusinessProfile, BusinessCategory, PromotionObjective, LanguageOption, VisualStyle, PromoKit } from '../types';
import { TEMPLATE_NAMES } from '../utils/posterCanvas';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKitGenerated: (kit: PromoKit, profile: BusinessProfile) => void;
  initialCategory?: BusinessCategory;
}

const CATEGORIES: Array<{ id: BusinessCategory; label: string; icon: string }> = [
  { id: 'cafe', label: 'Café & Eatery', icon: '☕' },
  { id: 'salon', label: 'Salon & Beauty', icon: '💇‍♀️' },
  { id: 'tiffin', label: 'Tiffin & Food', icon: '🍲' },
  { id: 'bakery', label: 'Home Baker', icon: '🎂' },
  { id: 'gym', label: 'Gym & Fitness', icon: '💪' },
  { id: 'boutique', label: 'Boutique & Fashion', icon: '👗' },
  { id: 'grocery', label: 'Kirana & Supermarket', icon: '🛒' },
  { id: 'tutor', label: 'Tutor & Coaching', icon: '📚' },
  { id: 'repair', label: 'Mobile & Repair', icon: '🔧' },
  { id: 'other', label: 'Other Business', icon: '🏬' },
];

const PROMOTION_OBJECTIVES: Array<{ id: PromotionObjective; label: string; desc: string }> = [
  { id: 'more_sales', label: '🚀 More Sales Today', desc: 'Urgent flash discounts & combos to clear inventory' },
  { id: 'new_customers', label: '🎯 New Customers', desc: 'Welcome trials & first-visit discounts' },
  { id: 'repeat_visits', label: '🔁 Repeat Visits', desc: 'Loyalty perks & thank-you bonuses for regulars' },
  { id: 'festival_offer', label: '🪔 Festival Dhamaka', desc: 'Diwali, Eid, Holi, Navratri & seasonal specials' },
  { id: 'brand_awareness', label: '🌟 Brand Awareness', desc: 'Quality pride & local word-of-mouth visibility' },
];

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  onKitGenerated,
  initialCategory = 'cafe',
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState<string>('');
  const [category, setCategory] = useState<BusinessCategory>(initialCategory);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');

  const [productsServices, setProductsServices] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [promotionObjective, setPromotionObjective] = useState<PromotionObjective>('more_sales');

  const [offerDiscount, setOfferDiscount] = useState<string>('');
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageOption>('hinglish');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('festive_dhamaka');
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size should be less than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLogoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!businessName.trim()) {
      setError('Please enter your business name.');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!productsServices.trim()) {
      setError('Please mention at least 1 or 2 products or services you offer.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setError(null);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);

    const profile: BusinessProfile = {
      businessName: businessName.trim(),
      category: category === 'other' && customCategory ? customCategory : category,
      customCategory: customCategory.trim() || undefined,
      city: city.trim(),
      productsServices: productsServices.trim(),
      targetAudience: targetAudience.trim(),
      promotionObjective,
      offerDiscount: offerDiscount.trim(),
      preferredLanguage,
      visualStyle,
      contactPhone: contactPhone.trim(),
      logoUrl: logoDataUrl,
    };

    try {
      setLoadingStage('Analyzing Indian local market context & festival hooks...');
      await new Promise((r) => setTimeout(r, 600));

      setLoadingStage('Crafting high-converting WhatsApp messages & captions...');

      const response = await fetch('/api/generate-promo-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate promotional kit.');
      }

      setLoadingStage('Designing high-res 1080p poster layouts & offer ideas...');
      const data = await response.json();

      if (data.kit) {
        onKitGenerated(data.kit, profile);
        onClose();
      } else {
        throw new Error('Malformed kit response received.');
      }
    } catch (err: any) {
      console.error('Error generating promo kit:', err);
      setError(err.message || 'Network error occurred. Please retry.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center font-bold text-xs">
                ₹
              </span>
              <h2 className="font-display font-extrabold text-xl">Create Your Promotional Marketing Kit</h2>
            </div>
            <p className="text-xs text-orange-100 mt-1">
              Step {step} of 4: {step === 1 ? 'Business Basics' : step === 2 ? 'Offer & Audience' : step === 3 ? 'Style & Language' : 'Review & Generate'}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-orange-500 h-1.5 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: BUSINESS BASICS */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Chai Shai Corner, Kavita Beauty Parlour, Maa Ki Rasoi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl text-left border text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        category === cat.id
                          ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
                {category === 'other' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Specify your business category"
                    className="mt-3 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    City / Locality (Optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Indore, MP / Vaishali Nagar, Jaipur"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp / Contact Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 9826012345 (Shown on posters)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCTS & AUDIENCE */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Products or Services You Sell *
                </label>
                <textarea
                  rows={3}
                  value={productsServices}
                  onChange={(e) => setProductsServices(e.target.value)}
                  placeholder="e.g. Kulhad Masala Chai, Crispy Paneer Pakode, Cheese Sandwiches, Cold Coffee"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mention 3-5 items or services for the AI to include in headlines and WhatsApp copy.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Customers
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. College students, local families, working women, office goers"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Promotion Objective
                </label>
                <div className="space-y-2">
                  {PROMOTION_OBJECTIVES.map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setPromotionObjective(obj.id)}
                      className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        promotionObjective === obj.id
                          ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-xs sm:text-sm">{obj.label}</p>
                        <p className="text-[11px] text-slate-500">{obj.desc}</p>
                      </div>
                      {promotionObjective === obj.id && (
                        <Check className="w-4 h-4 text-orange-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: OFFER, LANGUAGE & VISUAL STYLE */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Offer or Discount (Optional)
                </label>
                <input
                  type="text"
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(e.target.value)}
                  placeholder="e.g. Chai + Samosa Combo @ ₹49 / Flat 30% OFF / Free Hair Spa"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank if you want the AI to suggest practical offers for you!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preferred Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('hinglish')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                      preferredLanguage === 'hinglish'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Hinglish</span>
                    <span className="block text-[10px] font-normal opacity-90 mt-0.5">Most Popular</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('hindi')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                      preferredLanguage === 'hindi'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>हिंदी (Hindi)</span>
                    <span className="block text-[10px] font-normal opacity-90 mt-0.5">Shuddh / Local</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage('english')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs sm:text-sm cursor-pointer transition-all ${
                      preferredLanguage === 'english'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>English</span>
                    <span className="block text-[10px] font-normal opacity-90 mt-0.5">Indian English</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Poster Visual Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(TEMPLATE_NAMES) as VisualStyle[]).map((themeKey) => {
                    const theme = TEMPLATE_NAMES[themeKey];
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setVisualStyle(themeKey)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          visualStyle === themeKey
                            ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs ring-1 ring-orange-500'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <p className="font-bold text-slate-900">{theme.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{theme.tag}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & GENERATE */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-2">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Business:</span>
                  <span className="font-bold text-slate-900">{businessName} ({category})</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">City:</span>
                  <span className="font-semibold text-slate-800">{city || 'Local Area'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Products / Services:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-xs truncate">{productsServices}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Offer / Discount:</span>
                  <span className="font-semibold text-orange-700">{offerDiscount || 'AI Suggested Deals'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Language:</span>
                  <span className="font-bold uppercase text-slate-900">{preferredLanguage}</span>
                </div>
              </div>

              {/* Optional Logo Upload */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-orange-300 transition-colors">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Add Business Logo to Poster (Optional)</p>
                <p className="text-[11px] text-slate-400 mb-3">PNG or JPEG up to 2MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                />
                {logoDataUrl && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs rounded-lg font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Logo attached successfully</span>
                  </div>
                )}
              </div>

              {/* Loading Feedback State */}
              {loading && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 text-center space-y-3 animate-pulse">
                  <Sparkles className="w-8 h-8 text-orange-600 mx-auto animate-spin" />
                  <p className="font-bold text-sm text-orange-950">{loadingStage || 'Generating marketing kit...'}</p>
                  <p className="text-xs text-orange-700">Writing WhatsApp copy, social captions, and poster configurations...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((p) => p - 1)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 via-amber-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-lg shadow-orange-500/30 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span>{loading ? 'Generating...' : 'Generate Complete Promo Kit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
