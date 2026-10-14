import React, { useState, useEffect } from 'react';
import { DigitalMenu, BusinessProfile, MenuItem } from '../../types';
import { Utensils, Search, Phone, ArrowLeft, Star, Clock, MapPin, Share2 } from 'lucide-react';

interface CustomerMenuViewProps {
  businessId?: string;
  onBackToDashboard?: () => void;
}

export const CustomerMenuView: React.FC<CustomerMenuViewProps> = ({
  businessId = 'chai-shai-cafe',
  onBackToDashboard,
}) => {
  const [menu, setMenu] = useState<DigitalMenu | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/menu/${businessId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.menu) {
          setMenu(data.menu);
          if (data.business) setBusiness(data.business);
        }
      })
      .catch((err) => console.error('Error fetching customer menu:', err))
      .finally(() => setLoading(false));
  }, [businessId]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6 text-slate-500 text-sm">
        Loading delicious menu...
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Utensils className="w-10 h-10 text-slate-300" />
        <p className="font-bold text-slate-800">Menu not found or not published yet.</p>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
          >
            ← Return to Dashboard
          </button>
        )}
      </div>
    );
  }

  const filteredItems = menu.items.filter((item) => {
    if (vegOnly && item.dietaryTag !== 'veg' && item.dietaryTag !== 'vegan') {
      return false;
    }
    if (activeCategory !== 'all' && item.categoryId !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen border-x border-slate-200 shadow-xl pb-16 font-sans">
      {/* Top Mobile Bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between">
        {onBackToDashboard ? (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-orange-600 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-orange-600">DukaanBoost Menu</span>
        )}

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Live Digital Menu
        </span>
      </div>

      {/* Brand Hero Header */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-6 rounded-b-3xl space-y-2 text-center">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">
          {business?.businessName || menu.businessName}
        </h1>
        {business?.city && (
          <p className="text-xs text-orange-100 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{business.city}</span>
          </p>
        )}
        {business?.contactPhone && (
          <div className="pt-2">
            <a
              href={`tel:${business.contactPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call / Order: {business.contactPhone}</span>
            </a>
          </div>
        )}
      </div>

      {/* Search & Dietary Controls */}
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, chai, combos..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 bg-slate-50"
          />
        </div>

        {/* Dietary Switch */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              vegOnly
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <span>🟢 Pure Veg Only</span>
          </button>

          <span className="text-[11px] text-slate-400">
            {filteredItems.length} items available
          </span>
        </div>

        {/* Categories Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          {menu.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items Feed */}
      <div className="px-4 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No dishes found matching your criteria.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                item.isAvailable ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs">
                    {item.dietaryTag === 'non_veg' ? '🔴' : item.dietaryTag === 'egg' ? '🟡' : '🟢'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  {item.isSpecial && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      ★ Bestseller
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">{item.description}</p>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">₹{item.price}</span>
                  {!item.isAvailable && (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      Sold Out
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="p-6 text-center text-xs text-slate-400 space-y-1">
        <p>Prices in Indian Rupees (₹) • Taxes as applicable</p>
        <p className="text-[10px]">Powered by DukaanBoost AI Contactless Digital Menu</p>
      </div>
    </div>
  );
};
