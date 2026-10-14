import React, { useState, useEffect } from 'react';
import { LoyaltyConfig, LoyaltyReward, LoyaltyLedgerEntry, BusinessProfile } from '../../types';
import {
  Gift,
  ShieldAlert,
  ShieldCheck,
  Check,
  Plus,
  Trash2,
  Lock,
  Clock,
  Save,
  Search,
  ExternalLink,
  History,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface LoyaltyManagerProps {
  business: BusinessProfile;
  onOpenCustomerLoyalty: () => void;
}

export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({
  business,
  onOpenCustomerLoyalty,
}) => {
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // New Reward definition form
  const [newRewardTitle, setNewRewardTitle] = useState<string>('');
  const [newRewardDesc, setNewRewardDesc] = useState<string>('');
  const [newRewardPoints, setNewRewardPoints] = useState<number>(30);
  const [isAddingReward, setIsAddingReward] = useState<boolean>(false);

  // Customer search & manual check-in state
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [searchedCustomer, setSearchedCustomer] = useState<any | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [manualCheckinSuccess, setManualCheckinSuccess] = useState<string | null>(null);

  // Audit Ledger State
  const [ledgerEntries, setLedgerEntries] = useState<LoyaltyLedgerEntry[]>([]);

  // Fetch Loyalty Config
  const fetchConfig = () => {
    const bizId = business.id || 'chai-shai-cafe';
    setLoading(true);
    fetch(`/api/loyalty/config/${bizId}`, {
      headers: {
        'x-business-key': business.ownerKey || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) setConfig(data);
      })
      .catch((err) => console.error('Error fetching loyalty config:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfig();
  }, [business.id]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    setSaveSuccess(null);

    try {
      const bizId = business.id || 'chai-shai-cafe';
      const res = await fetch(`/api/loyalty/config/${bizId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-key': business.ownerKey || '',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update loyalty settings.');
      }
      setSaveSuccess('Loyalty rules and rewards updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving loyalty config.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddReward = () => {
    if (!config || !newRewardTitle.trim()) return;
    const newRew: LoyaltyReward = {
      id: `rew-${Date.now()}`,
      title: newRewardTitle.trim(),
      description: newRewardDesc.trim(),
      pointsRequired: Number(newRewardPoints),
      isActive: true,
    };

    setConfig({
      ...config,
      rewards: [...(config.rewards || []), newRew],
    });

    setNewRewardTitle('');
    setNewRewardDesc('');
    setNewRewardPoints(30);
    setIsAddingReward(false);
  };

  const handleDeleteReward = (rewId: string) => {
    if (!config) return;
    setConfig({
      ...config,
      rewards: config.rewards.filter((r) => r.id !== rewId),
    });
  };

  // Search Customer Wallet
  const handleSearchCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = searchPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setSearchError('Enter a valid 10-digit mobile number');
      return;
    }

    setSearchingCustomer(true);
    setSearchError(null);
    setSearchedCustomer(null);

    try {
      const bizId = business.id || 'chai-shai-cafe';
      const res = await fetch(`/api/loyalty/customer?businessId=${bizId}&phone=${cleanPhone}`, {
        headers: {
          'x-business-key': business.ownerKey || '',
          'x-staff-pin': config?.staffPin || '',
        },
      });
      if (!res.ok) throw new Error('Customer lookup failed. Staff authorization required.');
      const data = await res.json();
      setSearchedCustomer(data);
      if (data.recentHistory) setLedgerEntries(data.recentHistory);
    } catch (err: any) {
      setSearchError(err.message || 'Customer not found.');
    } finally {
      setSearchingCustomer(false);
    }
  };

  // Staff Approves Visit Check-in on Behalf of Customer
  const handleStaffApproveVisit = async () => {
    if (!searchedCustomer || !config) return;
    try {
      const bizId = business.id || 'chai-shai-cafe';
      const res = await fetch('/api/loyalty/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          phone: searchedCustomer.phone,
          customerName: searchedCustomer.name,
          staffPin: config.staffPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve visit');

      setManualCheckinSuccess(`Approved! +${data.pointsAwarded} pts awarded. Balance: ${data.newBalance} pts`);
      // Refresh customer data
      const refreshRes = await fetch(`/api/loyalty/customer?businessId=${bizId}&phone=${searchedCustomer.phone}`, {
        headers: {
          'x-business-key': business.ownerKey || '',
          'x-staff-pin': config?.staffPin || '',
        },
      });
      const refreshData = await refreshRes.json();
      setSearchedCustomer(refreshData);
      setTimeout(() => setManualCheckinSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error approving visit.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading loyalty program...</div>;
  }

  if (!config) {
    return <div className="p-12 text-center text-red-500 text-sm">Loyalty configuration not found.</div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <Gift className="w-4 h-4" />
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Customer Loyalty & Fraud-Safe Rewards
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Turn one-time patrons into regulars. Protected against QR spoofing with rotating daily codes and staff PIN approval.
          </p>
        </div>

        <button
          onClick={onOpenCustomerLoyalty}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Test Customer Wallet</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: PROGRAM SETTINGS & FRAUD SAFEGUARDS (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Loyalty Rules & Anti-Fraud Controls</span>
              </h3>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Programme Active</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Points Per Eligible Visit *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.pointsPerVisit}
                  onChange={(e) => setConfig({ ...config, pointsPerVisit: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Interval (Hours) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={config.minHoursBetweenVisits}
                  onChange={(e) => setConfig({ ...config, minHoursBetweenVisits: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Prevents repeat scans same day</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff Approval PIN *
                </label>
                <input
                  type="text"
                  required
                  value={config.staffPin}
                  onChange={(e) => setConfig({ ...config, staffPin: e.target.value })}
                  placeholder="e.g. 1234"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono font-bold text-emerald-800"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Used by waiters/cashier to verify</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rotating Daily Code
                </label>
                <input
                  type="text"
                  required
                  value={config.dailyCheckinCode}
                  onChange={(e) => setConfig({ ...config, dailyCheckinCode: e.target.value })}
                  placeholder="e.g. 8942"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono font-bold text-orange-800"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Written on daily chalkboard</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-yellow-300" />
              <span>{saving ? 'Saving...' : 'Update Programme Rules'}</span>
            </button>
          </form>

          {/* Reward Catalog Builder */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                Configured Rewards ({config.rewards?.length || 0})
              </h3>
              {!isAddingReward && (
                <button
                  type="button"
                  onClick={() => setIsAddingReward(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reward</span>
                </button>
              )}
            </div>

            {/* Add Reward Form */}
            {isAddingReward && (
              <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2.5">
                <input
                  type="text"
                  value={newRewardTitle}
                  onChange={(e) => setNewRewardTitle(e.target.value)}
                  placeholder="Reward Title (e.g. Free Cold Coffee / 20% Discount)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newRewardPoints}
                    onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                    placeholder="Points Required (e.g. 50)"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-bold"
                  />
                  <input
                    type="text"
                    value={newRewardDesc}
                    onChange={(e) => setNewRewardDesc(e.target.value)}
                    placeholder="Short description"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAddReward}
                    className="px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Save Reward
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingReward(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Reward Items List */}
            <div className="space-y-2">
              {(config.rewards || []).map((rew) => (
                <div
                  key={rew.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{rew.title}</h4>
                    {rew.description && (
                      <p className="text-[11px] text-slate-500">{rew.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {rew.pointsRequired} pts
                    </span>
                    <button
                      onClick={() => handleDeleteReward(rew.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove reward"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER LOOKUP & VERIFY VISIT (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-400" />
              <span>Staff Customer Lookup & Manual Approval</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a patron asks to claim points or redeem a treat at your billing counter, search their mobile number:
            </p>

            <form onSubmit={handleSearchCustomer} className="flex gap-2">
              <input
                type="tel"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="Enter 10-digit customer mobile..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-orange-500"
              />
              <button
                type="submit"
                disabled={searchingCustomer}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50"
              >
                {searchingCustomer ? 'Looking up...' : 'Search'}
              </button>
            </form>

            {searchError && (
              <p className="text-xs text-red-400 font-medium">{searchError}</p>
            )}

            {manualCheckinSuccess && (
              <p className="text-xs text-emerald-400 font-bold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800">
                {manualCheckinSuccess}
              </p>
            )}

            {searchedCustomer && (
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <div>
                    <p className="font-bold text-sm text-white">{searchedCustomer.name || 'Patron'}</p>
                    <p className="text-xs text-slate-400 font-mono">{searchedCustomer.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Points Balance</span>
                    <span className="font-black text-xl text-emerald-400">{searchedCustomer.pointsBalance} pts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Total Visits: <strong>{searchedCustomer.totalVisits}</strong></span>
                  <span>Last Visit: {searchedCustomer.lastVisitAt ? new Date(searchedCustomer.lastVisitAt).toLocaleDateString() : 'Never'}</span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleStaffApproveVisit}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve Visit (+{config.pointsPerVisit} pts)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Immutable Transaction Audit Ledger */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Loyalty Points Ledger</span>
            </h4>

            {ledgerEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Search a customer above or record a check-in to inspect ledger transactions.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {ledgerEntries.map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{l.note}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(l.createdAt).toLocaleDateString()} • {l.customerPhone}
                      </p>
                    </div>
                    <span
                      className={`font-black text-xs font-mono ${
                        l.pointsChange > 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {l.pointsChange > 0 ? `+${l.pointsChange}` : l.pointsChange} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
