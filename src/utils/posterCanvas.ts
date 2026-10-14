import { VisualStyle } from '../types';

export interface PosterRenderOptions {
  width: number;
  height: number;
  templateId: VisualStyle;
  businessName: string;
  category: string;
  headline: string;
  subheadline: string;
  offerBadge: string;
  bulletPoints: string[];
  callToAction: string;
  phone: string;
  location: string;
  disclaimer?: string;
  logoImg?: HTMLImageElement | null;
  primaryColor?: string;
  accentColor?: string;
  darkBg?: boolean;
}

// Preset color themes for quick selection
export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  subtextColor: string;
}

export const POSTER_PALETTES: Record<string, ColorPalette> = {
  royal_saffron: {
    id: 'royal_saffron',
    name: 'Saffron & Gold (Festive)',
    primary: '#b91c1c',
    secondary: '#ea580c',
    accent: '#fbbf24',
    background: '#7f1d1d',
    badgeBg: '#fbbf24',
    badgeText: '#78350f',
    textColor: '#ffffff',
    subtextColor: '#fef08a',
  },
  desi_chai: {
    id: 'desi_chai',
    name: 'Desi Masala Chai (Warm Foodie)',
    primary: '#9a3412',
    secondary: '#c2410c',
    accent: '#f59e0b',
    background: '#431407',
    badgeBg: '#f97316',
    badgeText: '#ffffff',
    textColor: '#ffffff',
    subtextColor: '#fed7aa',
  },
  rose_luxury: {
    id: 'rose_luxury',
    name: 'Rose Gold & Emerald (Salon)',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#f43f5e',
    background: '#022c22',
    badgeBg: '#f43f5e',
    badgeText: '#ffffff',
    textColor: '#ffffff',
    subtextColor: '#a7f3d0',
  },
  power_volt: {
    id: 'power_volt',
    name: 'Obsidian & Neon Volt (Gym)',
    primary: '#09090b',
    secondary: '#18181b',
    accent: '#84cc16',
    background: '#09090b',
    badgeBg: '#84cc16',
    badgeText: '#000000',
    textColor: '#ffffff',
    subtextColor: '#d4d4d8',
  },
  super_saver: {
    id: 'super_saver',
    name: 'Retail Blue & Sunny Yellow (Kirana)',
    primary: '#1d4ed8',
    secondary: '#2563eb',
    accent: '#eab308',
    background: '#172554',
    badgeBg: '#facc15',
    badgeText: '#000000',
    textColor: '#ffffff',
    subtextColor: '#fef08a',
  },
  velvet_plum: {
    id: 'velvet_plum',
    name: 'Velvet Plum & Champagne (Boutique)',
    primary: '#581c87',
    secondary: '#7e22ce',
    accent: '#fef08a',
    background: '#3b0764',
    badgeBg: '#fde047',
    badgeText: '#4c1d95',
    textColor: '#ffffff',
    subtextColor: '#f3e8ff',
  },
};

