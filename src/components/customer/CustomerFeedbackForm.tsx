import React, { useState } from 'react';
import { Star, CheckCircle2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { BusinessProfile } from '../../types';

interface CustomerFeedbackFormProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
}

const AVAILABLE_TAGS = [
  'Food Quality',
  'Fast Service',
  'Cleanliness',
  'Polite Staff',
  'Cozy Ambience',
  'Value for Money',
  'Quick Billing',
  'Hygiene Standard',
];

export const CustomerFeedbackForm: React.FC<CustomerFeedbackFormProps> = ({
  business,
  onBackToDashboard,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Food Quality', 'Fast Service']);
  const [comment, setComment] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [marketingConsent, setMarketingConsent] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id || 'chai-shai-cafe',
          rating,
          tags: selectedTags,
          comment,
          customerName,
          customerPhone,
          marketingConsent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Error sending feedback.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <span className="text-xs font-bold text-orange-600">DukaanBoost Feedback</span>
        )}

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
          Customer Review
        </span>
      </div>

      {submitted ? (
        /* SUCCESS CONFIRMATION VIEW */
        <div className="p-8 text-center space-y-4 my-12">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-slate-900">
            Thank You for Your Review!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
            Your feedback has been received directly by the management of <strong>{business.businessName}</strong>.
          </p>

          <div className="pt-6">
            <button
              onClick={() => {
                setSubmitted(false);
                setComment('');
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
            >
              Submit Another Review
            </button>
          </div>
        </div>
      ) : (
        /* FEEDBACK FORM */
        <div className="p-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="font-display font-extrabold text-2xl text-slate-900">
              {business.businessName}
            </h1>
            <p className="text-xs text-slate-500">
              How was your experience today? Rate us below:
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1 to 5 Star Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="text-4xl transition-transform hover:scale-125 focus:outline-hidden cursor-pointer p-1"
                    >
                      <span className={isFilled ? 'text-amber-500' : 'text-slate-300'}>★</span>
                    </button>
                  );
                })}
              </div>
              <p className="font-bold text-xs text-slate-800">
                {rating === 5
                  ? '🌟 Excellent! Loved it'
                  : rating === 4
                  ? '👍 Very Good'
                  : rating === 3
                  ? '👌 Average'
                  : rating === 2
                  ? '👎 Below Expectations'
                  : '⚠️ Poor experience'}
              </p>
            </div>

            {/* Quick Tag Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What stood out? (Select tags)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Comments */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Comments or Suggestions
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you enjoyed or what we can improve..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            {/* Customer Contact */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9826012345"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="marketingConsent"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="rounded text-purple-600 mt-0.5 cursor-pointer"
                />
                <label htmlFor="marketingConsent" className="text-[11px] text-slate-500 cursor-pointer">
                  I agree to receive occasional special festival offers or discounts from {business.businessName} on WhatsApp.
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Send Feedback'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
