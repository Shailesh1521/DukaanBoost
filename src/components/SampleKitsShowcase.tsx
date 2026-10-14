import React, { useState } from 'react';
import { SAMPLE_BUSINESS_PROFILES } from '../sampleData';
import { PromoKit, BusinessCategory } from '../types';
import { Sparkles, MessageCircle, Copy, Check, ArrowRight, Share2, Tag, Lightbulb, Palette } from 'lucide-react';

interface SampleKitsShowcaseProps {
  onLoadSampleIntoWorkspace: (kit: PromoKit) => void;
}

export const SampleKitsShowcase: React.FC<SampleKitsShowcaseProps> = ({
  onLoadSampleIntoWorkspace,
}) => {
  const [selectedKey, setSelectedKey] = useState<string>('cafe');
  const [activeTab, setActiveTab] = useState<'poster' | 'whatsapp' | 'captions' | 'hashtags' | 'offers'>('whatsapp');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sample = SAMPLE_BUSINESS_PROFILES[selectedKey] || SAMPLE_BUSINESS_PROFILES['cafe'];
  const kit = sample.kit;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="sample-kits" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Try Before You Build</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Inspect Ready-To-Use Marketing Packs
          </h2>
          <p className="mt-3 text-slate-600 text-base sm:text-lg">
            See actual complete kits generated for real Indian small businesses. Click any to open in our studio.
          </p>
        </div>

        {/* Business Category Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedKey('cafe')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedKey === 'cafe'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>☕</span>
            <span>Chai Shai Café (Indore)</span>
          </button>
          <button
            onClick={() => setSelectedKey('salon')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedKey === 'salon'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>💇‍♀️</span>
            <span>Roop Glamour Salon (Jaipur)</span>
          </button>
          <button
            onClick={() => setSelectedKey('tiffin')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedKey === 'tiffin'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🍲</span>
            <span>Maa Ki Rasoi Tiffin (Pune)</span>
          </button>
          <button
            onClick={() => setSelectedKey('bakery')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
              selectedKey === 'bakery'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25 scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🎂</span>
            <span>Sweet Hearth Bakery (Bengaluru)</span>
          </button>
        </div>

        {/* Selected Sample Showcase Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Header of the sample */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-extrabold text-2xl text-slate-900">{kit.businessName}</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {kit.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Active Offer: <span className="text-slate-800 font-semibold">{sample.profile.offerDiscount}</span> • City: {sample.profile.city}
              </p>
            </div>

            <button
              onClick={() => onLoadSampleIntoWorkspace(kit)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Palette className="w-4 h-4 text-yellow-200" />
              <span>Customize & Download This Kit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Subtabs for content inspection */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>3 WhatsApp Promos</span>
            </button>
            <button
              onClick={() => setActiveTab('captions')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'captions'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>📸</span>
              <span>5 Social Captions</span>
            </button>
            <button
              onClick={() => setActiveTab('hashtags')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'hashtags'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>10 Hashtags</span>
            </button>
            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'offers'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>3 Practical Offer Ideas</span>
            </button>
          </div>

          {/* Content Pane */}
          <div className="mt-6">
            {/* WHATSAPP PROMOS */}
            {activeTab === 'whatsapp' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kit.whatsappMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {msg.title}
                        </span>
                        <button
                          onClick={() => handleCopy(msg.text, idx)}
                          className="text-slate-400 hover:text-emerald-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copy WhatsApp text"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mb-3">Goal: {msg.objective}</p>
                      <div className="bg-[#f0fdf4] rounded-xl p-3.5 text-xs text-slate-800 font-sans whitespace-pre-line leading-relaxed border border-[#dcfce7]">
                        {msg.text}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Ready to blast</span>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(msg.text)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <span>Open WhatsApp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SOCIAL CAPTIONS */}
            {activeTab === 'captions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kit.captions.slice(0, 3).map((cap, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                          Caption #{idx + 1}
                        </span>
                        <button
                          onClick={() => handleCopy(`${cap.hook}\n\n${cap.text}\n\n${cap.hashtags}`, idx + 10)}
                          className="text-slate-400 hover:text-purple-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {copiedIndex === idx + 10 ? (
                            <Check className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mb-2">{cap.hook}</p>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{cap.text}</p>
                      <p className="text-[11px] text-purple-600 font-medium">{cap.hashtags}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HASHTAGS */}
            {activeTab === 'hashtags' && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-sm">Niche Local Indian Hashtags:</h4>
                  <button
                    onClick={() => handleCopy(kit.hashtags.join(' '), 99)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {copiedIndex === 99 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 99 ? 'Copied All!' : 'Copy All 10 Hashtags'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {kit.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleCopy(tag, idx + 50)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors cursor-pointer"
                      title="Click to copy individual tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PRACTICAL OFFER IDEAS */}
            {activeTab === 'offers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kit.offerIdeas.map((offer, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm mb-3">
                      {idx + 1}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-2">{offer.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      <strong>How it works:</strong> {offer.howItWorks}
                    </p>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60 text-[11px] text-amber-950">
                      <strong>Margin & Execution:</strong> {offer.marginTip}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