export const TEMPLATE_NAMES: Record<VisualStyle, { name: string; tag: string; defaultPalette: string }> = {
  festive_dhamaka: { name: 'Festive Dhamaka', tag: 'Diwali & Celebrations', defaultPalette: 'royal_saffron' },
  chai_bites: { name: 'Chai & Bites', tag: 'Cafés & Tiffin Centers', defaultPalette: 'desi_chai' },
  salon_glow: { name: 'Salon & Spa Glow', tag: 'Beauty & Wellness', defaultPalette: 'rose_luxury' },
  power_fitness: { name: 'Power Fitness', tag: 'Gyms & Training', defaultPalette: 'power_volt' },
  kirana_saver: { name: 'Super Saver Market', tag: 'Grocery & Retail', defaultPalette: 'super_saver' },
  boutique_elegance: { name: 'Boutique Elegance', tag: 'Fashion & Bakery', defaultPalette: 'velvet_plum' },
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Draw decorative Indian motifs (Diya / Mandala rays / Starburst)
function drawFestiveMotifs(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.25;

  // Corner decorative flourishes
  const cornerSize = 70;
  const margin = 30;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(w - margin - cornerSize, margin);
  ctx.lineTo(w - margin, margin);
  ctx.lineTo(w - margin, margin + cornerSize);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(margin, h - margin - cornerSize);
  ctx.lineTo(margin, h - margin);
  ctx.lineTo(margin + cornerSize, h - margin);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(w - margin - cornerSize, h - margin);
  ctx.lineTo(w - margin, h - margin);
  ctx.lineTo(w - margin, h - margin - cornerSize);
  ctx.stroke();

  // Decorative circles in corners
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(margin + 12, margin + 12, 6, 0, Math.PI * 2);
  ctx.arc(w - margin - 12, margin + 12, 6, 0, Math.PI * 2);
  ctx.arc(margin + 12, h - margin - 12, 6, 0, Math.PI * 2);
  ctx.arc(w - margin - 12, h - margin - 12, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw starburst for Super Saver / Retail deal
function drawDealBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? r : r * 0.75;
    const angle = (i * Math.PI) / points;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function renderPosterToCanvas(
  canvas: HTMLCanvasElement,
  options: PosterRenderOptions,
  palette: ColorPalette
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width: w, height: h, templateId } = options;
  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  // 1. Draw Background Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  bgGrad.addColorStop(0, palette.background);
  bgGrad.addColorStop(0.6, palette.primary);
  bgGrad.addColorStop(1, palette.secondary);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle ambient backdrop glow
  const radialGlow = ctx.createRadialGradient(w * 0.5, h * 0.35, 50, w * 0.5, h * 0.35, w * 0.6);
  radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, w, h);

  // 2. Template-specific visual accents
  if (templateId === 'festive_dhamaka') {
    drawFestiveMotifs(ctx, w, h, palette.accent);
  } else if (templateId === 'power_fitness') {
    // Athletic diagonal neon stripes
    ctx.save();
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.08;
    for (let i = -w; i < w * 2; i += 120) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 300, h);
      ctx.lineTo(i + 340, h);
      ctx.lineTo(i + 40, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (templateId === 'chai_bites') {
    // Warm dashed concentric food ring
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.45, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (templateId === 'salon_glow' || templateId === 'boutique_elegance') {
    // Minimalist double gold inner border
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;
    ctx.strokeRect(36, 36, w - 72, h - 72);
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.15;
    ctx.strokeRect(48, 48, w - 96, h - 96);
    ctx.restore();
  }

  // 3. Header Section: Brand & Logo
  const topMargin = h > 1200 ? 110 : 80;
  let currentY = topMargin;

  // Draw Logo if uploaded
  if (options.logoImg && options.logoImg.complete && options.logoImg.naturalWidth > 0) {
    const logoSize = 100;
    const logoX = w / 2 - logoSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, currentY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(options.logoImg, logoX, currentY, logoSize, logoSize);
    ctx.restore();

    // Circular ring around logo
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, currentY + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    currentY += logoSize + 25;
  }

  // Business Name
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.textColor;
  ctx.font = '800 48px "Outfit", "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(options.businessName.toUpperCase(), w / 2, currentY);
  ctx.restore();
  currentY += 40;

  // Category Tag / City Pill
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  const tagText = `${options.category.toUpperCase()}${options.location ? ' • ' + options.location : ''}`;
  const tagWidth = ctx.measureText(tagText).width + 48;
  const tagHeight = 38;

  // Pill Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - tagWidth / 2, currentY - 26, tagWidth, tagHeight, 19);
  ctx.fill();

  ctx.fillStyle = palette.subtextColor;
  ctx.fillText(tagText, w / 2, currentY);
  ctx.restore();
  currentY += 65;

  // 4. Main Offer Badge (High visual weight)
  if (options.offerBadge) {
    ctx.save();
    const badgeText = options.offerBadge.toUpperCase();
    ctx.font = '900 42px "Outfit", "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(badgeText).width;
    const bWidth = Math.min(w - 120, textWidth + 80);
    const bHeight = 74;
    const bX = w / 2 - bWidth / 2;
    const bY = currentY;

    // Badge Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;

    if (templateId === 'kirana_saver') {
      // Starburst for retail saver
      drawDealBurst(ctx, w / 2, bY + bHeight / 2, bWidth / 2 + 10, palette.badgeBg);
    } else {
      // Ribbon / Pill container
      ctx.fillStyle = palette.badgeBg;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bWidth, bHeight, 16);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = palette.badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, w / 2, bY + bHeight / 2);
    ctx.restore();

    currentY += bHeight + 45;
  }

  // 5. Main Catchy Headline
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = palette.accent;
  ctx.font = '800 52px "Outfit", "Rozha One", serif, sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;

  const headlineLines = wrapText(ctx, options.headline, w - 160);
  for (const line of headlineLines) {
    ctx.fillText(line, w / 2, currentY);
    currentY += 60;
  }
  ctx.restore();
  currentY += 15;

  // Subheadline
  if (options.subheadline) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = palette.subtextColor;
    ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
    const subLines = wrapText(ctx, options.subheadline, w - 200);
    for (const line of subLines) {
      ctx.fillText(line, w / 2, currentY);
      currentY += 36;
    }
    ctx.restore();
    currentY += 25;
  }

  // 6. Bullet Highlights Card
  if (options.bulletPoints && options.bulletPoints.length > 0) {
    ctx.save();
    const cardWidth = w - 160;
    const cardX = 80;
    const cardPadding = 28;
    const bulletStartY = currentY;

    // Semi-transparent glass card
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;

    const approxHeight = options.bulletPoints.length * 48 + cardPadding * 2;
    ctx.beginPath();
    ctx.roundRect(cardX, bulletStartY, cardWidth, approxHeight, 20);
    ctx.fill();
    ctx.stroke();

    let bulletY = bulletStartY + cardPadding + 10;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (const point of options.bulletPoints) {
      // Checkmark icon
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(cardX + 35, bulletY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', cardX + 35, bulletY + 1);

      // Bullet text
      ctx.fillStyle = palette.textColor;
      ctx.font = '600 23px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(point, cardX + 62, bulletY);

      bulletY += 46;
    }

    currentY = bulletStartY + approxHeight + 40;
    ctx.restore();
  }

  // 7. Footer Section: CTA Button + Contact Details
  const footerBottom = h - 60;
  let footerY = Math.max(currentY, footerBottom - 180);

  // Call to Action Button
  if (options.callToAction) {
    ctx.save();
    const ctaText = options.callToAction.toUpperCase();
    ctx.font = '800 32px "Outfit", "Plus Jakarta Sans", sans-serif';
    const ctaWidth = Math.min(w - 180, ctx.measureText(ctaText).width + 90);
    const ctaHeight = 72;
    const ctaX = w / 2 - ctaWidth / 2;

    // CTA Glow
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 24;

    ctx.fillStyle = palette.badgeBg;
    ctx.beginPath();
    ctx.roundRect(ctaX, footerY, ctaWidth, ctaHeight, 36);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = palette.badgeText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ctaText, w / 2, footerY + ctaHeight / 2);
    ctx.restore();

    footerY += ctaHeight + 25;
  }

  // Phone & WhatsApp Contact line
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.textColor;
  ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  const phoneText = `📞 / 💬 WhatsApp: ${options.phone || 'Contact Business'}`;
  ctx.fillText(phoneText, w / 2, footerY);
  footerY += 32;

  // Disclaimer / Footer Note
  if (options.disclaimer) {
    ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(options.disclaimer, w / 2, footerY);
  }
  ctx.restore();
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  try {
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error exporting poster PNG:', err);
  }
}
