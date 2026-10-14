import React, { useState } from 'react';
import {
  Sparkles,
  MessageCircle,
  Search,
  Shield,
  Menu,
  X,
  QrCode,
  Utensils,
  Star,
  Gift,
  TrendingUp,
  Palette,
  Eye,
} from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  activeModule: 'overview' | 'qr' | 'menu' | 'feedback' | 'loyalty' | 'analytics' | 'marketing' | 'customer_menu' | 'customer_feedback' | 'customer_loyalty';
  onSelectModule: (module: 'overview' | 'qr' | 'menu' | 'feedback' | 'loyalty' | 'analytics' | 'marketing') => void;
  onPreviewCustomer: (view: 'customer_menu' | 'customer_feedback' | 'customer_loyalty') => void;
  onOpenOrderLookup: () => void;
  onOpenAdmin: () => void;
  onOrderFoundingSetup: () => void;
  storeSettings: StoreSettings;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onSelectModule,
  onPreviewCustomer,
  onOpenOrderLookup,
  onOpenAdmin,
  onOrderFoundingSetup,
  storeSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanPhone = storeSettings.sellerWhatsApp.replace(/[^0-9]/g, '');
  const waHelpUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    'Hi DukaanBoost AI, I have a question about QR setup, digital menus, or loyalty programs.'
  )}`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 text-white text-[11px] py-1.5 px-4 font-semibold text-center flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></span>
        <span>
          {storeSettings.announcementText ||
            '🚀 Model A Launch Offer: Done-for-you QR & Digital Menu setup at just ₹249 with 24-hr WhatsApp delivery!'}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => onSelectModule('overview')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-xl">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-slate-900">
                Dukaan<span className="text-orange-600">Boost</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-sm">
                QR & Loyalty
              </span>
            </div>
            <p className="text-[11px] text-slate-500 -mt-0.5 font-medium hidden sm:block">
              Affordable QR, Menu & Rewards for Indian Local Shops
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-700">
          <button
            onClick={() => onSelectModule('overview')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
              activeModule === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectModule('qr')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'qr'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Studio</span>
          </button>
          <button
            onClick={() => onSelectModule('menu')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'menu'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Digital Menu</span>
          </button>
          <button
            onClick={() => onSelectModule('feedback')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'feedback'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Feedback</span>
          </button>
          <button
            onClick={() => onSelectModule('loyalty')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'loyalty'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Loyalty</span>
          </button>
          <button
            onClick={() => onSelectModule('analytics')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'analytics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => onSelectModule('marketing')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeModule === 'marketing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Marketing Pack</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Mobile Preview Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer">
              <Eye className="w-3.5 h-3.5 text-orange-600" />
              <span>Customer View</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border border-slate-200 rounded-2xl shadow-xl p-2 w-48 text-xs font-semibold z-50">
              <button
                onClick={() => onPreviewCustomer('customer_menu')}
                className="w-full text-left p-2 rounded-lg hover:bg-orange-50 hover:text-orange-900 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>📱</span>
                <span>Customer Digital Menu</span>
              </button>
              <button
                onClick={() => onPreviewCustomer('customer_feedback')}
                className="w-full text-left p-2 rounded-lg hover:bg-purple-50 hover:text-purple-900 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>⭐</span>
                <span>Customer Feedback Form</span>
              </button>
              <button
                onClick={() => onPreviewCustomer('customer_loyalty')}
                className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>🎁</span>
                <span>Customer Loyalty Pass</span>
              </button>
            </div>
          </div>

          <button
            onClick={onOrderFoundingSetup}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>Done-For-You Setup (₹{storeSettings.foundingSetupPrice || 249})</span>
          </button>

          <button
            onClick={onOpenOrderLookup}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Track Order Status"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdmin}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOrderFoundingSetup}
            className="flex items-center gap-1 bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
          >
            <span>Setup (₹249)</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('overview');
              }}
              className="p-2.5 rounded-lg bg-slate-100 text-slate-900 text-left"
            >
              Overview Dashboard
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('qr');
              }}
              className="p-2.5 rounded-lg bg-orange-50 text-orange-900 text-left"
            >
              📱 QR Studio
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('menu');
              }}
              className="p-2.5 rounded-lg bg-amber-50 text-amber-900 text-left"
            >
              🍽️ Digital Menu
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('feedback');
              }}
              className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-left"
            >
              ⭐ Feedback Inbox
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('loyalty');
              }}
              className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-left"
            >
              🎁 Loyalty Program
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSelectModule('marketing');
              }}
              className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-left"
            >
              🎨 Marketing Studio
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onPreviewCustomer('customer_menu');
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700"
            >
              👀 View Live Mobile Menu
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrderLookup();
              }}
              className="w-full text-left p-2 rounded-lg bg-slate-50 text-xs font-semibold text-slate-700"
            >
              🔍 Track Existing Order
            </button>
            <a
              href={waHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Chat with Founder on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
