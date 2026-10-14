import React from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, QrCode } from 'lucide-react';
import { PackageType, StoreSettings } from '../types';

interface FoundingSetupBannerProps {
  onOrderFoundingSetup: () => void;
  storeSettings: StoreSettings;
}

export const FoundingSetupBanner: React.FC<FoundingSetupBannerProps> = ({
  onOrderFoundingSetup,
  storeSettings,
}) => {
  return (
    <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-yellow-100 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Model A • Done-For-You Operator Service</span>
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-snug">
            Founding Business Done-For-You Setup (₹{storeSettings.foundingSetupPrice || 249})
          </h3>

          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium">
            Don't have time to type your menu and configure QR codes? Our team will build your branded digital menu, design high-res printable table standees with your logo, and hand you everything ready within 24 hours.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Full Digital Menu (up to 30 items) configured</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Print-Ready 4×6 Tabletop Acrylic Standee PNGs</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Private Feedback QR & Google Review link setup</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-300 shrink-0" />
              <span>Direct delivery on WhatsApp in 24 hours</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center sm:items-start lg:items-end gap-2">
          <div className="text-right">
            <span className="text-xs text-orange-200 line-through">Regular ₹599</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black text-4xl text-white">
                ₹{storeSettings.foundingSetupPrice || 249}
              </span>
              <span className="text-xs text-orange-100 font-semibold">One-time flat fee</span>
            </div>
          </div>

          <button
            onClick={onOrderFoundingSetup}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-orange-50 text-orange-950 font-extrabold text-sm shadow-lg shadow-black/15 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>Order Done-For-You Setup (₹{storeSettings.foundingSetupPrice || 249})</span>
            <ArrowRight className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
