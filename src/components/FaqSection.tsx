import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Shield, MessageCircle } from 'lucide-react';
import { StoreSettings } from '../types';

interface FaqSectionProps {
  storeSettings: StoreSettings;
}

const FAQS = [
  {
    q: 'How does the payment process work without an automated gateway?',
    a: 'We use an honest, transparent manual UPI payment system common across Indian commerce. After placing an order, you receive our verified Seller UPI ID and dynamic QR code. You pay using your preferred app (Google Pay, PhonePe, Paytm, or BHIM) and submit your 12-digit UPI UTR reference. Our team verifies the transaction and delivers your customized promotional files directly to your WhatsApp.',
  },
  {
    q: 'Can I test DukaanBoost AI for free first?',
    a: 'Yes, 100%! You can generate a free preview kit right in your browser without entering any payment or credit card details. You can inspect sample kits, test WhatsApp copy, and even export the sample poster.',
  },
  {
    q: 'How quickly will I receive my customized paid pack?',
    a: 'For Starter Packs (₹99), delivery takes between 12 to 24 hours directly on WhatsApp. For Business Packs (₹199), you receive 3 campaign variations within 24 hours. Digital Menu Setups (₹299) take 24 to 48 hours as we format and typeset all your menu items cleanly.',
  },
  {
    q: 'Can I post these posters on WhatsApp Status and Instagram?',
    a: 'Yes! Our built-in Poster Studio allows you to toggle between Square 1:1 (ideal for Instagram feed posts and WhatsApp profile photos) and Vertical 9:16 (ideal for Instagram Stories, Reels cover, and WhatsApp Status). Both export in crystal clear 1080p resolution.',
  },
  {
    q: 'Which languages are supported?',
    a: 'We fully support Hinglish (Hindi written in English alphabet, e.g. "Aapki dukaan ka best offer"), Shuddh/Colloquial Hindi (हिंदी), and Indian English. You can select your preferred tone in the creation wizard.',
  },
  {
    q: 'What is the ₹299 Digital Menu / Price List service?',
    a: 'If you run a café, tiffin center, salon, or retail shop, we will manually typeset your product list or food menu into an attractive, mobile-optimized digital PDF and generate a custom tabletop QR code graphic you can print and place on tables or at your billing counter.',
  },
  {
    q: 'What about privacy and payment security?',
    a: 'We never ask for your UPI PIN, ATM card details, or banking passwords. You only send payment directly through your own trusted UPI app. Your business details are used solely to draft your promotional marketing materials.',
  },
];

export const FaqSection: React.FC<FaqSectionProps> = ({ storeSettings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const cleanPhone = storeSettings.sellerWhatsApp.replace(/[^0-9]/g, '');

  return (
    <section id="faq" className="py-20 bg-white border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-slate-500 text-sm sm:text-base">
            Everything you need to know about our promotional packs, UPI payments, and delivery.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleIndex(idx)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Contact Help Box */}
        <div className="mt-12 bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="font-bold text-slate-900 text-sm">Still have a question about your business?</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Chat directly with our founder on WhatsApp for instant assistance.
            </p>
          </div>
          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              'Hi DukaanBoost! I have a question before ordering my promotional pack.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
