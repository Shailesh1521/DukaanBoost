import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Flame, Smartphone, Palette, IndianRupee, Eye } from 'lucide-react';
import { BusinessCategory } from '../types';

interface HeroProps {
  onOpenWizardWithCategory?: (category: BusinessCategory) => void;
  onOpenWizard: () => void;
  onScrollToSamples: () => void;
}

const POPULAR_CATEGORIES: Array<{ id: BusinessCategory; label: string; icon: string }> = [
  { id: 'cafe', label: 'Café & Eatery', icon: '☕' },
  { id: 'salon', label: 'Salon & Beauty', icon: '💇‍♀️' },
  { id: 'tiffin', label: 'Tiffin & Food', icon: '🍲' },
  { id: 'bakery', label: 'Home Baker', icon: '🎂' },
  { id: 'gym', label: 'Gym & Fitness', icon: '💪' },
  { id: 'boutique', label: 'Boutique & Fashion', icon: '👗' },
  { id: 'grocery', label: 'Kirana & Retail', icon: '🛒' },
  { id: 'tutor', label: 'Tutor & Coaching', icon: '📚' },
];

export const Hero: React.FC<HeroProps> = ({
  onOpenWizardWithCategory,
  onOpenWizard,
  onScrollToSamples,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-orange-50/70 via-white to-amber-50/30">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl"></div>
        <div className="absolute top-12 right-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-900 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
            <Flame className="w-4 h-4 text-orange-600 fill-orange-500 animate-bounce" />
            <span>Built for Indian Local Business Owners & Creators</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-orange-400"></span>
            <span className="hidden sm:inline-block text-orange-700 font-medium">Hinglish • Hindi • English</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            Apni Dukaan Ko Banao Superhit Brand with{' '}
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 bg-clip-text text-transparent underline decoration-orange-300 decoration-wavy decoration-2">
              Ready-To-Use AI Marketing Packs
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Stop sending boring plain text forwards. Generate high-converting <strong className="text-slate-900 font-semibold">WhatsApp promos</strong>, <strong className="text-slate-900 font-semibold">Instagram captions</strong>, festive discount ideas, and <strong className="text-slate-900 font-semibold">high-res 1080p posters</strong> in 2 minutes.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenWizard}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-orange-500 via-amber-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>Create My Promo Kit (₹0 Free Preview)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onScrollToSamples}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base px-6 py-4 rounded-xl border border-slate-300 shadow-xs hover:border-slate-400 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-orange-600" />
              <span>Inspect Live Sample Kits</span>
            </button>
          </div>

          {/* Value Proof Badges */}
          <div className="mt-8 pt-6 border-t border-orange-100/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>₹0 to preview & test</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp copy with emojis</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1080p high-res poster PNG</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Indian festive copy</span>
            </div>
          </div>
        </div>

        {/* Quick Category Starter Pills */}
        <div className="mt-12 bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-orange-100 shadow-sm max-w-4xl mx-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
            Select your business category to start immediately:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {POPULAR_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (onOpenWizardWithCategory) {
                    onOpenWizardWithCategory(cat.id);
                  } else {
                    onOpenWizard();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-900 transition-all cursor-pointer transform hover:scale-105"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
