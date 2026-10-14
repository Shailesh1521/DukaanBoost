import React, { useState } from 'react';
import { XCircle, CheckCircle2, Copy, Sparkles, MessageSquare, Image as ImageIcon, Flame } from 'lucide-react';

export const BeforeAfterShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'poster'>('whatsapp');
  const [copied, setCopied] = useState(false);

  const afterMessageText = `☕ *CHAI SHAI SPECIAL EVENING COMBO!* ☕\n\nShaam ki bhook aur kadak chai ki talab? Hum lekar aaye hain Indore ka favorite combo:\n\n👉 *Kulhad Masala Chai + 2 Crispy Samosas = Only ₹49/-* (Regular ₹69)\n\n📍 *Chai Shai & Snacks Corner, Chappan Dukan*\n⏰ *Valid 4 PM to 8 PM today!*\n\n📞 WhatsApp/Call to order: 9826012345`;

  const handleCopy = () => {
    navigator.clipboard.writeText(afterMessageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="how-it-works" className="py-16 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>Real Comparison</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Why 90% of Local Business WhatsApp Promos Get Ignored
          </h2>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            See the difference between plain text spam forwards and a structured, branded DukaanBoost campaign.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
          {/* BEFORE CARD */}
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Before (What Most Shops Send)</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <h3 className="font-bold text-slate-800 text-lg">Boring Plain Text Forward</h3>
              </div>

              {/* Mock WhatsApp Bubble */}
              <div className="bg-slate-100 rounded-xl p-4 font-sans text-sm text-slate-700 leading-relaxed border border-slate-200 mb-4">
                <p className="text-xs text-slate-400 font-medium mb-1">Forwarded message</p>
                <p>
                  Dear sir/mam, please visit our cafe Chai Shai today. We have discount on samosa and chai. Very good quality and fresh. Please forward to your friends and come. Contact 9826012345.
                </p>
              </div>

              {/* Why it fails list */}
              <div className="space-y-2 mt-4 text-xs sm:text-sm text-red-950">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Zero visual appeal — looks like generic spam forward.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Vague offer — no price hook, no deadline or urgency.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>Customers scroll right past without reading.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
              Average conversion rate: &lt; 0.5% (Wasted effort)
            </div>
          </div>

          {/* AFTER CARD */}
          <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-2xl border-2 border-orange-400 shadow-md p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3.5 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              <span>With DukaanBoost AI</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                    2
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg">Branded High-Conversion Pack</h3>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-orange-200 text-orange-800 hover:bg-orange-50 transition-colors cursor-pointer"
                  title="Copy sample copy"
                >
                  <Copy className="w-3.5 h-3.5 text-orange-600" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* Mock WhatsApp Bubble */}
              <div className="bg-[#e7fedb] rounded-xl p-4 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed border border-[#c3f0ac] shadow-xs relative">
                <p className="whitespace-pre-line font-medium">{afterMessageText}</p>
                <div className="text-[10px] text-slate-500 text-right mt-1 font-semibold flex items-center justify-end gap-1">
                  <span>4:15 PM</span>
                  <span className="text-blue-500 font-bold">✓✓</span>
                </div>
              </div>

              {/* Why it works list */}
              <div className="space-y-2 mt-4 text-xs sm:text-sm text-emerald-950 font-medium">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Clear Price Anchor:</strong> "Combo @ ₹49 (Regular ₹69)" shows instant tangible value.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Urgency Window:</strong> "Valid 4 PM to 8 PM today" drives immediate action.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Paired Branded Poster:</strong> Eye-catching 1080p visual for WhatsApp Status & Instagram Story.</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-orange-100 text-xs text-orange-800 font-bold text-center">
              Estimated response rate: 4x–8x higher customer inquiries
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
