import React, { useState } from 'react';
import { BusinessProfile } from '../../types';
import {
  Store,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Utensils,
  MessageSquare,
  Gift,
  TrendingUp,
  Save,
  MapPin,
  Phone,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface BusinessOverviewProps {
  business: BusinessProfile;
  onUpdateBusiness: (updated: BusinessProfile) => void;
  onNavigateToTab: (tab: 'qr' | 'menu' | 'feedback' | 'loyalty' | 'analytics' | 'marketing') => void;
}

export const BusinessOverview: React.FC<BusinessOverviewProps> = ({
  business,
  onUpdateBusiness,
  onNavigateToTab,
}) => {
  const [formData, setFormData] = useState<BusinessProfile>(business);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);

    try {
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-key': business.ownerKey || '',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update business profile.');
      }
      const data = await res.json();
      onUpdateBusiness(data);
      setSaveSuccess('Business profile & settings saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-orange-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 inline-block mb-3">
            Local Business Control Center
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
            Welcome to {business.businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
            Manage your digital menu, printable QR table standees, private customer feedback inbox, and fraud-safe loyalty points in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateToTab('qr')}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Open QR Studio</span>
          </button>
          <button
            onClick={() => onNavigateToTab('menu')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Utensils className="w-4 h-4" />
            <span>Manage Menu</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Quick Launchpad Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateToTab('qr')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
              Tabletop QR Studio
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Download 4×6 print standees, acrylic tent cards & high-contrast QR PNGs.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-bold text-orange-600">
            <span>Configure QR →</span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateToTab('menu')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-orange-600 transition-colors">
              Digital Menu Builder
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Organize food categories, prices in ₹, veg/non-veg tags & instant availability.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-bold text-amber-600">
            <span>Edit Catalog →</span>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateToTab('feedback')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
              Feedback Inbox
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Review private customer ratings, sentiment tags, and direct suggestions.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-bold text-purple-600">
            <span>View Reviews →</span>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateToTab('loyalty')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
              Fraud-Safe Loyalty
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Rotating daily codes, staff PIN check-ins, customer points ledger & rewards.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-bold text-emerald-600">
            <span>Manage Loyalty →</span>
          </div>
        </div>
      </div>

      {/* Profile & Business Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-200">
          <h2 className="font-display font-extrabold text-xl text-slate-900">
            Business Profile & Contact Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            These details appear on your printed QR cards, digital menu header, and customer passes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Business / Store Name *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="cafe">☕ Café & Coffee Shop</option>
                <option value="restaurant">🍽️ Restaurant & Food Outlet</option>
                <option value="tiffin">🍲 Tiffin & Meal Delivery</option>
                <option value="bakery">🎂 Home Baker & Pastry</option>
                <option value="gym">💪 Gym & Fitness Studio</option>
                <option value="hotel">🏨 Hotel & Hospitality</option>
                <option value="salon">💇‍♀️ Salon & Wellness</option>
                <option value="grocery">🛒 Kirana & Supermarket</option>
                <option value="other">🏬 Other Local Business</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City / Locality *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact / WhatsApp Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Store Address (Shown on standees & receipts)
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Shop 14, Chappan Dukan, New Palasia, Indore"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Google Business Review URL
              </label>
              <input
                type="url"
                value={formData.googleReviewUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                placeholder="https://g.page/r/your-id/review"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Authorization PIN * (For Visit & Reward Approval)
              </label>
              <input
                type="text"
                required
                value={formData.staffPin || '1234'}
                onChange={(e) => setFormData({ ...formData, staffPin: e.target.value })}
                placeholder="4-digit PIN (e.g. 1234)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-orange-400" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
