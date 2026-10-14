import React from 'react';
import { Check, Sparkles, ArrowRight, ShieldCheck, HelpCircle, Clock, Zap, Star } from 'lucide-react';
import { PackageType, StoreSettings } from '../types';

interface PricingSectionProps {
  onSelectPackage: (pkg: PackageType) => void;
  onOpenFreePreview: () => void;
  storeSettings: StoreSettings;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  onSelectPackage,
  onOpenFreePreview,
  storeSettings,
}) => {
  return (
    <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            <span>Honest Indian Pricing & Packages</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Transparent Pricing in Indian Rupees (₹)
          </h2>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            No recurring monthly subscriptions. Choose self-service or let our operator team configure your complete QR & digital menu setup for you.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* TIER 1: Founding Setup (Model A - ₹249) */}
          <div className="bg-gradient-to-b from-orange-50/60 via-white to-amber-50/40 rounded-3xl p-6 sm:p-7 border-2 border-orange-500 shadow-md flex flex-col justify-between relative hover:border-orange-600 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-200 text-yellow-200" />
              <span>Founding Setup</span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-orange-100 text-orange-800 inline-block mb-3">
                Done-For-You Model
              </span>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">Founding Setup</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Complete operator-assisted digital menu, printable tabletop QR standees & loyalty setup.
              </p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-slate-900">₹{storeSettings.foundingSetupPrice || 249}</span>
                <span className="text-xs text-slate-400 font-medium ml-1">One-time flat fee</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 pb-6 border-b border-orange-100">
                <li className="flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span><strong>Full Digital Menu (up to 30 dishes)</strong></span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Print-Ready 4×6 Acrylic Standee PNGs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Private Feedback QR & Google Review link</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Fraud-safe Loyalty programme with staff PIN</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Delivered to your WhatsApp within 24 hours</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPackage('founding_setup')}
              className="mt-6 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all cursor-pointer text-center"
            >
              Order Founding Setup (₹{storeSettings.foundingSetupPrice || 249})
            </button>
          </div>

          {/* TIER 2: Starter Pack (₹99) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 inline-block mb-3">
                1 Campaign Pack
              </span>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">Starter Pack</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                One customized promotional pack with WhatsApp copy and branded poster.
              </p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-slate-900">₹{storeSettings.starterPackPrice}</span>
                <span className="text-xs text-slate-400 font-medium ml-1">One-time flat fee</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-700 pb-6 border-b border-slate-100">
                <li className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>1 Custom Festival or Flash Campaign</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Branded 1080p Poster with your logo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>3 WhatsApp blast copy variations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>5 Instagram captions & 10 hashtags</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Delivered via WhatsApp in 24 hrs</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPackage('starter')}
              className="mt-6 w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center"
            >
              Order Starter Pack (₹{storeSettings.starterPackPrice})
            </button>
          </div>

          {/* TIER 3: Business Pack (₹199) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-100 text-purple-800 inline-block mb-3">
                3 Campaign Packs
              </span>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">Business Pack</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Three complete campaign variations (Weekend, Festival & Loyalty Promo).
              </p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-slate-900">₹{storeSettings.businessPackPrice}</span>
                <span className="text-xs text-slate-400 font-medium ml-1">One-time flat fee</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 pb-6 border-b border-slate-100">
                <li className="flex items-center gap-2 font-medium text-slate-900">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span><strong>3 Campaign Variations</strong> (Weekend + Festive + Loyalty)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>3 Custom Poster designs (Square & Story)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>9 WhatsApp messages & 15 captions</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Priority WhatsApp delivery within 12-24 hours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>1 round of revisions included</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onSelectPackage('business')}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer text-center"
            >
              Order Business Pack (₹{storeSettings.businessPackPrice})
            </button>
          </div>

          {/* TIER 4: Self-Service Free Preview (₹0) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 inline-block mb-3">
                Self-Service
              </span>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">Free Preview</h3>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                Create your menu, generate sample QR standees & test loyalty right here.
              </p>

              <div className="mt-6 mb-6">
                <span className="text-4xl font-black text-slate-900">₹0</span>
                <span className="text-xs text-slate-400 font-medium ml-1">Always Free</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 pb-6 border-b border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Create Digital Menu in Browser</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Generate & Download Table QR Codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Test Private Feedback Form</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Test Fraud-Safe Loyalty Wallet</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Sample AI Promotional Kit Generation</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenFreePreview}
              className="mt-6 w-full py-3 px-4 rounded-xl border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center"
            >
              Use Self-Service (Free)
            </button>
          </div>
        </div>

        {/* Honest Trust & Payment Note */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200 text-xs sm:text-sm text-slate-600 max-w-3xl mx-auto flex items-start gap-4 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Honest Order & UPI Payment Procedure</h4>
            <p className="leading-relaxed">
              We never take automatic credit card debits or ask for your UPI PIN. When you order a pack, you receive a unique Order ID and payment instructions with our verified UPI ID. Once you send payment via GPay / PhonePe / Paytm and share your UTR reference, our team verifies it and delivers your customized files directly on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
