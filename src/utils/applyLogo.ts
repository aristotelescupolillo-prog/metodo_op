import { BrandKit } from '../types';

// ─────────────────────────────────────────────────────────────────
// applyLogoToImage
// Única função do "Canvas" no Método OP: carimbar a LOGOMARCA
// no canto inferior direito da peça já gerada pelo GPT-Image-1,
// respeitando 110px de respiro em todas as bordas.
// Não escreve texto. Não desenha bloco de cor. Não altera a foto.
// ─────────────────────────────────────────────────────────────────

const RESPIRO = 110;          // 110px de margem (regra do produto)
const LOGO_MAX_W_POST = 260;  // largura máxima da logo no post
const LOGO_MAX_H_POST = 100;  // altura máxima da logo no post
const LOGO_MAX_W_REELS = 200;
const LOGO_MAX_H_REELS = 80;

export async function applyLogoToImage(
  imageUrl: string,
  kit: BrandKit,
  format: 'post' | 'reels' = 'post'
): Promise<string> {
  // Mantemos a peça na resolução nativa em que o GPT-Image-1 entregou.
  // Carregamos a imagem e descobrimos as dimensões reais.
  const baseImg = await loadImage(imageUrl);
  const W = baseImg.naturalWidth || baseImg.width;
  const H = baseImg.naturalHeight || baseImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Desenha a peça pronta como fundo (sem reescala — preserva resolução).
  ctx.drawImage(baseImg, 0, 0, W, H);

  if (kit.logoDataUrl) {
    try {
      const logo = await loadImage(kit.logoDataUrl);
      const maxW = format === 'reels' ? LOGO_MAX_W_REELS : LOGO_MAX_W_POST;
      const maxH = format === 'reels' ? LOGO_MAX_H_REELS : LOGO_MAX_H_POST;

      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * scale;
      const lh = logo.height * scale;

      // Canto inferior direito, com 110px de respiro nas duas bordas.
      const lx = W - RESPIRO - lw;
      const ly = H - RESPIRO - lh;

      ctx.drawImage(logo, lx, ly, lw, lh);
    } catch {
      // Logo opcional — se falhar, devolve a peça sem logo.
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
