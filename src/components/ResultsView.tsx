import { useState } from 'react';
import { BrandKit, CarouselCard, FeedItem, MethodOpResult, MoodCode, StoriesSequence } from '../types';
import { downloadDataUrl } from '../utils/canvasComposer';
import { generatePostImage } from '../services/api';
import { applyLogoToImage } from '../utils/applyLogo';
import { generateSequencePdf } from '../utils/generatePdf';
import JSZip from 'jszip';

interface Props {
  result?: MethodOpResult;
  kit: BrandKit;
  mood: MoodCode;
}

function FeedCard({ item, kit, mood, dayNumber }: { item: FeedItem; kit: BrandKit; mood: MoodCode; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    try {
      const url = await generatePostImage({
        imagePrompt: item.imagem,
        titulo: item.titulo,
        texto: item.texto,
        companyName: kit.companyName,
        primaryColor: kit.primaryColor,
        accentColor: kit.accentColor || '#f4b000',
        fontFamily: kit.fontPair || 'Montserrat',
        mood,
        vertical: 'post',
      });
      const final = kit.logoDataUrl ? await applyLogoToImage(url, kit, 'post') : url;
      setPreview(final);
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
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
          {preview && <div className="previewWrapper"><img src={preview} alt="Preview" className="previewImg" /></div>}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando...' : preview ? '↻ Gerar novamente' : '⬇ Gerar post'}
            </button>
            {preview && (
              <button className="downloadBtn" type="button" onClick={() => downloadDataUrl(preview, `dia-${dayNumber}.jpg`)}>
                Baixar
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CarouselCardBlock({ cards, kit, mood, dayNumber }: { cards: CarouselCard[]; kit: BrandKit; mood: MoodCode; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  async function handleGenerate() {
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const card of cards) {
        const url = await generatePostImage({
          imagePrompt: card.imagePrompt,
          titulo: card.titulo,
          texto: card.texto,
          companyName: kit.companyName,
          primaryColor: kit.primaryColor,
          accentColor: kit.accentColor || '#f4b000',
          fontFamily: kit.fontPair || 'Montserrat',
          mood,
          vertical: 'post',
        });
        const final = kit.logoDataUrl ? await applyLogoToImage(url, kit, 'post') : url;
        urls.push(final);
      }
      setPreviews(urls);
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    previews.forEach((p, i) => {
      const base64 = p.split(',')[1];
      zip.file(`card-${i + 1}.jpg`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dia-${dayNumber}-carrossel.zip`;
    a.click();
    URL.revokeObjectURL(url);
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
                <div key={i} className="carouselPreviewItem">
                  <img src={p} alt={`Card ${i + 1}`} className="carouselPreviewImg" />
                  <button className="downloadBtnSmall" type="button" onClick={() => downloadDataUrl(p, `dia-${dayNumber}-card-${i + 1}.jpg`)}>
                    ⬇ Card {i + 1}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? `Gerando ${cards.length} cards...` : previews.length > 0 ? '↻ Gerar novamente' : '⬇ Gerar cards'}
            </button>
            {previews.length > 0 && (
              <button className="downloadBtn" type="button" onClick={handleDownloadZip}>
                ⬇ Baixar ZIP
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function ReelsCard({ reels, kit, mood, dayNumber }: { reels: NonNullable<MethodOpResult['reels']>; kit: BrandKit; mood: MoodCode; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    try {
      const url = await generatePostImage({
        imagePrompt: reels.imagePrompt,
        titulo: '',
        texto: '',
        companyName: kit.companyName,
        primaryColor: kit.primaryColor,
        accentColor: kit.accentColor || '#f4b000',
        fontFamily: kit.fontPair || 'Montserrat',
        mood,
        vertical: 'reels',
      });
      setPreview(url);
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
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
          {preview && <div className="previewWrapper"><img src={preview} alt="Reels" className="previewImgReels" /></div>}
          <div className="cardActions">
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy}>
              {busy ? 'Gerando...' : preview ? '↻ Gerar novamente' : '⬇ Gerar imagem pura'}
            </button>
            {preview && (
              <button className="downloadBtn" type="button" onClick={() => downloadDataUrl(preview, `dia-${dayNumber}-reels.jpg`)}>
                Baixar
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

export default function ResultsView({ result, kit, mood }: Props) {
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
        <button className="pdfBtn" type="button" onClick={() => generateSequencePdf(result, kit, mood)}>
          📄 Baixar PDF
        </button>
      </div>

      {sequence.length > 0 && (
        <div className="resultBlock">
          <h3>Sequência do feed</h3>
          {sequence.map((item) => {
            if (item.type === 'feed') return <FeedCard key={`feed-${item.day}`} item={item.item} kit={kit} mood={mood} dayNumber={item.day} />;
            if (item.type === 'carousel') return <CarouselCardBlock key={`car-${item.day}`} cards={item.cards} kit={kit} mood={mood} dayNumber={item.day} />;
            if (item.type === 'reels') return <ReelsCard key={`reels-${item.day}`} reels={item.reels} kit={kit} mood={mood} dayNumber={item.day} />;
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
