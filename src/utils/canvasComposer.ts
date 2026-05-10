import JSZip from 'jszip';
import { BrandKit, CarouselCard, FeedItem, MoodCode } from '../types';

// ─────────────────────────────────────────────────────────────────
// CONSTANTES — dimensões e respiros
// ─────────────────────────────────────────────────────────────────

const FEED_W = 1080;
const FEED_H = 1350;
const PAD = 110;
const PAD_FINAL = 140; // Estático Final: respiro maior para reforçar resolução

// ─────────────────────────────────────────────────────────────────
// MAPEAMENTO DE LAYOUT POR MOOD
// ─────────────────────────────────────────────────────────────────
// fullbleed = imagem ocupa o quadro inteiro, texto sobreposto
// split-cubista = layout de colagem com zonas de cor + foto numa zona
// split-minimalista = topo branco com título, foto pequena ao centro, rodapé com texto
// silencio-aleatorio = sorteia entre fullbleed e split-minimalista
// ─────────────────────────────────────────────────────────────────

type LayoutKind = 'fullbleed' | 'split-cubista' | 'split-minimalista' | 'silencio-aleatorio';

function layoutForMood(mood: MoodCode): LayoutKind {
  switch (mood) {
    case 'OP-04': return 'split-cubista';
    case 'OP-06': return 'silencio-aleatorio';
    default: return 'fullbleed';
  }
}

// Variações do layout fullbleed (pra dar variedade entre peças da mesma sequência)
type FullbleedVariation = 'A' | 'B' | 'C' | 'D';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fillCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, align: CanvasTextAlign = 'left'): number {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, cy);
  ctx.textAlign = 'left';
  return cy + lineH;
}

