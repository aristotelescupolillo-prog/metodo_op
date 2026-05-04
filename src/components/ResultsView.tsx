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

function FeedCard({ item, kit, dayNumber }: { item: FeedItem; kit: BrandKit; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    try {
      let image = promptFallback(kit.secondaryColor);
      try { image = await generateBaseImage(item.imagem, 'post'); } catch { }
      const png = await composeFeedPng(kit, item, image);
      setPreview(png);
      downloadDataUrl(png, `metodo-op-dia-${dayNumber}-estatico.png`);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Dia {dayNumber} · Estático</span>
          <strong className="cardTitle">{item.titulo}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          <div className="cardField"><span className="fieldLabel">Texto</span><p>{item.texto}</p></div>
          <div className="cardField"><span className="fieldLabel">Legenda</span><p>{item.legenda}</p></div>
          <div className="cardField"><span className="fieldLabel">Sugestão de imagem</span><p className="imageHint">{item.imagem}</p></div>
          {preview && (
            <div className="previewWrapper">
              <img src={preview} alt="Preview" className="previewImg" />
            </div>
          )}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagem...' : preview ? '↻ Gerar novamente' : '⬇ Gerar imagem'}
            </button>
            {preview && (
              <button className="downloadBtn" type="button" onClick={() => downloadDataUrl(preview, `metodo-op-dia-${dayNumber}-estatico.png`)}>
                Baixar PNG
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CarouselCardBlock({ cards, kit, dayNumber }: { cards: CarouselCard[]; kit: BrandKit; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handleGenerate() {
    setBusy(true);
    try {
      const images: string[] = [];
      for (const card of cards) {
        try { images.push(await generateBaseImage(card.imagePrompt, 'post')); }
        catch { images.push(promptFallback(kit.secondaryColor)); }
      }
      const pngs: string[] = [];
      for (let i = 0; i < cards.length; i++) {
        const item = {
          dia: i + 1, formato: 'Carrossel' as const,
          titulo: cards[i].titulo, texto: cards[i].texto,
          legenda: '', imagem: cards[i].imagePrompt,
        };
        pngs.push(await composeFeedPng(kit, item, images[i]));
      }
      setPreviews(pngs);
      const zip = await composeCarouselZip(kit, cards, images);
      downloadBlob(zip, `metodo-op-dia-${dayNumber}-carrossel.zip`);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Dia {dayNumber} · Carrossel · {cards.length} cards</span>
          <strong className="cardTitle">{cards[0]?.titulo}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          {cards.map((card) => (
            <div key={card.card} className="carouselCard">
              <span className="cardTag">Card {card.card} — {card.titulo}</span>
              <p>{card.texto}</p>
              <small className="imageHint">{card.imagePrompt}</small>
            </div>
          ))}
          {previews.length > 0 && (
            <div className="carouselPreviews">
              {previews.map((p, i) => (
                <img key={i} src={p} alt={`Card ${i + 1}`} className="carouselPreviewImg" />
              ))}
            </div>
          )}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagens...' : previews.length > 0 ? '↻ Gerar novamente' : '⬇ Gerar imagens'}
            </button>
            {previews.length > 0 && (
              <button className="downloadBtn" type="button" onClick={async () => {
                const zip = await composeCarouselZip(kit, cards, previews);
                downloadBlob(zip, `metodo-op-dia-${dayNumber}-carrossel.zip`);
              }}>
                Baixar ZIP
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function ReelsCard({ reels, kit, dayNumber }: { reels: NonNullable<MethodOpResult['reels']>; kit: BrandKit; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    try {
      let image = promptFallback(kit.secondaryColor);
      try { image = await generateBaseImage(`${reels.imagePrompt}. IMAGEM PURA, sem texto, sem logo, composição vertical 1080x1920.`, 'reels'); } catch { }
      setPreview(image);
      downloadDataUrl(image, `metodo-op-dia-${dayNumber}-reels.png`);
    } finally { setBusy(false); }
  }

  return (
    <article className="contentCard">
      <button className="cardHeader" type="button" onClick={() => setOpen(o => !o)}>
        <div className="cardHeaderLeft">
          <span className="cardTag">Dia {dayNumber} · Reels</span>
          <strong className="cardTitle">{reels.hook}</strong>
        </div>
        <span className="cardChevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="cardBody">
          <div className="cardField"><span className="fieldLabel">Texto de tela</span><p>{reels.screenText}</p></div>
          <div className="cardField"><span className="fieldLabel">Roteiro falado</span><p>{reels.script}</p></div>
          <div className="cardField"><span className="fieldLabel">Sugestão de imagem</span><p className="imageHint">{reels.imagePrompt}</p></div>
          {preview && (
            <div className="previewWrapper">
              <img src={preview} alt="Preview Reels" className="previewImgReels" />
            </div>
          )}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando imagem...' : preview ? '↻ Gerar novamente' : '⬇ Gerar imagem pura'}
            </button>
            {preview && (
              <button className="downloadBtn" type="button" onClick={() => downloadDataUrl(preview, `metodo-op-dia-${dayNumber}-reels.png`)}>
                Baixar PNG
              </button>
            )}
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
            <small style={{ color: '#64748b' }}>Stories V1 — apenas conteúdo textual.</small>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ResultsView({ result, kit }: Props) {
  if (!result) return null;

  type DayItem =
    | { type: 'feed'; day: number; item: FeedItem }
    | { type: 'carousel'; day: number; cards: CarouselCard[] }
    | { type: 'reels'; day: number; reels: NonNullable<MethodOpResult['reels']> };

  const sequence: DayItem[] = [];
  let day = 1;

  const feeds = result.feed || [];
  const reelsList = result.reels ? [result.reels] : [];
  const carousels: CarouselCard[][] = [];

  if (result.carousel?.length) {
    for (let i = 0; i < result.carousel.length; i += 5) {
      carousels.push(result.carousel.slice(i, i + 5));
    }
  }

  const maxDay = Math.max(feeds.length, carousels.length, reelsList.length);
  for (let i = 0; i < maxDay; i++) {
    if (feeds[i]) sequence.push({ type: 'feed', day: day++, item: feeds[i] });
    if (carousels[i]) sequence.push({ type: 'carousel', day: day++, cards: carousels[i] });
    if (reelsList[i]) sequence.push({ type: 'reels', day: day++, reels: reelsList[i] });
  }

  return (
    <section className="panel resultPanel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Saída</span>
          <h2>Resultado do Método OP</h2>
        </div>
        <p>Leia, aprove o texto e então gere a imagem — uma peça de cada vez.</p>
      </div>

      {sequence.length > 0 && (
        <div className="resultBlock">
          <h3>Sequência do feed</h3>
          {sequence.map((item) => {
            if (item.type === 'feed') return <FeedCard key={`feed-${item.day}`} item={item.item} kit={kit} dayNumber={item.day} />;
            if (item.type === 'carousel') return <CarouselCardBlock key={`car-${item.day}`} cards={item.cards} kit={kit} dayNumber={item.day} />;
            if (item.type === 'reels') return <ReelsCard key={`reels-${item.day}`} reels={item.reels} kit={kit} dayNumber={item.day} />;
            return null;
          })}
        </div>
      )}

      {(result.stories?.length ?? 0) > 0 && (
        <div className="resultBlock">
          <h3>Stories</h3>
          {result.stories!.map(seq => <StoriesBlock key={seq.dia} seq={seq} />)}
        </div>
      )}
    </section>
  );
}
