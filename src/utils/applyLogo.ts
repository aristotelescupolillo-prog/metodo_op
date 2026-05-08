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

        // Logo aplicada diretamente sobre a imagem, sem fundo nem halo.
        // Decisão de produto: composição limpa, sem ruído gráfico atrás da marca.
        ctx.drawImage(logo, lx, ly, lw, lh);
        resolve();
      };
      logo.onerror = () => resolve();
      logo.src = kit.logoDataUrl!;
    });
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