async function drawLogo(ctx: CanvasRenderingContext2D, kit: BrandKit, x: number, y: number, maxW: number, maxH: number, align: 'left' | 'right' = 'left') {
  if (kit.logoDataUrl) {
    try {
      const logo = await loadImage(kit.logoDataUrl);
      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      const lw = logo.width * scale;
      const lh = logo.height * scale;
      const lx = align === 'right' ? x + maxW - lw : x;
      ctx.drawImage(logo, lx, y, lw, lh);
      return;
    } catch {}
  }
  // Fallback: nome da marca em texto, se não houver logo
  ctx.font = `800 32px ${kit.fontPair || 'Inter'}, Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = align;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(kit.companyName || '', align === 'right' ? x + maxW : x, y + maxH - 8);
  ctx.shadowBlur = 0;
  ctx.textAlign = 'left';
}

function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, direction: 'top' | 'bottom') {
  const grad = ctx.createLinearGradient(0, direction === 'bottom' ? h * 0.45 : 0, 0, direction === 'bottom' ? h : h * 0.55);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawSoftOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, direction: 'top' | 'bottom') {
  const grad = ctx.createLinearGradient(0, direction === 'bottom' ? h * 0.55 : 0, 0, direction === 'bottom' ? h : h * 0.45);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.50)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT FULLBLEED — imagem ocupa tudo, texto sobreposto
// 4 variações alternantes (A/B/C/D) pra variar entre peças
// ─────────────────────────────────────────────────────────────────

async function composeFullbleed(
  ctx: CanvasRenderingContext2D,
  kit: BrandKit,
  titulo: string,
  texto: string,
  w: number,
  h: number,
  variation: FullbleedVariation
) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const textW = w - PAD * 2;
  const accent = kit.accentColor || '#f4b000';

  if (variation === 'A') {
    // Texto no rodapé esquerdo, logo no topo direito
    drawOverlay(ctx, w, h, 'bottom');
    await drawLogo(ctx, kit, PAD, PAD, w - PAD * 2, 80, 'right');
    ctx.fillStyle = accent;
    ctx.fillRect(PAD, h - PAD - 4, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo.toUpperCase(), PAD, h - PAD - 160, textW, 82, 'left');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, Math.min(titY + 12, h - PAD - 50), textW, 48, 'left');
    ctx.shadowBlur = 0;
  }

  if (variation === 'B') {
    // Texto no topo esquerdo, logo no rodapé direito
    drawOverlay(ctx, w, h, 'top');
    ctx.fillStyle = accent;
    ctx.fillRect(PAD, PAD, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo.toUpperCase(), PAD, PAD + 30, textW, 82, 'left');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, titY + 12, textW, 48, 'left');
    await drawLogo(ctx, kit, PAD, h - PAD - 80, w - PAD * 2, 80, 'right');
    ctx.shadowBlur = 0;
  }

  if (variation === 'C') {
    // Texto no rodapé direito, logo no topo esquerdo
    drawOverlay(ctx, w, h, 'bottom');
    await drawLogo(ctx, kit, PAD, PAD, 280, 80, 'left');
    ctx.fillStyle = accent;
    ctx.fillRect(w - PAD - 60, h - PAD - 4, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    wrapText(ctx, titulo.toUpperCase(), PAD, h - PAD - 160, textW, 82, 'right');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, h - PAD - 260, textW, 48, 'right');
    ctx.shadowBlur = 0;
  }

  if (variation === 'D') {
    // Texto no topo direito, logo no rodapé esquerdo
    drawOverlay(ctx, w, h, 'top');
    ctx.fillStyle = accent;
    ctx.fillRect(w - PAD - 60, PAD, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo.toUpperCase(), PAD, PAD + 30, textW, 82, 'right');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, titY + 12, textW, 48, 'right');
    await drawLogo(ctx, kit, PAD, h - PAD - 80, 280, 80, 'left');
    ctx.shadowBlur = 0;
  }
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT SPLIT-CUBISTA — colagem fragmentada (OP-04 Fragmento)
// Estrutura:
// - Bloco grande com cor primária (lado esquerdo, topo) → título e texto
// - Bloco com accent (canto, pequeno) → acento visual
// - Bloco grande com a foto (lado direito, ocupa metade) → imagem
// - Logo discreta no canto inferior direito
// ─────────────────────────────────────────────────────────────────

async function composeSplitCubista(
  ctx: CanvasRenderingContext2D,
  kit: BrandKit,
  titulo: string,
  texto: string,
  baseImage: string | undefined,
  w: number,
  h: number
) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const primary = kit.primaryColor || '#123a63';
  const accent = kit.accentColor || '#f4b000';

  // Fundo neutro claro
  ctx.fillStyle = '#f5f3ee';
  ctx.fillRect(0, 0, w, h);

  // Bloco grande com cor primária (topo esquerdo) — onde fica o título
  const blockX = 0;
  const blockY = 0;
  const blockW = w * 0.55;
  const blockH = h * 0.55;
  ctx.fillStyle = primary;
  ctx.fillRect(blockX, blockY, blockW, blockH);

  // Bloco accent (lateral direita do bloco primário, faixa vertical) — acento visual
  const accentX = blockW;
  const accentY = h * 0.20;
  const accentW = w * 0.08;
  const accentH = h * 0.20;
  ctx.fillStyle = accent;
  ctx.fillRect(accentX, accentY, accentW, accentH);

  // Bloco grande com a foto (lado direito, do meio pra baixo)
  const photoX = w * 0.18;
  const photoY = h * 0.40;
  const photoW = w * 0.70;
  const photoH = h * 0.50;

  // Borda escura ao redor da foto pra dar feeling de moldura cubista
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(photoX - 8, photoY - 8, photoW + 16, photoH + 16);

  if (baseImage) {
    try {
      const img = await loadImage(baseImage);
      // Crop centralizado dentro da zona da foto
      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();
      fillCanvas(ctx, img, photoX, photoY, photoW, photoH);
      ctx.restore();
    } catch {}
  }

  // Título dentro do bloco primário, alinhado à esquerda
  ctx.font = `800 64px ${font}`;
  ctx.fillStyle = '#ffffff';
  const titX = PAD;
  const titY_start = PAD + 30;
  const titMaxW = blockW - PAD * 2;
  const titEndY = wrapText(ctx, titulo.toUpperCase(), titX, titY_start, titMaxW, 72, 'left');

  // Texto de apoio dentro do bloco primário, abaixo do título
  ctx.font = `400 32px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  wrapText(ctx, texto, titX, titEndY + 12, titMaxW, 42, 'left');

  // Logo discreta no canto inferior direito
  await drawLogo(ctx, kit, w - PAD - 220, h - PAD - 60, 220, 60, 'right');
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT SPLIT-MINIMALISTA — topo limpo com texto, foto centrada, rodapé
// Usado pelo OP-06 Silêncio quando o sorteio cair em "split"
// ─────────────────────────────────────────────────────────────────

async function composeSplitMinimalista(
  ctx: CanvasRenderingContext2D,
  kit: BrandKit,
  titulo: string,
  texto: string,
  baseImage: string | undefined,
  w: number,
  h: number
) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const primary = kit.primaryColor || '#123a63';
  const accent = kit.accentColor || '#f4b000';

  // Fundo branco/quase branco
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, w, h);

  // Faixa accent fina no topo
  ctx.fillStyle = accent;
  ctx.fillRect(PAD, PAD, 48, 3);

  // Título centralizado no topo, em cor primária
  ctx.font = `800 60px ${font}`;
  ctx.fillStyle = primary;
  ctx.textAlign = 'left';
  const titMaxW = w - PAD * 2;
  const titEndY = wrapText(ctx, titulo.toUpperCase(), PAD, PAD + 50, titMaxW, 70, 'left');

  // Texto de apoio abaixo do título, em cinza-grafite
  ctx.font = `400 32px ${font}`;
  ctx.fillStyle = '#475569';
  const textEndY = wrapText(ctx, texto, PAD, titEndY + 14, titMaxW, 42, 'left');

  // Foto centrada na metade inferior
  const photoY_start = Math.max(textEndY + 30, h * 0.42);
  const photoH = h - photoY_start - PAD - 80; // espaço pra logo
  const photoW = w - PAD * 2;

  if (baseImage && photoH > 100) {
    try {
      const img = await loadImage(baseImage);
      ctx.save();
      ctx.beginPath();
      ctx.rect(PAD, photoY_start, photoW, photoH);
      ctx.clip();
      fillCanvas(ctx, img, PAD, photoY_start, photoW, photoH);
      ctx.restore();
    } catch {}
  }

  // Logo discreta no canto inferior direito
  await drawLogo(ctx, kit, w - PAD - 200, h - PAD - 50, 200, 50, 'right');
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT FULLBLEED FINAL — variação para Estático Final
// Composição mais centralizada, mais respiro, sensação de fechamento
// ─────────────────────────────────────────────────────────────────

