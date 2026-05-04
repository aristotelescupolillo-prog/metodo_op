import { jsPDF } from 'jspdf';
import { BrandKit, MethodOpResult, MoodCode, CarouselCard, FeedItem } from '../types';

export function generateSequencePdf(result: MethodOpResult, kit: BrandKit, mood: MoodCode): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 20;
  const lineW = W - margin * 2;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > 280) { doc.addPage(); y = margin; }
  };

  const label = (text: string) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(text.toUpperCase(), margin, y);
    y += 4;
  };

  const body = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, lineW);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.38) + 2;
  };

  const divider = () => {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, y, W - margin, y);
    y += 5;
  };

  const tag = (text: string, bgColor: string, textColor: string) => {
    const hex = (c: string) => parseInt(c, 16);
    const bg = bgColor.replace('#', '');
    const tc = textColor.replace('#', '');
    doc.setFillColor(hex(bg.slice(0,2)), hex(bg.slice(2,4)), hex(bg.slice(4,6)));
    doc.roundedRect(margin, y - 3.5, doc.getTextWidth(text) + 6, 5.5, 1, 1, 'F');
    doc.setTextColor(hex(tc.slice(0,2)), hex(tc.slice(2,4)), hex(tc.slice(4,6)));
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin + 3, y);
    y += 7;
  };

  // ── Cabeçalho ──
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const pc = kit.primaryColor.replace('#', '');
  doc.setTextColor(parseInt(pc.slice(0,2),16), parseInt(pc.slice(2,4),16), parseInt(pc.slice(4,6),16));
  doc.text('MÉTODO OP', margin, y);
  y += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${kit.companyName} · Estilo ${mood}`, margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toLocaleDateString('pt-BR'), margin, y);
  y += 6;

  const ac = (kit.accentColor || '#f4b000').replace('#', '');
  doc.setDrawColor(parseInt(ac.slice(0,2),16), parseInt(ac.slice(2,4),16), parseInt(ac.slice(4,6),16));
  doc.setLineWidth(1);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Feed estático ──
  if (result.feed?.length) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(parseInt(pc.slice(0,2),16), parseInt(pc.slice(2,4),16), parseInt(pc.slice(4,6),16));
    doc.text('FEED ESTÁTICO', margin, y);
    y += 8;

    result.feed.forEach((item: FeedItem, i: number) => {
      checkPage(45);
      tag(`DIA ${i + 1} · ESTÁTICO`, kit.primaryColor, '#ffffff');
      body(item.titulo, 12, true);
      label('Texto');
      body(item.texto);
      label('Legenda');
      body(item.legenda);
      label('Sugestão de imagem');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      const ilines = doc.splitTextToSize(item.imagem, lineW);
      doc.text(ilines, margin, y);
      y += ilines.length * 3.5 + 4;
      divider();
    });
  }

  // ── Carrossel ──
  if (result.carousel?.length) {
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(parseInt(pc.slice(0,2),16), parseInt(pc.slice(2,4),16), parseInt(pc.slice(4,6),16));
    doc.text('CARROSSEL', margin, y);
    y += 8;

    result.carousel.forEach((card: CarouselCard) => {
      checkPage(30);
      tag(`CARD ${card.card}`, '#ede9fe', '#6d28d9');
      body(card.titulo, 11, true);
      body(card.texto);
      divider();
    });
  }

  // ── Reels ──
  if (result.reels) {
    checkPage(30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(parseInt(pc.slice(0,2),16), parseInt(pc.slice(2,4),16), parseInt(pc.slice(4,6),16));
    doc.text('REELS', margin, y);
    y += 8;
    body(result.reels.hook, 11, true);
    label('Texto de tela');
    body(result.reels.screenText);
    label('Roteiro falado');
    body(result.reels.script);
    divider();
  }

  // ── Stories ──
  if (result.stories?.length) {
    checkPage(20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(parseInt(pc.slice(0,2),16), parseInt(pc.slice(2,4),16), parseInt(pc.slice(4,6),16));
    doc.text('STORIES', margin, y);
    y += 8;

    result.stories.forEach((seq) => {
      checkPage(20);
      body(`Dia ${seq.dia} — ${seq.sequencia}`, 11, true);
      seq.stories.forEach((story) => {
        checkPage(12);
        body(`${story.ordem}. ${story.texto}`);
      });
      divider();
    });
  }

  doc.save(`metodo-op-${kit.companyName}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
}
