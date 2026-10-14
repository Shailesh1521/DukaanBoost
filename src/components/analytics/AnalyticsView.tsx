import React, { useState, useEffect } from 'react';
import { AnalyticsSummary, BusinessProfile } from '../../types';
import {
  TrendingUp,
  QrCode,
  Eye,
  MessageSquare,
  Gift,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  Info,
} from 'lucide-react';

interface AnalyticsViewProps {
  business: BusinessProfile;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ business }) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const bizId = business.id || 'chai-shai-cafe';
    setLoading(true);
    fetch(`/api/analytics/${bizId}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData) setData(resData);
      })
      .catch((err) => console.error('Error fetching analytics:', err))
      .finally(() => setLoading(false));
  }, [business.id]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading business analytics...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center text-slate-400 text-sm">No analytics data recorded yet.</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Real Customer Engagement Analytics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track genuine customer scans, digital menu engagement, feedback counts, and reward redemptions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-Time Store Activity</span>
        </div>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <QrCode className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] font-bold uppercase">Scans</span>
          </div>
          <p className="font-display font-black text-2xl text-slate-900">{data.totalQrScans}</p>
          <p className="text-[11px] text-slate-500 font-medium">Total QR Scans</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold uppercase">Views</span>
          </div>
          <p className="font-display font-black text-2xl text-slate-900">{data.totalMenuViews}</p>
          <p className="text-[11px] text-slate-500 font-medium">Menu Pageviews</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] font-bold uppercase">Reviews</span>
          </div>
          <p className="font-display font-black text-2xl text-slate-900">{data.totalFeedbackCount}</p>
          <p className="text-[11px] text-slate-500 font-medium">Feedback Entries</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-amber-500 text-sm">★</span>
            <span className="text-[10px] font-bold uppercase">Rating</span>
          </div>
          <p className="font-display font-black text-2xl text-amber-600">{data.averageRating.toFixed(1)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Average Rating</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">Visits</span>
          </div>
          <p className="font-display font-black text-2xl text-emerald-700">{data.totalLoyaltyVisits}</p>
          <p className="text-[11px] text-slate-500 font-medium">Approved Visits</p>
        </div>

        {/* Metric 6 */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase">Redeemed</span>
          </div>
          <p className="font-display font-black text-2xl text-slate-900">{data.totalRewardsRedeemed}</p>
          <p className="text-[11px] text-slate-500 font-medium">Rewards Handed</p>
        </div>
      </div>

      {/* Activity Timeline & Honest Metric Disclosures */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Timeline (7 cols) */}
        <div className="md:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-600" />
            <span>Recent Customer Engagement Events</span>
          </h3>

          {data.recentActivity && data.recentActivity.length > 0 ? (
            <div className="space-y-2 pt-1">
              {data.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="font-semibold text-slate-800">{act.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No recent activity recorded yet.</p>
          )}
        </div>

        {/* Metric Accuracy Disclaimer (5 cols) */}
        <div className="md:col-span-5 bg-blue-50/60 p-6 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>How Metrics are Measured</span>
          </div>
          <p className="leading-relaxed">
            • <strong>QR Scans & Pageviews:</strong> Count actual requests served to customer mobile devices when the QR is opened.
          </p>
          <p className="leading-relaxed">
            • <strong>Approved Visits:</strong> Strictly counts customer check-ins that passed server-side staff verification or the active daily store code.
          </p>
          <p className="leading-relaxed">
            • <strong>Zero Fake Revenue Claims:</strong> We never estimate or fabricate customer spending figures unless verified through your billing counter.
          </p>
        </div>
      </div>
    </div>
  );
};