async function composeFullbleedFinal(
  ctx: CanvasRenderingContext2D,
  kit: BrandKit,
  titulo: string,
  texto: string,
  w: number,
  h: number
) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const textW = w - PAD_FINAL * 2;
  const accent = kit.accentColor || '#f4b000';

  drawSoftOverlay(ctx, w, h, 'top');

  ctx.fillStyle = accent;
  ctx.fillRect(PAD_FINAL, PAD_FINAL, 48, 3);

  ctx.font = `800 68px ${font}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  const titY = wrapText(ctx, titulo.toUpperCase(), PAD_FINAL, PAD_FINAL + 36, textW, 78, 'left');

  ctx.font = `400 36px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  wrapText(ctx, texto, PAD_FINAL, titY + 14, textW, 46, 'left');
  ctx.shadowBlur = 0;

  await drawLogo(ctx, kit, PAD_FINAL, h - PAD_FINAL - 70, w - PAD_FINAL * 2, 70, 'right');
}

// ─────────────────────────────────────────────────────────────────
// FUNÇÃO PÚBLICA — composeFeedPng
// Recebe imagem pura do modelo + mood + dia, retorna PNG 1080x1350 pronto
// ─────────────────────────────────────────────────────────────────

export async function composeFeedPng(
  kit: BrandKit,
  item: FeedItem,
  baseImage: string | undefined,
  mood: MoodCode,
  isFinal: boolean = false
): Promise<string> {
  const w = FEED_W;
  const h = FEED_H;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Fundo de segurança (cor primária do kit) — caso a imagem não carregue
  ctx.fillStyle = kit.primaryColor || '#123a63';
  ctx.fillRect(0, 0, w, h);

  // Estático Final SEMPRE usa fullbleed-final (composição de fechamento)
  if (isFinal) {
    if (baseImage) {
      try {
        const img = await loadImage(baseImage);
        fillCanvas(ctx, img, 0, 0, w, h);
      } catch {}
    }
    await composeFullbleedFinal(ctx, kit, item.titulo, item.texto, w, h);
    return canvas.toDataURL('image/png');
  }

  // Estático e Carrossel: layout depende do mood
  const layoutKind = layoutForMood(mood);

  if (layoutKind === 'fullbleed') {
    if (baseImage) {
      try {
        const img = await loadImage(baseImage);
        fillCanvas(ctx, img, 0, 0, w, h);
      } catch {}
    }
    const variations: FullbleedVariation[] = ['A', 'B', 'C', 'D'];
    const variation = variations[(item.dia - 1) % 4];
    await composeFullbleed(ctx, kit, item.titulo, item.texto, w, h, variation);
  } else if (layoutKind === 'split-cubista') {
    await composeSplitCubista(ctx, kit, item.titulo, item.texto, baseImage, w, h);
  } else if (layoutKind === 'split-minimalista') {
    await composeSplitMinimalista(ctx, kit, item.titulo, item.texto, baseImage, w, h);
  } else if (layoutKind === 'silencio-aleatorio') {
    // Sorteia entre fullbleed e split-minimalista (50/50, baseado no dia)
    const goesFullbleed = (item.dia % 2 === 0);
    if (goesFullbleed) {
      if (baseImage) {
        try {
          const img = await loadImage(baseImage);
          fillCanvas(ctx, img, 0, 0, w, h);
        } catch {}
      }
      const variations: FullbleedVariation[] = ['A', 'B', 'C', 'D'];
      const variation = variations[(item.dia - 1) % 4];
      await composeFullbleed(ctx, kit, item.titulo, item.texto, w, h, variation);
    } else {
      await composeSplitMinimalista(ctx, kit, item.titulo, item.texto, baseImage, w, h);
    }
  }

  return canvas.toDataURL('image/png');
}

