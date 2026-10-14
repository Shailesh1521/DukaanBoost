import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  DollarSign,
  Package,
  ExternalLink,
  MessageCircle,
  Save,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react';
import { Order, PaymentStatus, FulfillmentStatus, StoreSettings, BusinessProfile } from '../types';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated: (newSettings: StoreSettings) => void;
  onFulfillInGenerator: (profile: BusinessProfile) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
  onFulfillInGenerator,
}) => {
  const [passcode, setPasscode] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminToken, setAdminToken] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayment: 0,
    verifiedOrders: 0,
    completedOrders: 0,
    totalGrossSales: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({
    sellerUpiId: '',
    sellerName: '',
    sellerWhatsApp: '',
    currencySymbol: '₹',
    foundingSetupPrice: 249,
    starterPackPrice: 99,
    businessPackPrice: 199,
    menuSetupPrice: 299,
    acceptingOrders: true,
    announcementText: '',
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
      }
    } catch (err) {
      console.warn('Logout network error:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminToken('');
      setPasscode('');
      setOrders([]);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid passcode. Access denied.');
      }

      setAdminToken(data.token);
      setIsAuthenticated(true);
      fetchAdminData(data.token);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed.');
    }
  };

  const fetchAdminData = async (token: string) => {
    setLoadingOrders(true);
    try {
      const ordersRes = await fetch('/api/admin/orders', {
        headers: { 'x-admin-token': token },
      });
      if (ordersRes.status === 401) {
        handleLogout();
        setAuthError('Admin session expired. Please re-authenticate.');
        return;
      }
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
        if (data.stats) setStats(data.stats);
      }

      const settingsRes = await fetch('/api/admin/settings', {
        headers: { 'x-admin-token': token },
      });
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettingsForm(sData);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    updates: { paymentStatus?: PaymentStatus; fulfillmentStatus?: FulfillmentStatus; adminNotes?: string }
  ) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        fetchAdminData(adminToken);
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(settingsForm),
      });

      if (res.ok) {
        const data = await res.json();
        onSettingsUpdated(data.settings);
        setSettingsSuccess('Settings updated and stored successfully!');
        setTimeout(() => setSettingsSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone.includes(searchQuery) ||
      (o.businessDetails?.businessName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'pending_payment') return o.paymentStatus === 'pending';
    if (statusFilter === 'verified') return o.paymentStatus === 'verified';
    if (statusFilter === 'completed') return o.fulfillmentStatus === 'completed';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">DukaanBoost Seller Admin</h2>
              <p className="text-xs text-slate-400">Manage customer orders, verify UPI payments & set pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Log Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {!isAuthenticated ? (
          /* LOGIN SCREEN */
          <div className="p-8 max-w-md mx-auto my-auto w-full text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-display font-extrabold text-2xl text-slate-900">Admin Authentication</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your administrative passcode to manage customer orders & pricing.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter administrative passcode"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-mono"
              />

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                Access Admin Dashboard
              </button>
            </form>

            <p className="text-[11px] text-slate-400">
              Passcode can also be configured securely on the server via <code className="bg-slate-100 px-1 py-0.5 rounded">ADMIN_PASSCODE</code>.
            </p>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Verified Sales</span>
                <p className="font-display font-black text-2xl text-emerald-700 mt-0.5">₹{stats.totalGrossSales}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</span>
                <p className="font-display font-extrabold text-2xl text-slate-900 mt-0.5">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-amber-600 uppercase">Pending Payment</span>
                <p className="font-display font-extrabold text-2xl text-amber-600 mt-0.5">{stats.pendingPayment}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-purple-600 uppercase">Completed</span>
                <p className="font-display font-extrabold text-2xl text-purple-700 mt-0.5">{stats.completedOrders}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'orders'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Orders Management ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'settings'
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Seller UPI & Pricing Settings</span>
                </button>
              </div>

              <button
                onClick={() => fetchAdminData(adminToken)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Refresh Data
              </button>
            </div>

            {/* TAB 1: ORDERS */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, customer, phone, or business..."
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending_payment">Pending Payment Only</option>
                    <option value="verified">Verified Payment</option>
                    <option value="completed">Completed Delivery</option>
                  </select>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No orders match your filter criteria.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                      const fulfillMsg = `Hi ${order.customerName}! Your DukaanBoost promotional kit for *${order.businessDetails?.businessName || 'your business'}* (Order #${order.id}) is customized and ready! Here are your files:`;
                      const fulfillWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fulfillMsg)}`;

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                {order.id}
                              </span>
                              <span className="text-xs font-bold text-slate-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                                {order.packageTitle}
                              </span>
                              <span className="font-black text-slate-900 text-sm">₹{order.amount}</span>
                            </div>

                            <p className="text-xs text-slate-800 font-semibold">
                              Customer: <span className="text-slate-900">{order.customerName}</span> • Phone: <a href={`tel:${order.customerPhone}`} className="text-blue-600 underline">{order.customerPhone}</a>
                            </p>
                            <p className="text-xs text-slate-600">
                              Business: <strong>{order.businessDetails?.businessName || 'N/A'}</strong> ({order.businessDetails?.category || 'General'})
                            </p>

                            {/* UTR Reference Highlight */}
                            <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 flex flex-wrap gap-4 mt-2">
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer UPI UTR</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {order.upiTransactionRef || '(Not submitted yet)'}
                                </span>
                              </div>
                              {order.specialNotes && (
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Special Notes</span>
                                  <span className="italic">{order.specialNotes}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-slate-400 font-bold uppercase text-[10px] block">Created Date</span>
                                <span>{new Date(order.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Controls for Admin */}
                          <div className="flex flex-col gap-2 shrink-0 md:w-60">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Payment Status
                              </label>
                              <select
                                value={order.paymentStatus}
                                onChange={(e) =>
                                  updateOrderStatus(order.id, { paymentStatus: e.target.value as PaymentStatus })
                                }
                                className={`w-full text-xs font-bold p-2 rounded-xl border ${
                                  order.paymentStatus === 'verified'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : order.paymentStatus === 'rejected'
                                    ? 'bg-red-50 text-red-800 border-red-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-300'
                                }`}
                              >
                                <option value="pending">⏳ Pending (Awaiting UTR)</option>
                                <option value="verified">✅ Verified (Payment Received)</option>
                                <option value="rejected">❌ Rejected (Invalid UTR)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Fulfillment Status
                              </label>
                              <select
                                value={order.fulfillmentStatus}
                                onChange={(e) =>
                                  updateOrderStatus(order.id, { fulfillmentStatus: e.target.value as FulfillmentStatus })
                                }
                                className={`w-full text-xs font-bold p-2 rounded-xl border ${
                                  order.fulfillmentStatus === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : order.fulfillmentStatus === 'in_progress'
                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="pending">Queued</option>
                                <option value="in_progress">⚙️ In Progress (Designing)</option>
                                <option value="completed">🎉 Completed & Delivered</option>
                              </select>
                            </div>

                            <div className="flex gap-2 pt-1">
                              {/* Open generator with customer's inputs to fulfill order */}
                              <button
                                onClick={() => {
                                  if (order.businessDetails) {
                                    onFulfillInGenerator(order.businessDetails);
                                    onClose();
                                  }
                                }}
                                className="flex-1 py-1.5 px-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                title="Open in AI Studio to generate kit"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Generate Pack</span>
                              </button>

                              {/* WhatsApp Direct message to customer */}
                              <a
                                href={fulfillWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1"
                                title="WhatsApp customer"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SELLER SETTINGS */}
            {activeTab === 'settings' && (
              <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  {settingsSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Seller UPI ID * (Where Customers Pay)
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.sellerUpiId}
                      onChange={(e) => setSettingsForm({ ...settingsForm, sellerUpiId: e.target.value })}
                      placeholder="e.g. shailesh@okaxis or business@upi"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This UPI ID is displayed on customer payment instructions and embedded in the dynamic QR code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Seller / Business Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.sellerName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, sellerName: e.target.value })}
                      placeholder="e.g. DukaanBoost AI Studio"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your WhatsApp Number * (For Receiving Orders)
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.sellerWhatsApp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, sellerWhatsApp: e.target.value })}
                      placeholder="e.g. 919876543210 (with country code 91)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Customers tap "Send Order Confirmation" to message you on this WhatsApp number.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Founding Setup (₹)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.foundingSetupPrice || 249}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, foundingSetupPrice: parseInt(e.target.value) || 249 })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-orange-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Starter Pack Price (₹)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.starterPackPrice}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, starterPackPrice: parseInt(e.target.value) || 99 })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Business Pack Price (₹)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.businessPackPrice}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, businessPackPrice: parseInt(e.target.value) || 199 })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Menu Setup Price (₹)
                      </label>
                      <input
                        type="number"
                        value={settingsForm.menuSetupPrice}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, menuSetupPrice: parseInt(e.target.value) || 299 })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Top Announcement Bar Message
                    </label>
                    <input
                      type="text"
                      value={settingsForm.announcementText || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                      placeholder="e.g. 🚀 Launch Special: Get your customized promotional pack within 24 hours!"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 text-orange-400" />
                      <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
