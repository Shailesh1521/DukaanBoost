import React, { useState } from 'react';
import { X, Search, Clock, CheckCircle2, AlertCircle, MessageCircle, ExternalLink } from 'lucide-react';
import { StoreSettings } from '../types';

interface OrderLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSettings: StoreSettings;
  defaultOrderId?: string;
}

export const OrderLookupModal: React.FC<OrderLookupModalProps> = ({
  isOpen,
  onClose,
  storeSettings,
  defaultOrderId = '',
}) => {
  const [orderIdInput, setOrderIdInput] = useState<string>(defaultOrderId);
  const [loading, setLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const cleanId = orderIdInput.trim();
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Order not found. Please double-check your Order Reference ID (e.g. DKB-2026-XXXX).');
        }
        throw new Error('Could not fetch order details. Please try again.');
      }

      const data = await res.json();
      setOrderData(data);
    } catch (err: any) {
      setError(err.message || 'Error looking up order.');
    } finally {
      setLoading(false);
    }
  };

  const cleanSellerPhone = storeSettings.sellerWhatsApp.replace(/[^0-9]/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-400" />
            <h3 className="font-display font-bold text-lg">Track Your Order Status</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleLookup} className="flex gap-2">
            <input
              type="text"
              required
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="e.g. DKB-2026-8942"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {orderData && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Order Reference</span>
                  <p className="font-mono font-extrabold text-slate-900 text-base">{orderData.id}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Amount</span>
                  <p className="font-bold text-slate-900 text-base">₹{orderData.amount}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500">Package:</span>
                <p className="font-bold text-slate-900 text-sm">{orderData.packageTitle}</p>
                {orderData.businessName && (
                  <p className="text-xs text-slate-600">Business: {orderData.businessName}</p>
                )}
              </div>

              {/* Payment Status Pill */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Payment Verification Status
                </span>
                {orderData.paymentStatus === 'verified' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Payment Verified via UPI</span>
                  </div>
                ) : orderData.paymentStatus === 'rejected' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-800 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Payment Verification Issue</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pending Manual Verification</span>
                  </div>
                )}
              </div>

              {/* Fulfillment Status Pill */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Delivery / Fulfillment
                </span>
                {orderData.fulfillmentStatus === 'completed' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Completed & Delivered on WhatsApp</span>
                  </div>
                ) : orderData.fulfillmentStatus === 'in_progress' ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold">
                    <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>In Progress — Designer is customizing your files</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold">
                    <span>Queued</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                Created: {new Date(orderData.createdAt).toLocaleString()}
              </div>

              {/* Direct WhatsApp Contact link for this order */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/${cleanSellerPhone}?text=${encodeURIComponent(
                    `Hi DukaanBoost, I am checking status on my Order #${orderData.id}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Ask Support on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
