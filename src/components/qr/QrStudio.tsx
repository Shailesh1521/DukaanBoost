import React, { useState, useEffect, useRef } from 'react';
import { BusinessProfile, QrDestinationType } from '../../types';
import { generateQrCode, drawTableStandee } from '../../utils/qrCodeGenerator';
import {
  QrCode,
  Download,
  Share2,
  Check,
  Utensils,
  MessageSquare,
  Star,
  Gift,
  Link,
  Printer,
  Sparkles,
  Wifi,
  Palette,
  Eye,
  FileCode,
} from 'lucide-react';

interface QrStudioProps {
  business: BusinessProfile;
  appUrl: string;
}

export const QrStudio: React.FC<QrStudioProps> = ({ business, appUrl }) => {
  const standeeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeType, setActiveType] = useState<QrDestinationType>('menu');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('Table #1');
  const [wifiName, setWifiName] = useState<string>('ChaiShai_Guest');
  const [wifiPass, setWifiPass] = useState<string>('chai@2026');
  const [fgColor, setFgColor] = useState<string>(business.brandColor || '#ea580c');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvgString, setQrSvgString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [activePreviewMode, setActivePreviewMode] = useState<'qr_only' | 'table_standee'>('table_standee');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Compute the exact destination URL based on active type
  const baseDomain = window.location.origin;
  const getDestinationUrl = (): string => {
    switch (activeType) {
      case 'menu':
        return `${baseDomain}/?biz=${business.id || 'chai-shai-cafe'}#customer-menu`;
      case 'feedback':
        return `${baseDomain}/?biz=${business.id || 'chai-shai-cafe'}#customer-feedback`;
      case 'review':
        return business.googleReviewUrl || 'https://g.page/r/your-google-profile/review';
      case 'loyalty':
        return `${baseDomain}/?biz=${business.id || 'chai-shai-cafe'}#customer-loyalty`;
      case 'custom':
        return customUrl || baseDomain;
      default:
        return baseDomain;
    }
  };

  const currentDestination = getDestinationUrl();

  // Generate QR code whenever destination or colors change
  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    generateQrCode(currentDestination, {
      color: { dark: fgColor, light: '#ffffff' },
      errorCorrectionLevel: ecLevel,
      width: 600,
    })
      .then((res) => {
        if (!isMounted) return;
        setQrDataUrl(res.dataUrl);
        setQrSvgString(res.svgString);
        setIsGenerating(false);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
        setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentDestination, fgColor, ecLevel]);

  // Render Table Standee canvas whenever QR or standee options change
  useEffect(() => {
    if (!qrDataUrl || !standeeCanvasRef.current) return;

    drawTableStandee(standeeCanvasRef.current, {
      businessName: business.businessName,
      tagline: business.city ? `${business.category.toUpperCase()} • ${business.city}` : undefined,
      qrType: activeType,
      qrDataUrl,
      tableNumber: tableNumber.trim() || undefined,
      brandColor: fgColor,
      wifiName: wifiName.trim() || undefined,
      wifiPassword: wifiPass.trim() || undefined,
    }).catch((err) => console.error('Standee render error:', err));
  }, [qrDataUrl, business, activeType, tableNumber, fgColor, wifiName, wifiPass]);

  // Download QR PNG
  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${business.businessName.replace(/\s+/g, '_')}_${activeType}_qr.png`;
    link.href = qrDataUrl;
    link.click();
    showDownloadSuccess('QR Code PNG Downloaded!');
  };

  // Download QR SVG
  const handleDownloadQrSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${business.businessName.replace(/\s+/g, '_')}_${activeType}_qr.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showDownloadSuccess('Vector SVG Downloaded!');
  };

  // Download Table Standee PNG
  const handleDownloadStandee = () => {
    const canvas = standeeCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${business.businessName.replace(/\s+/g, '_')}_Table_Standee.png`;
    link.href = dataUrl;
    link.click();
    showDownloadSuccess('Tabletop Standee PNG Downloaded!');
  };

  const showDownloadSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
              <QrCode className="w-4 h-4" />
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Custom QR-Code & Tabletop Studio
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate high-contrast, branded QR codes for your digital menu, feedback, Google reviews, or loyalty check-in.
          </p>
        </div>

        {/* Quick View Mode Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
          <button
            onClick={() => setActivePreviewMode('table_standee')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreviewMode === 'table_standee'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-orange-600" />
            <span>Table Standee Card</span>
          </button>
          <button
            onClick={() => setActivePreviewMode('qr_only')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activePreviewMode === 'qr_only'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-orange-600" />
            <span>QR Only</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: QR DESTINATION & CUSTOMIZATION CONTROLS (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Step 1: Select Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              1. Choose What This QR Code Opens
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveType('menu')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  activeType === 'menu'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Utensils className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Digital Menu</p>
                  <p className="text-[11px] text-slate-500">Contactless food & price list</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveType('feedback')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  activeType === 'feedback'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Feedback Form</p>
                  <p className="text-[11px] text-slate-500">Private reviews & ratings</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveType('loyalty')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  activeType === 'loyalty'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Gift className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Loyalty Check-in</p>
                  <p className="text-[11px] text-slate-500">Earn points on visits</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveType('review')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  activeType === 'review'
                    ? 'border-orange-500 bg-orange-50/70 text-orange-950 ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Star className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs sm:text-sm">Google Reviews</p>
                  <p className="text-[11px] text-slate-500">Public 5-star profile</p>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Input for Review or Custom URL */}
          {activeType === 'review' && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
              <label className="block font-bold text-slate-800">Your Google Business Review Link *</label>
              <input
                type="url"
                value={business.googleReviewUrl || ''}
                onChange={(e) => {
                  business.googleReviewUrl = e.target.value;
                }}
                placeholder="https://g.page/r/your-google-profile/review"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
              <p className="text-[11px] text-slate-500">
                Customers will be routed directly to your public Google review page to post their rating.
              </p>
            </div>
          )}

          {/* Encoded URL Transparency Box */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Target Destination URL:</span>
            <code className="text-slate-800 font-mono text-[11px] break-all select-all block bg-white p-2 rounded-lg border border-slate-200">
              {currentDestination}
            </code>
          </div>

          {/* Step 2: Visual Styling & Table Standee Details */}
          <div className="space-y-4 pt-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. Design & Standee Card Information
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="font-mono text-xs text-slate-600 uppercase font-semibold">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Error Correction</label>
                <select
                  value={ecLevel}
                  onChange={(e) => setEcLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="H">High (30% - Best for print & scratch resilience)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="L">Low (7%)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Table / Counter Label</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. Table #4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wi-Fi Name (Optional)</label>
                <input
                  type="text"
                  value={wifiName}
                  onChange={(e) => setWifiName(e.target.value)}
                  placeholder="e.g. Cafe_Free_WiFi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Wi-Fi Password</label>
                <input
                  type="text"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder="e.g. cafe@123"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <button
              onClick={handleDownloadStandee}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-600 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <Printer className="w-4 h-4 text-yellow-200" />
              <span>Download Printable Table Standee (PNG)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQrPng}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                <span>Download QR (PNG)</span>
              </button>

              <button
                onClick={handleDownloadQrSvg}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Vector SVG (Print Shop)</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE PREVIEW (6 cols) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full bg-slate-900 p-6 rounded-3xl border border-slate-800 flex flex-col items-center justify-center relative min-h-[440px]">
            {/* View Mode Indicator */}
            <div className="self-end mb-3">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                {activePreviewMode === 'table_standee' ? 'Print Standee • 800 × 1200 px' : 'Raw QR • 600 × 600 px'}
              </span>
            </div>

            {/* PREVIEW CONTAINER */}
            {activePreviewMode === 'table_standee' ? (
              <div className="max-w-[320px] shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-700 bg-white">
                <canvas ref={standeeCanvasRef} className="w-full h-auto block" />
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center max-w-[280px]">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-xl block" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
                <p className="mt-3 font-bold text-slate-800 text-xs text-center">{business.businessName}</p>
                <p className="text-[11px] text-slate-500 uppercase font-semibold">{activeType} QR</p>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-4 text-center max-w-sm">
              💡 Print on 4×6 inch acrylic tent cards or stickers for your tables, reception, and billing counter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
