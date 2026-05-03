import JSZip from 'jszip';
import { BrandKit, CarouselCard, FeedItem } from '../types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
}

function drawCover(ctx: CanvasRenderingContext2D, width: number, height: number, kit: BrandKit) {
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = kit.primaryColor;
  ctx.fillRect(0, height - 170, width, 170);
  ctx.fillStyle = kit.accentColor || kit.secondaryColor;
  ctx.fillRect(0, height - 185, width, 15);
}

async function drawLogo(ctx: CanvasRenderingContext2D, kit: BrandKit, x: number, y: number, maxW: number, maxH: number) {
  if (kit.logoDataUrl) {
    try {
      const logo = await loadImage(kit.logoDataUrl);
      const scale = Math.min(maxW / logo.width, maxH / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      ctx.drawImage(logo, x + maxW - w, y + maxH - h, w, h);
      return;
    } catch {}
  }
  ctx.font = `700 34px ${kit.fontPair}, Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(kit.companyName, x + maxW, y + maxH - 10);
  ctx.textAlign = 'left';
}

export async function composeFeedPng(kit: BrandKit, item: FeedItem, baseImage?: string): Promise<string> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kit.secondaryColor;
  ctx.fillRect(0, 0, width, height);
  if (baseImage) {
    try {
      const img = await loadImage(baseImage);
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
    } catch {}
  }
  drawCover(ctx, width, height, kit);

  ctx.fillStyle = '#fff';
  ctx.font = `800 76px ${kit.fontPair}, Arial`;
  wrapText(ctx, item.titulo, 76, 880, 900, 82);
  ctx.font = `500 38px ${kit.fontPair}, Arial`;
  wrapText(ctx, item.texto, 76, 1085, 890, 48);
  await drawLogo(ctx, kit, 720, 1195, 280, 90);
  return canvas.toDataURL('image/png');
}

export async function composeCarouselZip(kit: BrandKit, cards: CarouselCard[], baseImages: string[] = []): Promise<Blob> {
  const zip = new JSZip();
  for (let i = 0; i < 5; i++) {
    const card = cards[i];
    const item: FeedItem = {
      dia: i + 1,
      formato: 'Carrossel',
      titulo: card?.titulo || `Card ${i + 1}`,
      texto: card?.texto || '',
      legenda: '',
      imagem: card?.imagePrompt || '',
    };
    const dataUrl = await composeFeedPng(kit, item, baseImages[i]);
    const base64 = dataUrl.split(',')[1];
    zip.file(`metodo-op-carrossel-card-${i + 1}.png`, base64, { base64: true });
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
