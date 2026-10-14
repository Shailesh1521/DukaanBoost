import React, { useState } from 'react';
import { PromoKit, BusinessProfile } from '../types';
import { PosterStudio } from './PosterStudio';
import {
  Palette,
  MessageCircle,
  Camera,
  Hash,
  Lightbulb,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Phone,
} from 'lucide-react';

interface ResultsWorkspaceProps {
  kit: PromoKit;
  profile?: BusinessProfile;
  onCreateNew: () => void;
  onOrderPack: (packType: 'starter' | 'business') => void;
}

export const ResultsWorkspace: React.FC<ResultsWorkspaceProps> = ({
  kit,
  profile,
  onCreateNew,
  onOrderPack,
}) => {
  const [activeTab, setActiveTab] = useState<'poster' | 'whatsapp' | 'captions' | 'hashtags' | 'offers'>('poster');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAllTextBrief = () => {
    const fullText = `=== DUKAANBOOST AI PROMOTIONAL KIT ===
Business: ${kit.businessName} (${kit.category})
Language: ${kit.language}
Date: ${new Date(kit.generatedAt).toLocaleDateString()}

--- HEADLINES ---
${kit.headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

--- WHATSAPP MESSAGES ---
${kit.whatsappMessages.map((m, i) => `[${m.title}] (${m.objective})\n${m.text}\n`).join('\n---\n')}

--- INSTAGRAM CAPTIONS ---
${kit.captions.map((c, i) => `Caption #${i + 1}:\n${c.hook}\n${c.text}\n${c.hashtags}\n`).join('\n')}

--- HASHTAGS ---
${kit.hashtags.join(' ')}

--- OFFER IDEAS ---
${kit.offerIdeas.map((o, i) => `${i + 1}. ${o.title}\nHow: ${o.howItWorks}\nMargin: ${o.marginTip}\n`).join('\n')}

CTA: ${kit.ctaMessage}
`;
    copyToClipboard(fullText, 'full_brief');
  };

  return (
    <section id="results-workspace" className="py-12 bg-slate-100/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Workspace Top Header Bar */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kit Generated Successfully</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {kit.category}
              </span>
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                {kit.language}
              </span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 tracking-tight">
              {kit.businessName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ready-to-use promotional content studio. Explore all tabs below to copy copy, edit poster, and launch campaigns.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyAllTextBrief}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {copiedId === 'full_brief' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied Entire Kit!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Complete Kit Text</span>
                </>
              )}
            </button>

            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Create New Kit</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('poster')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'poster'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/25'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 Branded Poster Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>💬 3 WhatsApp Promos</span>
          </button>

          <button
            onClick={() => setActiveTab('captions')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'captions'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📸 5 Social Captions</span>
          </button>

          <button
            onClick={() => setActiveTab('hashtags')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'hashtags'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>#️⃣ 10 Local Hashtags</span>
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'offers'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/25'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>💡 3 Offer Ideas</span>
          </button>
        </div>

        {/* Tab 1: POSTER STUDIO */}
        {activeTab === 'poster' && (
          <div>
            <PosterStudio kit={kit} />
          </div>
        )}

        {/* Tab 2: WHATSAPP PROMOS */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="max-w-2xl mb-6">
                <h3 className="font-display font-extrabold text-2xl text-slate-900">
                  Ready-To-Send WhatsApp Broadcast & Status Messages
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Formatted specifically for WhatsApp with bold headings, clean bullet points, emojis, and clear call-to-actions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {kit.whatsappMessages.map((msg, index) => {
                  const id = `wa_${index}`;
                  return (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                            {msg.title}
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.text, id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-white transition-colors cursor-pointer"
                            title="Copy text"
                          >
                            {copiedId === id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mb-3">
                          <strong>Objective:</strong> {msg.objective}
                        </p>

                        {/* WhatsApp Bubble Preview */}
                        <div className="bg-[#dcf8c6] text-slate-900 rounded-2xl p-4 text-xs sm:text-sm font-sans whitespace-pre-line leading-relaxed shadow-xs border border-[#c3e6aa]">
                          {msg.text}
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between">
                        <button
                          onClick={() => copyToClipboard(msg.text, id)}
                          className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId === id ? 'Copied!' : 'Copy Text'}</span>
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(msg.text)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <span>Send / Test</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SOCIAL MEDIA CAPTIONS */}
        {activeTab === 'captions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="max-w-2xl mb-6">
                <h3 className="font-display font-extrabold text-2xl text-slate-900">
                  5 High-Engagement Instagram & Facebook Captions
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Designed with scroll-stopping hooks, authentic storytelling, and local hashtags.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kit.captions.map((cap, index) => {
                  const id = `cap_${index}`;
                  const fullCaption = `${cap.hook}\n\n${cap.text}\n\n${cap.hashtags}`;
                  return (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-md">
                            Post #{index + 1}
                          </span>
                          <button
                            onClick={() => copyToClipboard(fullCaption, id)}
                            className="text-slate-500 hover:text-purple-700 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                          >
                            {copiedId === id ? (
                              <Check className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mb-2 leading-snug">{cap.hook}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-4">{cap.text}</p>
                        <p className="text-[11px] font-medium text-purple-600 leading-relaxed">{cap.hashtags}</p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => copyToClipboard(fullCaption, id)}
                          className="w-full py-2 text-xs font-bold rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId === id ? 'Caption Copied!' : 'Copy Caption & Hashtags'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: HASHTAGS */}
        {activeTab === 'hashtags' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl text-slate-900">
                  10 Niche-Relevant Indian Local Hashtags
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Boost your discoverability on Instagram Explore, Google, and local search.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(kit.hashtags.join(' '), 'all_tags')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                {copiedId === 'all_tags' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied All 10!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy All 10 Hashtags</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {kit.hashtags.map((tag, idx) => {
                const id = `tag_${idx}`;
                return (
                  <button
                    key={idx}
                    onClick={() => copyToClipboard(tag, id)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-800 text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1"
                  >
                    <span>{tag}</span>
                    <span className="text-[10px] text-slate-400">
                      {copiedId === id ? '✓ Copied' : 'Click to copy'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: PRACTICAL OFFER IDEAS */}
        {activeTab === 'offers' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">
                3 Practical Promotional Offer Strategies
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Customized for your business category to protect gross margins while maximizing customer action.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kit.offerIdeas.map((idea, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-6 border border-amber-200/80 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-extrabold flex items-center justify-center text-sm mb-4">
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-slate-900 text-base mb-2">{idea.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      <strong className="text-slate-800">How to execute:</strong> {idea.howItWorks}
                    </p>
                    <div className="bg-amber-100/60 rounded-xl p-3.5 border border-amber-200 text-xs text-amber-950 font-medium">
                      <strong>Margin & Cost Tip:</strong> {idea.marginTip}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-200/50 text-[11px] text-amber-900 font-semibold">
                    🎯 Best for: {idea.bestFor}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPGRADE CALLOUT BANNER (Conversion to ₹99 or ₹199) */}
        <div className="mt-10 bg-gradient-to-r from-slate-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 inline-block mb-3">
              Need A Hand-Tailored Pack?
            </span>
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight">
              Get Your Complete Custom Pack for Just ₹99
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Want our team to handcraft your festival campaign, format 3 distinct visual variations, and deliver your files directly to your WhatsApp?
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => onOrderPack('starter')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/30 transition-all cursor-pointer text-center"
            >
              Order Starter Pack (₹99)
            </button>
            <button
              onClick={() => onOrderPack('business')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-colors cursor-pointer text-center"
            >
              Business Pack (₹199)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
