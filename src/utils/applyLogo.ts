import { BrandKit } from '../types';

export async function applyLogoToImage(
  imageUrl: string,
  kit: BrandKit,
  format: 'post' | 'reels' = 'post'
): Promise<string> {
  const W = 1024;
  const H = format === 'reels' ? 1820 : 1536;
  const PAD = 80;
  const LOGO_MAX_W = 220;
  const LOGO_MAX_H = 80;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Desenha imagem de fundo
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.max(W / img.width, H / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
      resolve();
    };
    img.onerror = reject;
    img.src = imageUrl;
  });

  if (kit.logoDataUrl) {
    await new Promise<void>((resolve) => {
      const logo = new Image();
      logo.onload = () => {
        const scale = Math.min(LOGO_MAX_W / logo.width, LOGO_MAX_H / logo.height);
        const lw = logo.width * scale;
        const lh = logo.height * scale;
        const lx = W - PAD - lw;
        const ly = H - PAD - lh;

        // Fundo arredondado semitransparente atrás da logo
        const bPad = 12;
        ctx.save();
        ctx.beginPath();
        const rx = lx - bPad;
        const ry = ly - bPad;
        const rw = lw + bPad * 2;
        const rh = lh + bPad * 2;
        const radius = 10;
        ctx.moveTo(rx + radius, ry);
        ctx.lineTo(rx + rw - radius, ry);
        ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
        ctx.lineTo(rx + rw, ry + rh - radius);
        ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
        ctx.lineTo(rx + radius, ry + rh);
        ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
        ctx.lineTo(rx, ry + radius);
        ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();
        ctx.restore();

        ctx.drawImage(logo, lx, ly, lw, lh);
        resolve();
      };
      logo.onerror = () => resolve();
      logo.src = kit.logoDataUrl!;
    });
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
