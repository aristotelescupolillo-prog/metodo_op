import { useState } from 'react';
import { BrandKit, MethodOpResult } from '../types';
import { composeCarouselZip, composeFeedPng, downloadBlob, downloadDataUrl } from '../utils/canvasComposer';
import { generateBaseImage } from '../services/api';

interface Props {
  result?: MethodOpResult;
  kit: BrandKit;
}

function promptFallback(title: string, text: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/><circle cx="840" cy="260" r="220" fill="rgba(255,255,255,0.12)"/><rect x="80" y="160" width="560" height="360" rx="40" fill="rgba(255,255,255,0.10)"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export default function ResultsView({ result, kit }: Props) {
  const [busy, setBusy] = useState(false);
  if (!result) return null;

  async function handleFeedDownload() {
    if (!result?.feed?.length) return;
    setBusy(true);
    try {
      const item = result.feed[0];
      let image = promptFallback(item.titulo, item.texto, kit.secondaryColor);
      try { image = await generateBaseImage(item.imagem, 'post'); } catch { /* usa fallback local */ }
      const png = await composeFeedPng(kit, item, image);
      downloadDataUrl(png, 'metodo-op-feed.png');
    } finally { setBusy(false); }
  }

  async function handleCarouselDownload() {
    if (!result?.carousel?.length) return;
    setBusy(true);
    try {
      const images: string[] = [];
      for (const card of result.carousel.slice(0, 5)) {
        try { images.push(await generateBaseImage(card.imagePrompt, 'post')); }
        catch { images.push(promptFallback(card.titulo, card.texto, kit.secondaryColor)); }
      }
      const zip = await composeCarouselZip(kit, result.carousel, images);
      downloadBlob(zip, 'metodo-op-carrossel-5-cards.zip');
    } finally { setBusy(false); }
  }

  async function handleReelsImage() {
    if (!result?.reels) return;
    setBusy(true);
    try {
      let image = promptFallback(result.reels.hook, result.reels.script, kit.secondaryColor);
      try { image = await generateBaseImage(`${result.reels.imagePrompt}. IMAGEM PURA, sem texto, sem logo, composição vertical 1080x1920.`, 'reels'); } catch {}
      downloadDataUrl(image, 'metodo-op-reels-imagem-pura.png');
    } finally { setBusy(false); }
  }

  return (
    <section className="panel resultPanel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Saída</span>
          <h2>Resultado do Método OP</h2>
        </div>
        <p>Conteúdo gerado primeiro. Imagem e aplicação da marca vêm depois.</p>
      </div>

      {result.feed?.length ? (
        <div className="resultBlock">
          <h3>Feed estático</h3>
          {result.feed.map((item) => (
            <article key={item.dia} className="miniResult">
              <strong>{item.dia}. {item.titulo}</strong>
              <p>{item.texto}</p>
              <small>{item.legenda}</small>
            </article>
          ))}
          <button className="secondaryBtn" onClick={handleFeedDownload} disabled={busy}>Baixar 1º feed em PNG</button>
        </div>
      ) : null}

      {result.carousel?.length ? (
        <div className="resultBlock">
          <h3>Carrossel — 5 cards</h3>
          {result.carousel.slice(0, 5).map((card) => (
            <article key={card.card} className="miniResult">
              <strong>Card {card.card}: {card.titulo}</strong>
              <p>{card.texto}</p>
            </article>
          ))}
          <button className="secondaryBtn" onClick={handleCarouselDownload} disabled={busy}>Baixar ZIP com 5 cards</button>
        </div>
      ) : null}

      {result.reels ? (
        <div className="resultBlock">
          <h3>Reels — guia</h3>
          <article className="miniResult">
            <strong>Texto de tela separado: {result.reels.screenText}</strong>
            <p>{result.reels.script}</p>
          </article>
          <button className="secondaryBtn" onClick={handleReelsImage} disabled={busy}>Baixar imagem pura 1080x1920</button>
        </div>
      ) : null}

      {result.stories?.length ? (
        <div className="resultBlock">
          <h3>Stories — conteúdo textual</h3>
          {result.stories.map((seq) => (
            <article key={seq.dia} className="miniResult">
              <strong>Dia {seq.dia}: {seq.sequencia}</strong>
              {seq.stories.map((story) => <p key={story.ordem}>{story.ordem}. ({story.tipo}) {story.texto}</p>)}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
