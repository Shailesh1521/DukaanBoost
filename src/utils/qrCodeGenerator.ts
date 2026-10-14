import QRCode from 'qrcode';
import { QrConfig } from '../types';

export interface QrRenderResult {
  dataUrl: string;
  svgString: string;
}

export async function generateQrCode(
  text: string,
  options?: {
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    width?: number;
    margin?: number;
  }
): Promise<QrRenderResult> {
  const darkColor = options?.color?.dark || '#0f172a';
  const lightColor = options?.color?.light || '#ffffff';
  const ecLevel = options?.errorCorrectionLevel || 'M';
  const qrWidth = options?.width || 512;
  const qrMargin = options?.margin !== undefined ? options.margin : 2;

  const dataUrl = await QRCode.toDataURL(text, {
    errorCorrectionLevel: ecLevel,
    margin: qrMargin,
    width: qrWidth,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });

  const svgString = await QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: ecLevel,
    margin: qrMargin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });

  return { dataUrl, svgString };
}

export interface TableStandeeOptions {
  businessName: string;
  tagline?: string;
  qrType: 'menu' | 'feedback' | 'review' | 'loyalty' | 'custom';
  qrDataUrl: string;
  tableNumber?: string;
  brandColor?: string;
  instructions?: string;
  wifiName?: string;
  wifiPassword?: string;
}

export function drawTableStandee(
  canvas: HTMLCanvasElement,
  options: TableStandeeOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    const brandColor = options.brandColor || '#ea580c';

    // 1. Clean Background with subtle texture
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer decorative border
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, width - 16, height - 16);

    // Inner brand border
    ctx.strokeStyle = brandColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // 2. Top Header Ribbon
    ctx.fillStyle = brandColor;
    ctx.fillRect(32, 32, width - 64, 180);

    // Business Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.businessName.toUpperCase(), width / 2, 95);

    // Subtitle / Tagline
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(options.tagline || 'WELCOME • ENJOY YOUR VISIT', width / 2, 145);

    // 3. Table Number Badge (if specified)
    if (options.tableNumber) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 120, 235, 240, 52, 26);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(options.tableNumber.toUpperCase(), width / 2, 261);
    }

    // 4. Main Purpose Callout Headline
    let headline = 'SCAN TO VIEW OUR DIGITAL MENU';
    let subheadline = 'Touch-free, contactless & always updated';
    let iconEmoji = '📱';

    if (options.qrType === 'feedback') {
      headline = 'SHARE YOUR VALUED FEEDBACK';
      subheadline = 'Help us serve you better in 30 seconds';
      iconEmoji = '⭐';
    } else if (options.qrType === 'review') {
      headline = 'RATE US ON GOOGLE';
      subheadline = 'Love your experience? Leave us a 5-star review';
      iconEmoji = '🌟';
    } else if (options.qrType === 'loyalty') {
      headline = 'EARN REWARD POINTS TODAY';
      subheadline = 'Scan to check in & unlock free treats';
      iconEmoji = '🎁';
    }

    const ctaY = options.tableNumber ? 335 : 275;
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${iconEmoji} ${headline}`, width / 2, ctaY);

    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(subheadline, width / 2, ctaY + 45);

    // 5. Draw the QR Image
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrSize = 420;
      const qrX = (width - qrSize) / 2;
      const qrY = ctaY + 85;

      // Card container for QR
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.roundRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50, 32);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Corner accent frames around QR
      ctx.strokeStyle = brandColor;
      ctx.lineWidth = 6;
      const cSize = 40;
      const cPad = 14;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(qrX - cPad, qrY - cPad + cSize);
      ctx.lineTo(qrX - cPad, qrY - cPad);
      ctx.lineTo(qrX - cPad + cSize, qrY - cPad);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + cPad - cSize, qrY - cPad);
      ctx.lineTo(qrX + qrSize + cPad, qrY - cPad);
      ctx.lineTo(qrX + qrSize + cPad, qrY - cPad + cSize);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(qrX - cPad, qrY + qrSize + cPad - cSize);
      ctx.lineTo(qrX - cPad, qrY + qrSize + cPad);
      ctx.lineTo(qrX - cPad + cSize, qrY + qrSize + cPad);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(qrX + qrSize + cPad - cSize, qrY + qrSize + cPad);
      ctx.lineTo(qrX + qrSize + cPad, qrY + qrSize + cPad);
      ctx.lineTo(qrX + qrSize + cPad, qrY + qrSize + cPad - cSize);
      ctx.stroke();

      // Draw QR image
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // 6. Bottom Instructions & Wi-Fi
      const footerY = qrY + qrSize + 70;
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('📷 Open phone camera or Google Lens to scan', width / 2, footerY);

      if (options.wifiName) {
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#475569';
        const wifiText = `📶 Free Wi-Fi: ${options.wifiName} ${options.wifiPassword ? '• Pass: ' + options.wifiPassword : ''}`;
        ctx.fillText(wifiText, width / 2, footerY + 45);
      }

      // Small DukaanBoost watermark
      ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Powered by DukaanBoost AI', width / 2, height - 55);

      resolve();
    };

    qrImg.onerror = (err) => reject(err);
    qrImg.src = options.qrDataUrl;
  });
}
