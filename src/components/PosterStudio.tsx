import React, { useState, useEffect, useRef } from 'react';
import { PromoKit, VisualStyle } from '../types';
import {
  POSTER_PALETTES,
  TEMPLATE_NAMES,
  renderPosterToCanvas,
  downloadCanvasAsPng,
  ColorPalette,
} from '../utils/posterCanvas';
import {
  Download,
  Share2,
  Sparkles,
  Palette,
  Layout,
  Type,
  Phone,
  Upload,
  RefreshCw,
  Check,
  Maximize2,
  Smartphone,
  Square,
} from 'lucide-react';

interface PosterStudioProps {
  kit: PromoKit;
  onUpdateKit?: (updatedKit: PromoKit) => void;
}

export const PosterStudio: React.FC<PosterStudioProps> = ({ kit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Template & Theme state
  const [templateId, setTemplateId] = useState<VisualStyle>('festive_dhamaka');
  const [paletteId, setPaletteId] = useState<string>('royal_saffron');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');

  // Editable Content Fields
  const [businessName, setBusinessName] = useState<string>(kit.businessName);
  const [category, setCategory] = useState<string>(kit.category);
  const [headline, setHeadline] = useState<string>(kit.posterConfig.headline);
  const [subheadline, setSubheadline] = useState<string>(kit.posterConfig.subheadline);
  const [offerBadge, setOfferBadge] = useState<string>(kit.posterConfig.offerBadge);
  const [bullet1, setBullet1] = useState<string>(kit.posterConfig.bulletPoints[0] || '100% Quality & Hygiene');
  const [bullet2, setBullet2] = useState<string>(kit.posterConfig.bulletPoints[1] || 'Best Price in Town');
  const [bullet3, setBullet3] = useState<string>(kit.posterConfig.bulletPoints[2] || 'Fast Doorstep Delivery');
  const [callToAction, setCallToAction] = useState<string>(kit.posterConfig.callToAction);
  const [phone, setPhone] = useState<string>(kit.posterConfig.phone || '9876543210');
  const [location, setLocation] = useState<string>(kit.posterConfig.location || 'Local Store');
  const [disclaimer, setDisclaimer] = useState<string>(kit.posterConfig.disclaimer || '*T&C Apply.');

  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'content'>('design');

  // Load logo into HTMLImageElement whenever URL changes
  useEffect(() => {
    if (logoDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLogoImage(img);
      };
      img.src = logoDataUrl;
    } else {
      setLogoImage(null);
    }
  }, [logoDataUrl]);

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogoDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Re-render canvas whenever any input changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 1920;
    const currentPalette = POSTER_PALETTES[paletteId] || POSTER_PALETTES.royal_saffron;

    // Trigger render
    renderPosterToCanvas(
      canvas,
      {
        width,
        height,
        templateId,
        businessName,
        category,
        headline,
        subheadline,
        offerBadge,
        bulletPoints: [bullet1, bullet2, bullet3].filter(Boolean),
        callToAction,
        phone,
        location,
        disclaimer,
        logoImg: logoImage,
      },
      currentPalette
    );
  }, [
    templateId,
    paletteId,
    aspectRatio,
    businessName,
    category,
    headline,
    subheadline,
    offerBadge,
    bullet1,
    bullet2,
    bullet3,
    callToAction,
    phone,
    location,
    disclaimer,
    logoImage,
  ]);

  // Download High-Res PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const filename = `${cleanName}_promo_poster_1080p.png`;
    downloadCanvasAsPng(canvas, filename);
    setTimeout(() => setIsDownloading(false), 800);
  };

  // Native Web Share
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (navigator.share && canvas.toBlob) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `${businessName.replace(/\s+/g, '_')}_poster.png`, {
            type: 'image/png',
          });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${businessName} Special Offer!`,
              text: `${headline} - ${offerBadge}! Call: ${phone}`,
              files: [file],
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
          } else {
            // Text fallback share
            await navigator.share({
              title: `${businessName} Special Offer!`,
              text: `${headline} - ${offerBadge}! Call/WhatsApp: ${phone}`,
              url: window.location.href,
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 2000);
          }
        }, 'image/png');
      } else {
        // Fallback: download
        handleDownload();
      }
    } catch (err) {
      console.warn('Share dismissed or not supported:', err);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-xs">
              ₹
            </span>
            <h3 className="font-display font-extrabold text-2xl text-white">
              Interactive Branded Poster Studio
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose templates, tweak copy, upload logo, and export ready-to-post 1080p high-resolution PNGs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-orange-400" />
            <span>{shareSuccess ? 'Shared!' : 'Share Poster'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4 text-yellow-200" />
            <span>{isDownloading ? 'Preparing PNG...' : 'Download 1080p PNG'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6 items-start">
        {/* LEFT COLUMN: CONTROLS & EDITORS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Subtabs: Design vs Content */}
          <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'design' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Theme & Layout</span>
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'content' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Edit Text & Details</span>
            </button>
          </div>

          {/* TAB 1: DESIGN CONTROLS */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              {/* Aspect Ratio Toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Poster Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAspectRatio('1:1')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      aspectRatio === '1:1'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 ring-1 ring-orange-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span>Square 1:1 (Feed / DP)</span>
                  </button>
                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      aspectRatio === '9:16'
                        ? 'bg-orange-600/20 border-orange-500 text-orange-400 ring-1 ring-orange-500'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Vertical 9:16 (Status / Reel)</span>
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  6 Professional Indian Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TEMPLATE_NAMES) as VisualStyle[]).map((tId) => {
                    const info = TEMPLATE_NAMES[tId];
                    return (
                      <button
                        key={tId}
                        onClick={() => {
                          setTemplateId(tId);
                          setPaletteId(info.defaultPalette);
                        }}
                        className={`p-3 rounded-xl text-left border text-xs cursor-pointer transition-all ${
                          templateId === tId
                            ? 'bg-orange-600/20 border-orange-500 text-orange-300 ring-1 ring-orange-500'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <p className="font-bold">{info.name}</p>
                        <p className="text-[10px] text-slate-400">{info.tag}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Palettes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Color Schemes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(POSTER_PALETTES).map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => setPaletteId(pal.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                        paletteId === pal.id
                          ? 'border-orange-500 bg-orange-600/20 text-orange-300 ring-1 ring-orange-500'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: pal.primary }}></span>
                        <span className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: pal.secondary }}></span>
                        <span className="w-4 h-4 rounded-full border border-black/30" style={{ backgroundColor: pal.accent }}></span>
                      </div>
                      <span className="truncate font-semibold text-[11px]">{pal.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo Upload Section */}
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Upload Business Logo
                </label>
                <p className="text-[11px] text-slate-400 mb-3">Renders cleanly at top center with branded ring</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-600 file:text-white cursor-pointer"
                />
                {logoDataUrl && (
                  <button
                    onClick={() => {
                      setLogoDataUrl(null);
                      setLogoImage(null);
                    }}
                    className="mt-2 text-xs text-red-400 hover:underline block cursor-pointer"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EDIT TEXT CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Category & Location Tag
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Big Offer Badge
                </label>
                <input
                  type="text"
                  value={offerBadge}
                  onChange={(e) => setOfferBadge(e.target.value)}
                  placeholder="e.g. FLAT 30% OFF / COMBO @ ₹49"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Main Punchy Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Subheadline / Highlights
                </label>
                <input
                  type="text"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Key Bullet Highlights (3 items)
                </label>
                <input
                  type="text"
                  value={bullet1}
                  onChange={(e) => setBullet1(e.target.value)}
                  placeholder="Highlight 1"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={bullet2}
                  onChange={(e) => setBullet2(e.target.value)}
                  placeholder="Highlight 2"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={bullet3}
                  onChange={(e) => setBullet3(e.target.value)}
                  placeholder="Highlight 3"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Call to Action Button Text
                </label>
                <input
                  type="text"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Store Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE CANVAS PREVIEW (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Resolution indicator tag */}
            <div className="self-end mb-3 flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Resolution: 1080 × {aspectRatio === '1:1' ? '1080' : '1920'} px (Ultra-HD PNG)
              </span>
            </div>

            {/* Canvas Container with smooth aspect ratio scaling */}
            <div
              className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-700/80 transition-all duration-300 max-w-full"
              style={{
                width: aspectRatio === '1:1' ? '460px' : '340px',
                aspectRatio: aspectRatio === '1:1' ? '1 / 1' : '9 / 16',
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain block bg-slate-900"
              />
            </div>

            {/* Quick tips under preview */}
            <p className="text-[11px] text-slate-400 mt-4 text-center">
              💡 Tip: Click <strong>Download 1080p PNG</strong> to save this crisp poster directly to your gallery for WhatsApp Status & Instagram Story!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
