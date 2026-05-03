import { useState } from 'react';
import { BrandKit, CarouselCard, FeedItem, MethodOpResult, StoriesSequence } from '../types';
import { composeCarouselZip, composeFeedPng, downloadBlob, downloadDataUrl } from '../utils/canvasComposer';
import { generateBaseImage } from '../services/api';

interface Props {
  result?: MethodOpResult;
  kit: BrandKit;
}

function promptFallback(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function FeedCard({ item, kit }: { item: FeedItem; kit: BrandKit }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    try {
      let image = promptFallback(kit.secondaryColor);
      try { image = await generateBaseImage(item.imagem, 'post'); } catch { }
      const png = await composeFeedPng(kit, item, image);
      downloadDataUrl(png, `metodo-op-feed-${item.dia}.png`);
      setGenerated(true);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Estático · Post {item.dia}</span>
          <strong className="cardTitle">{item.titulo}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          <div className="cardField"><span className="fieldLabel">Texto do post</span><p>{item.texto}</p></div>
          <div className="cardField"><span className="fieldLabel">Legenda</span><p>{item.legenda}</p></div>
          <div className="cardField"><span className="fieldLabel">Sugestão de imagem</span><p className="imageHint">{item.imagem}</p></div>
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagem...' : generated ? '✓ Baixar novamente' : '⬇ Gerar imagem e baixar PNG'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CarouselCardItem({ cards, kit }: { cards: CarouselCard[]; kit: BrandKit }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    try {
      const images: string[] = [];
      for (const card of cards) {
        try { images.push(await generateBaseImage(card.imagePrompt, 'post')); }
        catch { images.push(promptFallback(kit.secondaryColor)); }
      }
      const zip = await composeCarouselZip(kit, cards, images);
      downloadBlob(zip, 'metodo-op-carrossel-5-cards.zip');
      setGenerated(true);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Carrossel · {cards.length} cards</span>
          <strong className="cardTitle">{cards[0]?.titulo}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          {cards.map(card => (
            <div key={card.card} className="carouselCard">
              <span className="cardTag" style={{ fontSize: 11 }}>Card {card.card}</span>
              <strong>{card.titulo}</strong>
              <p>{card.texto}</p>
              <small className="imageHint">{card.imagePrompt}</small>
            </div>
          ))}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagens...' : generated ? '✓ Baixar novamente' : '⬇ Gerar imagens e baixar ZIP'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ReelsCard({ reels, kit }: { reels: MethodOpResult['reels']; kit: BrandKit }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState(false);

  if (!reels) return null;

  async function handleGenerate() {
    if (!reels) return;
    setBusy(true);
    try {
      let image = promptFallback(kit.secondaryColor);
      try { image = await generateBaseImage(`${reels.imagePrompt}. IMAGEM PURA, sem texto, sem logo, composição vertical 1080x1920.`, 'reels'); } catch { }
      downloadDataUrl(image, 'metodo-op-reels-imagem-pura.png');
      setGenerated(true);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Reels · Guia de produção</span>
          <strong className="cardTitle">{reels.hook}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          <div className="cardField"><span className="fieldLabel">Texto de tela</span><p>{reels.screenText}</p></div>
          <div className="cardField"><span className="fieldLabel">Roteiro falado</span><p>{reels.script}</p></div>
          <div className="cardField"><span className="fieldLabel">Sugestão de imagem pura</span><p className="imageHint">{reels.imagePrompt}</p></div>
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagem...' : generated ? '✓ Baixar novamente' : '⬇ Gerar imagem pura 1080×1920'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function StoriesBlock({ seq }: { seq: StoriesSequence }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Stories · Dia {seq.dia}</span>
          <strong className="cardTitle">{seq.sequencia}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          {seq.stories.map(story => (
            <div key={story.ordem} className="storyItem">
              <span className="storyTag">{story.ordem}. {story.tipo === 'vídeo' ? '🎬 Vídeo' : '📝 Post'}</span>
              <p>{story.texto}</p>
            </div>
          ))}
          <div className="cardActions">
            <small style={{ color: '#64748b' }}>Stories V1 — apenas conteúdo textual. Imagem em breve.</small>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ResultsView({ result, kit }: Props) {
  if (!result) return null;

  return (
    <section className="panel resultPanel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Saída</span>
          <h2>Resultado do Método OP</h2>
        </div>
        <p>Leia, aprove o texto e então gere a imagem — uma peça de cada vez.</p>
      </div>

      {result.feed?.length ? (
        <div className="resultBlock">
          <h3>Feed estático</h3>
          {result.feed.map(item => <FeedCard key={item.dia} item={item} kit={kit} />)}
        </div>
      ) : null}

      {result.carousel?.length ? (
        <div className="resultBlock">
          <h3>Carrossel</h3>
          <CarouselCardItem cards={result.carousel} kit={kit} />
        </div>
      ) : null}

      {result.reels ? (
        <div className="resultBlock">
          <h3>Reels</h3>
          <ReelsCard reels={result.reels} kit={kit} />
        </div>
      ) : null}

      {result.stories?.length ? (
        <div className="resultBlock">
          <h3>Stories</h3>
          {result.stories.map(seq => <StoriesBlock key={seq.dia} seq={seq} />)}
        </div>
      ) : null}
    </section>
  );
}
