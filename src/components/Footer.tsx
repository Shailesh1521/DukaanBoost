import React from 'react';
import { StoreSettings } from '../types';
import { Shield, MessageCircle, Heart } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenOrderLookup: () => void;
  storeSettings: StoreSettings;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenOrderLookup,
  storeSettings,
}) => {
  const cleanPhone = storeSettings.sellerWhatsApp.replace(/[^0-9]/g, '');

  return (
    <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-900">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-extrabold text-lg">
                ₹
              </div>
              <span className="font-display font-extrabold text-2xl text-white tracking-tight">
                Dukaan<span className="text-orange-500">Boost</span> AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Empowering Indian local businesses — cafés, salons, bakeries, tiffin services, gyms, boutiques and retail shops — with professional, high-converting marketing packs, festive promos, and 1080p branded posters.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>for Local Indian Small Businesses • Vocal for Local</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#sample-kits" className="hover:text-white transition-colors">
                  Sample Business Kits
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Pricing (₹99+)
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenOrderLookup}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Track Existing Order
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Admin */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support & Orders</h4>
            <div className="space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">{storeSettings.sellerName}</p>
              <p className="text-slate-400">WhatsApp: +{storeSettings.sellerWhatsApp}</p>
              <p className="text-slate-400">UPI ID: {storeSettings.sellerUpiId}</p>
              <div className="pt-2">
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
              <div className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Seller Admin Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} DukaanBoost AI. All rights reserved.</p>
          <p className="text-[11px]">
            Payment instructions verified via UPI. No card credentials or banking PINs are ever collected.
          </p>
        </div>
      </div>
    </footer>
  );
};