// ─────────────────────────────────────────────────────────────────
// composeFinalPng — alias mantido por compatibilidade com código antigo
// Internamente chama composeFeedPng com isFinal=true
// ─────────────────────────────────────────────────────────────────

export async function composeFinalPng(
  kit: BrandKit,
  item: FeedItem,
  baseImage: string | undefined,
  mood: MoodCode = 'OP-01'
): Promise<string> {
  return composeFeedPng(kit, item, baseImage, mood, true);
}

// ─────────────────────────────────────────────────────────────────
// composeCarouselZip — gera ZIP com todos os cards do carrossel
// ─────────────────────────────────────────────────────────────────

export async function composeCarouselZip(
  kit: BrandKit,
  cards: CarouselCard[],
  baseImages: string[] = [],
  mood: MoodCode = 'OP-01'
): Promise<Blob> {
  const zip = new JSZip();
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const item: FeedItem = {
      dia: i + 1,
      formato: 'Carrossel',
      titulo: card?.titulo || `Card ${i + 1}`,
      texto: card?.texto || '',
      legenda: '',
      imagem: card?.imagePrompt || '',
    };
    const dataUrl = await composeFeedPng(kit, item, baseImages[i], mood, false);
    const base64 = dataUrl.split(',')[1];
    zip.file(`card-${i + 1}.png`, base64, { base64: true });
  }
  return zip.generateAsync({ type: 'blob' });
}

// ─────────────────────────────────────────────────────────────────
// HELPERS DE DOWNLOAD
// ─────────────────────────────────────────────────────────────────

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
