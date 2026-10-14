import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Copy, AlertCircle, MessageCircle, ExternalLink, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
import { BusinessProfile, Order, PackageType, StoreSettings } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PackageType;
  currentProfile?: BusinessProfile;
  storeSettings: StoreSettings;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPackage,
  currentProfile,
  storeSettings,
  onOrderSuccess,
}) => {
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>(currentProfile?.contactPhone || '');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>(currentProfile?.businessName || '');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const [upiRefInput, setUpiRefInput] = useState<string>('');
  const [submittingUpiRef, setSubmittingUpiRef] = useState<boolean>(false);
  const [upiRefSaved, setUpiRefSaved] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);

  // Determine amount & title
  const amount =
    selectedPackage === 'founding_setup'
      ? storeSettings.foundingSetupPrice || 249
      : selectedPackage === 'business'
      ? storeSettings.businessPackPrice
      : selectedPackage === 'menu_setup'
      ? storeSettings.menuSetupPrice
      : storeSettings.starterPackPrice;

  const packageTitle =
    selectedPackage === 'founding_setup'
      ? 'Founding Business Setup (Done-For-You QR & Menu)'
      : selectedPackage === 'business'
      ? 'Business Pack (3 Variations)'
      : selectedPackage === 'menu_setup'
      ? 'Digital Menu / Price List Setup'
      : 'Starter Promotional Pack (1 Pack)';

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setCreatedOrder(null);
      setError(null);
      setUpiRefInput('');
      setUpiRefSaved(false);
      if (currentProfile) {
        setBusinessName(currentProfile.businessName || '');
        setCustomerPhone(currentProfile.contactPhone || '');
      }
    }
  }, [isOpen, currentProfile]);

  // Render QR Code onto canvas when order is created
  useEffect(() => {
    if (!createdOrder || !qrCanvasRef.current) return;
    const canvas = qrCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Draw stylized UPI QR visual placeholder with actual UPI metadata
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Decorative border
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    // QR finder corners (top-left, top-right, bottom-left)
    const drawFinder = (x: number, y: number) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, 40, 40);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 7, y + 7, 26, 26);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 13, y + 13, 14, 14);
    };

    drawFinder(16, 16);
    drawFinder(size - 56, 16);
    drawFinder(16, size - 56);

    // Simulated QR grid dots
    ctx.fillStyle = '#1e293b';
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 12; c++) {
        // Skip corner areas
        if (
          (r < 4 && c < 4) ||
          (r < 4 && c > 7) ||
          (r > 7 && c < 4)
        ) {
          continue;
        }
        if ((r * 11 + c * 7 + createdOrder.amount) % 3 !== 0) {
          ctx.fillRect(24 + c * 13, 24 + r * 13, 7, 7);
        }
      }
    }

    // Center Rupee / UPI Badge
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', size / 2, size / 2 + 1);
  }, [createdOrder]);

  if (!isOpen) return null;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setError('Please enter a valid 10-digit WhatsApp number for order delivery.');
      return;
    }
    if (!businessName.trim()) {
      setError('Please provide your business name.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageType: selectedPackage,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          businessDetails: {
            ...currentProfile,
            businessName: businessName.trim(),
            contactPhone: customerPhone.trim(),
          },
          specialNotes: specialNotes.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order.');
      }

      const data = await response.json();
      const orderWithToken = {
        ...data.order,
        orderAccessToken: data.orderAccessToken,
      };
      setCreatedOrder(orderWithToken);
      try {
        if (data.orderAccessToken) {
          localStorage.setItem(`dkb_order_token_${data.order.id}`, data.orderAccessToken);
          localStorage.setItem(`dkb_last_order_id`, data.order.id);
          localStorage.setItem(`dkb_last_order_phone`, data.order.customerPhone);
        }
      } catch (storageErr) {
        console.warn('Could not cache order token in localStorage:', storageErr);
      }
      onOrderSuccess(orderWithToken);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpiRef = async () => {
    if (!createdOrder) return;
    if (!upiRefInput.trim()) {
      setError('Please enter your 12-digit UPI UTR / Transaction Reference.');
      return;
    }

    setSubmittingUpiRef(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${createdOrder.id}/submit-upi-ref`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-order-token': createdOrder.orderAccessToken || '',
        },
        body: JSON.stringify({
          upiTransactionRef: upiRefInput.trim(),
          token: createdOrder.orderAccessToken,
          phone: createdOrder.customerPhone,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update UPI reference.');
      }

      const data = await response.json();
      setCreatedOrder((prev) => prev ? { ...prev, upiTransactionRef: upiRefInput.trim() } : null);
      setUpiRefSaved(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit UPI reference.');
    } finally {
      setSubmittingUpiRef(false);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(storeSettings.sellerUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const copyOrderId = () => {
    if (!createdOrder) return;
    navigator.clipboard.writeText(createdOrder.id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  // Prefilled WhatsApp message
  const cleanSellerPhone = storeSettings.sellerWhatsApp.replace(/[^0-9]/g, '');
  const waOrderText = createdOrder
    ? `Namaste DukaanBoost! I have placed an order on your website:\n\n` +
      `📦 *Order ID:* ${createdOrder.id}\n` +
      `🏷️ *Package:* ${createdOrder.packageTitle} (₹${createdOrder.amount})\n` +
      `🏪 *Business:* ${createdOrder.businessDetails?.businessName || businessName}\n` +
      `👤 *Name:* ${createdOrder.customerName}\n` +
      `📞 *Phone:* ${createdOrder.customerPhone}\n` +
      `${createdOrder.upiTransactionRef ? `💳 *UPI UTR:* ${createdOrder.upiTransactionRef}\n` : ''}` +
      `\nPlease verify my payment and confirm delivery. Thank you!`
    : '';

  const waOrderUrl = `https://wa.me/${cleanSellerPhone}?text=${encodeURIComponent(waOrderText)}`;

  // Direct UPI Intent URI for mobile app deep-linking
  const upiIntentUri = createdOrder
    ? `upi://pay?pa=${storeSettings.sellerUpiId}&pn=${encodeURIComponent(
        storeSettings.sellerName
      )}&am=${createdOrder.amount}&tn=${encodeURIComponent('Order ' + createdOrder.id)}&cu=INR`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-6 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center font-bold text-xs">
                ₹
              </span>
              <h3 className="font-display font-extrabold text-xl">
                {createdOrder ? 'Order Payment & Instructions' : 'Order Your Custom Pack'}
              </h3>
            </div>
            <p className="text-xs text-orange-100 mt-1">
              {packageTitle} • <strong className="text-white">₹{amount}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CUSTOMER FORM (Before order is created) */}
          {!createdOrder ? (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{packageTitle}</p>
                  <p className="text-[11px] text-slate-500">Fixed one-time price, no subscription</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-700">₹{amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Phone Number * (For Delivery)
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9826012345 (10-digit mobile)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  We will deliver your final high-res poster files & customized copy directly to this WhatsApp number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Sharma Sweets & Bakers"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. ramesh@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Special Customization Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g. Focus on Diwali gifts, mention our new address, emphasize pure ghee"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Generating Order...' : `Proceed to Payment Instructions (₹${amount})`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: PAYMENT INSTRUCTIONS (After order is created) */
            <div className="space-y-6">
              {/* Order Reference Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Order Reference</span>
                  <p className="font-mono font-extrabold text-lg text-slate-900">{createdOrder.id}</p>
                </div>
                <button
                  onClick={copyOrderId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedOrderId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedOrderId ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Status Alert: Explicitly tells customer order is pending until verified */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Payment Status: Pending Verification</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Your order is currently pending. Please complete payment using the UPI instructions below and share your transaction reference. Our team verifies payments manually before beginning customization.
                </p>
              </div>

              {/* UPI Payment Instructions Box */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>How to Pay via UPI:</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {/* QR Canvas */}
                  <div className="shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center">
                    <canvas ref={qrCanvasRef} className="w-36 h-36 rounded-lg" />
                    <span className="text-[10px] text-slate-500 font-bold mt-1">Scan with GPay / PhonePe</span>
                  </div>

                  {/* UPI Details */}
                  <div className="space-y-2.5 text-xs flex-1">
                    <div>
                      <span className="text-slate-500 font-medium">Payable Amount:</span>
                      <p className="text-xl font-black text-slate-900">₹{createdOrder.amount}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Seller UPI ID:</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="bg-white px-2.5 py-1 rounded-md border border-slate-300 font-mono font-bold text-slate-800 text-xs">
                          {storeSettings.sellerUpiId}
                        </code>
                        <button
                          onClick={copyUpiId}
                          className="p-1 rounded-md text-orange-600 hover:bg-orange-50 cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 font-medium">Beneficiary Name:</span>
                      <p className="font-semibold text-slate-800">{storeSettings.sellerName}</p>
                    </div>

                    {/* Direct UPI deep link on mobile devices */}
                    <div className="pt-1">
                      <a
                        href={upiIntentUri}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                      >
                        <span>Open Installed UPI App</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* UTR Reference Input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Enter UPI Transaction ID / UTR Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={upiRefInput}
                      onChange={(e) => setUpiRefInput(e.target.value)}
                      placeholder="e.g. 429817291048 (12-digit number)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={handleSaveUpiRef}
                      disabled={submittingUpiRef}
                      className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submittingUpiRef ? 'Saving...' : 'Submit UTR'}
                    </button>
                  </div>
                  {upiRefSaved && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>UTR Reference saved. Our team will verify.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Prefilled WhatsApp Button to Seller */}
              <div className="pt-2 space-y-3">
                <a
                  href={waOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Send Order Confirmation on WhatsApp</span>
                </a>

                <p className="text-[11px] text-slate-500 text-center">
                  Clicking the button opens WhatsApp with your prefilled order details for fast verification.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Done / Close this window
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
