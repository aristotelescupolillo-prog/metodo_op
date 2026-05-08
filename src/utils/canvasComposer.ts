import JSZip from 'jszip';
import { BrandKit, CarouselCard, FeedItem } from '../types';

const FEED_W = 1080;
const FEED_H = 1350;
const PAD = 110;
const PAD_FINAL = 140; // Estático Final: respiro maior para reforçar resolução

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fillCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
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

// Overlay mais suave para o Estático Final — sensação de fechamento, não de impacto.
function drawSoftOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, direction: 'top' | 'bottom') {
  const grad = ctx.createLinearGradient(0, direction === 'bottom' ? h * 0.55 : 0, 0, direction === 'bottom' ? h : h * 0.45);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.50)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

type Layout = 'A' | 'B' | 'C' | 'D';

async function composeLayout(ctx: CanvasRenderingContext2D, kit: BrandKit, titulo: string, texto: string, w: number, h: number, layout: Layout) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const textW = w - PAD * 2;
  const accent = kit.accentColor || '#f4b000';

  if (layout === 'A') {
    drawOverlay(ctx, w, h, 'bottom');
    await drawLogo(ctx, kit, PAD, PAD, w - PAD * 2, 80, 'right');
    ctx.fillStyle = accent;
    ctx.fillRect(PAD, h - PAD - 4, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo, PAD, h - PAD - 160, textW, 82, 'left');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, Math.min(titY + 12, h - PAD - 50), textW, 48, 'left');
    ctx.shadowBlur = 0;
  }

  if (layout === 'B') {
    drawOverlay(ctx, w, h, 'top');
    ctx.fillStyle = accent;
    ctx.fillRect(PAD, PAD, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo, PAD, PAD + 30, textW, 82, 'left');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, titY + 12, textW, 48, 'left');
    await drawLogo(ctx, kit, PAD, h - PAD - 80, w - PAD * 2, 80, 'right');
    ctx.shadowBlur = 0;
  }

  if (layout === 'C') {
    drawOverlay(ctx, w, h, 'bottom');
    await drawLogo(ctx, kit, PAD, PAD, 280, 80, 'left');
    ctx.fillStyle = accent;
    ctx.fillRect(w - PAD - 60, h - PAD - 4, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    wrapText(ctx, titulo, PAD, h - PAD - 160, textW, 82, 'right');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, h - PAD - 260, textW, 48, 'right');
    ctx.shadowBlur = 0;
  }

  if (layout === 'D') {
    drawOverlay(ctx, w, h, 'top');
    ctx.fillStyle = accent;
    ctx.fillRect(w - PAD - 60, PAD, 60, 4);
    ctx.font = `800 72px ${font}`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    const titY = wrapText(ctx, titulo, PAD, PAD + 30, textW, 82, 'right');
    ctx.font = `400 38px ${font}`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    wrapText(ctx, texto, PAD, titY + 12, textW, 48, 'right');
    await drawLogo(ctx, kit, PAD, h - PAD - 80, 280, 80, 'left');
    ctx.shadowBlur = 0;
  }
}

// Layout dedicado ao Estático Final — composição limpa, centrada, com mais respiro.
// NÃO substitui os layouts A/B/C/D; é uma rota paralela de fechamento narrativo.
async function composeFinalLayout(ctx: CanvasRenderingContext2D, kit: BrandKit, titulo: string, texto: string, w: number, h: number) {
  const font = `${kit.fontPair || 'Inter'}, Arial`;
  const textW = w - PAD_FINAL * 2;
  const accent = kit.accentColor || '#f4b000';

  // Overlay suave no topo — não compete com a imagem, só ancora o texto.
  drawSoftOverlay(ctx, w, h, 'top');

  // Marca de cor sutil — discreta, só para amarrar identidade.
  ctx.fillStyle = accent;
  ctx.fillRect(PAD_FINAL, PAD_FINAL, 48, 3);

  // Título: posicionado no terço superior, alinhado à esquerda, com respiro maior.
  ctx.font = `800 68px ${font}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  const titY = wrapText(ctx, titulo, PAD_FINAL, PAD_FINAL + 36, textW, 78, 'left');

  // Texto de apoio: imediatamente abaixo do título, opacidade levemente maior
  // para reforçar legibilidade sem competir com o título.
  ctx.font = `400 36px ${font}`;
  ctx.fillStyle = 'rgba(255,255,255,0.90)';
  wrapText(ctx, texto, PAD_FINAL, titY + 14, textW, 46, 'left');
  ctx.shadowBlur = 0;

  // Logo centralizada no rodapé — fechamento simétrico e estável.
  await drawLogo(ctx, kit, PAD_FINAL, h - PAD_FINAL - 70, w - PAD_FINAL * 2, 70, 'right');
}

export async function composeFeedPng(kit: BrandKit, item: FeedItem, baseImage?: string, layoutOverride?: Layout): Promise<string> {
  const w = FEED_W;
  const h = FEED_H;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kit.primaryColor || '#123a63';
  ctx.fillRect(0, 0, w, h);

  if (baseImage) {
    try {
      const img = await loadImage(baseImage);
      fillCanvas(ctx, img, w, h);
    } catch {}
  }

  const layouts: Layout[] = ['A', 'B', 'C', 'D'];
  const layout = layoutOverride || layouts[(item.dia - 1) % 4];
  await composeLayout(ctx, kit, item.titulo, item.texto, w, h, layout);

  return canvas.toDataURL('image/png');
}

// Composição dedicada para Estático Final.
// Mesma assinatura de retorno (data URL PNG) — quem chama troca apenas o nome da função.
export async function composeFinalPng(kit: BrandKit, item: FeedItem, baseImage?: string): Promise<string> {
  const w = FEED_W;
  const h = FEED_H;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kit.primaryColor || '#123a63';
  ctx.fillRect(0, 0, w, h);

  if (baseImage) {
    try {
      const img = await loadImage(baseImage);
      fillCanvas(ctx, img, w, h);
    } catch {}
  }

  await composeFinalLayout(ctx, kit, item.titulo, item.texto, w, h);

  return canvas.toDataURL('image/png');
}

export async function composeCarouselZip(kit: BrandKit, cards: CarouselCard[], baseImages: string[] = []): Promise<Blob> {
  const zip = new JSZip();
  const layouts: Layout[] = ['A', 'B', 'C', 'D', 'A'];
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const item: FeedItem = {
      dia: i + 1, formato: 'Carrossel',
      titulo: card?.titulo || `Card ${i + 1}`,
      texto: card?.texto || '',
      legenda: '', imagem: card?.imagePrompt || '',
    };
    const dataUrl = await composeFeedPng(kit, item, baseImages[i], layouts[i]);
    const base64 = dataUrl.split(',')[1];
    zip.file(`card-${i + 1}.png`, base64, { base64: true });
  }
  return zip.generateAsync({ type: 'blob' });
}

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
