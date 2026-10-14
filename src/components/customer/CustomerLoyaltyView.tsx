import React, { useState, useEffect } from 'react';
import { CustomerLoyaltyWallet, BusinessProfile, LoyaltyConfig } from '../../types';
import {
  Gift,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  History,
  QrCode,
  Lock,
} from 'lucide-react';

interface CustomerLoyaltyViewProps {
  business: BusinessProfile;
  onBackToDashboard?: () => void;
}

export const CustomerLoyaltyView: React.FC<CustomerLoyaltyViewProps> = ({
  business,
  onBackToDashboard,
}) => {
  const [phoneInput, setPhoneInput] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('dkb_customer_phone') || '') : '';
  });
  const [wallet, setWallet] = useState<CustomerLoyaltyWallet | null>(null);
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState<boolean>(false);

  // Check-in modal state
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState<boolean>(false);
  const [checkinMethod, setCheckinMethod] = useState<'daily_code' | 'staff_pin'>('daily_code');
  const [verifyCodeInput, setVerifyCodeInput] = useState<string>('');
  const [checkinLoading, setCheckinLoading] = useState<boolean>(false);
  const [checkinSuccessMsg, setCheckinSuccessMsg] = useState<string | null>(null);

  // Redemption state
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState<any | null>(null);
  const [redemptionStaffPin, setRedemptionStaffPin] = useState<string>('');
  const [redemptionLoading, setRedemptionLoading] = useState<boolean>(false);
  const [redemptionReceipt, setRedemptionReceipt] = useState<any | null>(null);

  const fetchWallet = async (phone: string) => {
    const bizId = business.id || 'chai-shai-cafe';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return;

    setLoading(true);
    setError(null);
    setAuthRequired(false);

    try {
      const tokenKey = `dkb_wallet_token_${bizId}_${cleanPhone}`;
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;

      const res = await fetch(`/api/loyalty/customer?businessId=${bizId}&phone=${cleanPhone}`, {
        headers: {
          'x-wallet-token': savedToken || '',
        },
      });

      if (res.status === 403) {
        setAuthRequired(true);
        setWallet(null);
        // Still fetch public config for rewards listing
        const cfgRes = await fetch(`/api/loyalty/config/${bizId}`);
        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          setConfig(cfgData);
        }
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Could not load wallet.');
      }

      const data = await res.json();
      setWallet(data);

      const cfgRes = await fetch(`/api/loyalty/config/${bizId}`);
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        setConfig(cfgData);
      }
    } catch (err: any) {
      setError(err.message || 'Error looking up points.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phoneInput && phoneInput.length >= 10) {
      fetchWallet(phoneInput);
    }
  }, [business.id]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWallet(phoneInput);
  };

  // Perform Check-in
  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (wallet?.phone || phoneInput).replace(/[^0-9]/g, '');
    if (!verifyCodeInput.trim() || !cleanPhone) return;

    setCheckinLoading(true);
    setError(null);
    setCheckinSuccessMsg(null);

    try {
      const bizId = business.id || 'chai-shai-cafe';
      const idempotencyKey = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const payload: any = {
        businessId: bizId,
        phone: cleanPhone,
        customerName: wallet?.name,
        idempotencyKey,
      };

      if (checkinMethod === 'daily_code') {
        payload.dailyCode = verifyCodeInput.trim();
      } else {
        payload.staffPin = verifyCodeInput.trim();
      }

      const res = await fetch('/api/loyalty/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      // Save verified wallet token and phone to browser storage
      if (data.walletToken) {
        const tokenKey = `dkb_wallet_token_${bizId}_${cleanPhone}`;
        localStorage.setItem(tokenKey, data.walletToken);
        localStorage.setItem('dkb_customer_phone', cleanPhone);
      }

      setCheckinSuccessMsg(data.message);
      setIsCheckinModalOpen(false);
      setVerifyCodeInput('');
      setAuthRequired(false);
      fetchWallet(cleanPhone);
    } catch (err: any) {
      setError(err.message || 'Check-in failed.');
    } finally {
      setCheckinLoading(false);
    }
  };

  // Perform Reward Redemption
  const handleRedeemReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRewardToRedeem || !redemptionStaffPin || !wallet) return;

    setRedemptionLoading(true);
    setError(null);

    try {
      const bizId = business.id || 'chai-shai-cafe';
      const idempotencyKey = `rdm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          businessId: bizId,
          phone: wallet.phone,
          rewardId: selectedRewardToRedeem.id,
          staffPin: redemptionStaffPin.trim(),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Redemption failed');

      setRedemptionReceipt(data);
      setSelectedRewardToRedeem(null);
      setRedemptionStaffPin('');
      fetchWallet(wallet.phone);
    } catch (err: any) {
      setError(err.message || 'Redemption failed.');
    } finally {
      setRedemptionLoading(false);
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
          <span className="text-xs font-bold text-orange-600">DukaanBoost Loyalty</span>
        )}

        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          Rewards Pass
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-slate-900 text-white p-6 rounded-b-3xl text-center space-y-3">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">
          {business.businessName}
        </h1>
        <p className="text-xs text-emerald-100">
          Earn points on every visit & unlock delicious rewards
        </p>

        {/* Customer Phone Search */}
        <form onSubmit={handlePhoneSubmit} className="pt-2 flex gap-1.5 max-w-xs mx-auto">
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="Enter mobile number..."
            className="flex-1 px-3 py-1.5 rounded-xl bg-white/20 text-white placeholder-emerald-200 text-xs font-mono focus:outline-hidden focus:bg-white focus:text-slate-900"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-white text-emerald-800 font-bold text-xs rounded-xl cursor-pointer hover:bg-emerald-50"
          >
            View
          </button>
        </form>
      </div>

      <div className="p-5 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
            {error}
          </div>
        )}

        {checkinSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{checkinSuccessMsg}</span>
          </div>
        )}

        {redemptionReceipt && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 space-y-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto font-bold">
              ✓
            </div>
            <h3 className="font-bold text-sm">Reward Claimed Successfully!</h3>
            <p className="text-xs font-mono font-black text-emerald-800 text-base">
              Receipt: {redemptionReceipt.receiptCode}
            </p>
            <p className="text-[11px] text-slate-600">
              Show this screen to the counter staff to receive your <strong>{redemptionReceipt.rewardTitle}</strong>.
            </p>
          </div>
        )}

        {/* AUTH REQUIRED NOTICE */}
        {authRequired && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg border border-emerald-500/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-white">Loyalty Pass Verification Required</h3>
              <p className="text-xs text-slate-300">
                To protect customer balances and privacy, check in with today's in-store daily code (displayed at the counter) or ask staff to unlock your pass.
              </p>
            </div>
            <button
              onClick={() => {
                setIsCheckinModalOpen(true);
                setError(null);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-200" />
              <span>Enter Store Code to Check In & Unlock</span>
            </button>
          </div>
        )}

        {/* POINTS WALLET PASS */}
        {wallet && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg border border-slate-700 relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Member Wallet
                </span>
                <p className="font-bold text-sm text-white">{wallet.name || 'Valued Patron'}</p>
                <p className="text-[11px] text-slate-400 font-mono">{wallet.phone}</p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Gift className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="font-display font-black text-4xl text-emerald-400">
                  {wallet.pointsBalance}
                </span>
                <span className="text-xs text-slate-300 ml-1 font-semibold">Points</span>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>{wallet.totalVisits} Total Visits</p>
              </div>
            </div>

            {/* Check-in CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setIsCheckinModalOpen(true);
                  setError(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span>Check In for Visit (+{config?.pointsPerVisit || 10} pts)</span>
              </button>
            </div>
          </div>
        )}

        {/* REWARDS CATALOG */}
        {config?.rewards && config.rewards.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
              Available Rewards ({config.rewards.length})
            </h3>

            <div className="space-y-2.5">
              {config.rewards.map((rew) => {
                const canRedeem = wallet && wallet.pointsBalance >= rew.pointsRequired;
                return (
                  <div
                    key={rew.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      canRedeem ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">{rew.title}</h4>
                      {rew.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{rew.description}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mb-1.5">
                        {rew.pointsRequired} pts
                      </span>
                      {canRedeem ? (
                        <button
                          onClick={() => setSelectedRewardToRedeem(rew)}
                          className="px-3 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg cursor-pointer hover:bg-emerald-700"
                        >
                          Redeem
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Need {rew.pointsRequired - (wallet ? wallet.pointsBalance : 0)} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RECENT POINTS HISTORY */}
        {wallet?.recentHistory && wallet.recentHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>Points Activity History</span>
            </h4>
            <div className="space-y-1.5">
              {wallet.recentHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-50 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{item.note}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-black ${
                      item.pointsChange > 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {item.pointsChange > 0 ? `+${item.pointsChange}` : item.pointsChange} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CHECK-IN VERIFICATION */}
      {isCheckinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Verify Your In-Store Visit</h3>
            <p className="text-xs text-slate-500">
              To prevent online point cheating, enter the daily 4-digit code written on the store chalkboard or have your waiter enter their staff PIN:
            </p>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCheckinMethod('daily_code')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  checkinMethod === 'daily_code' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Daily Code (e.g. 8942)
              </button>
              <button
                type="button"
                onClick={() => setCheckinMethod('staff_pin')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  checkinMethod === 'staff_pin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Staff PIN Entry
              </button>
            </div>

            <form onSubmit={handleCheckin} className="space-y-3">
              <input
                type="text"
                required
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                placeholder={checkinMethod === 'daily_code' ? 'Enter 4-digit store code' : 'Staff enters PIN (e.g. 1234)'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={checkinLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {checkinLoading ? 'Verifying...' : 'Claim Points'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCheckinModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REDEEM REWARD AT COUNTER */}
      {selectedRewardToRedeem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Hand Over Reward at Billing Counter</h3>
            <p className="text-xs text-slate-600">
              Redeeming: <strong>{selectedRewardToRedeem.title}</strong> for {selectedRewardToRedeem.pointsRequired} pts.
            </p>
            <p className="text-[11px] text-slate-400">
              Please hand your phone to the cashier or waiter to enter their 4-digit Staff PIN and confirm delivery of your treat:
            </p>

            <form onSubmit={handleRedeemReward} className="space-y-3">
              <input
                type="password"
                required
                value={redemptionStaffPin}
                onChange={(e) => setRedemptionStaffPin(e.target.value)}
                placeholder="Staff PIN (e.g. 1234)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={redemptionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  {redemptionLoading ? 'Authorizing...' : 'Authorize Redemption'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRewardToRedeem(null)}
                  className="px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
