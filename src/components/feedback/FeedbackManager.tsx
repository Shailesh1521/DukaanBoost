import React, { useState, useEffect } from 'react';
import { FeedbackSubmission, BusinessProfile } from '../../types';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  User,
  Phone,
  Filter,
  ExternalLink,
} from 'lucide-react';

interface FeedbackManagerProps {
  business: BusinessProfile;
  onOpenCustomerFeedback: () => void;
}

export const FeedbackManager: React.FC<FeedbackManagerProps> = ({
  business,
  onOpenCustomerFeedback,
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackSubmission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 5.0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchFeedback = () => {
    const bizId = business.id || 'chai-shai-cafe';
    setLoading(true);
    fetch(`/api/businesses/${bizId}/feedback`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.feedback) {
          setFeedbackList(data.feedback);
          if (data.stats) setStats(data.stats);
        }
      })
      .catch((err) => console.error('Error fetching feedback:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, [business.id]);

  const copyFeedbackUrl = () => {
    const url = `${window.location.origin}/?biz=${business.id || 'chai-shai-cafe'}#customer-feedback`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredList = feedbackList.filter((f) => {
    if (starFilter === 'all') return true;
    return f.rating === starFilter;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Private Customer Feedback Inbox
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Read direct, unedited ratings from genuine patrons. Keep constructive feedback private to your management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyFeedbackUrl}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Form URL'}</span>
          </button>

          <button
            onClick={onOpenCustomerFeedback}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Test Customer View</span>
          </button>
        </div>
      </div>

      {/* Ratings & Breakdown Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Overall Score Box (4 cols) */}
        <div className="md:col-span-4 bg-gradient-to-br from-purple-50 via-white to-amber-50 p-6 rounded-2xl border border-purple-200/80 text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
            Average Customer Rating
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-display font-black text-5xl text-slate-900">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="text-amber-500 text-3xl">★</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Based on {stats.total} verified submissions</p>
        </div>

        {/* Star Breakdown Bars (8 cols) */}
        <div className="md:col-span-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.breakdown[star] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-8 font-bold text-slate-700 flex items-center justify-end gap-0.5">
                  <span>{star}</span>
                  <span className="text-amber-500">★</span>
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right font-mono font-semibold text-slate-500">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Submissions Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-800">Recent Customer Reviews</h3>

          {/* Star Filter Pill */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
            >
              <option value="all">All Ratings ({feedbackList.length})</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars & Below</option>
            </select>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No feedback found for the selected filter.
          </div>
        ) : (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredList.map((fb) => (
              <div
                key={fb.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Stars */}
                    <div className="flex text-amber-500 text-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>{star <= fb.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="font-bold text-xs text-slate-900">{fb.rating}.0 / 5.0</span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {new Date(fb.createdAt).toLocaleDateString()} at{' '}
                    {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {fb.comment && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    "{fb.comment}"
                  </p>
                )}

                {/* Tags */}
                {fb.tags && fb.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fb.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-100"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Customer Contact Details (if shared) */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-600 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fb.customerName || 'Anonymous Customer'}</span>
                    </span>
                    {fb.customerPhone && (
                      <a
                        href={`https://wa.me/${fb.customerPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{fb.customerPhone}</span>
                      </a>
                    )}
                  </div>
                  {fb.marketingConsent && (
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      ✓ Consented for promo offers
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
