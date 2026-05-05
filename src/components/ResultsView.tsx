import { useState } from 'react';
import { BrandKit, CarouselCard, FeedItem, MethodOpResult, MoodCode, StoriesSequence } from '../types';
import { downloadDataUrl } from '../utils/canvasComposer';
import { generatePostImage } from '../services/api';
import { applyLogoToImage } from '../utils/applyLogo';
import { generateSequencePdf } from '../utils/generatePdf';

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
        leituraCenica: (item as any).leituraCenica,
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
  const [previews, setPreviews] = useState<(string | null)[]>(cards.map(() => null));
  const [busyIndex, setBusyIndex] = useState<number | null>(null);

  async function handleGenerateCard(index: number) {
    setBusyIndex(index);
    try {
      const card = cards[index];
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
        leituraCenica: (card as any).leituraCenica,
      });
      const final = kit.logoDataUrl ? await applyLogoToImage(url, kit, 'post') : url;
      setPreviews(prev => prev.map((p, i) => i === index ? final : p));
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally { setBusyIndex(null); }
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
          {cards.map((card, index) => (
            <div key={card.card} className="carouselCardBlock">
              <span className="cardTag">Card {card.card} — {card.titulo}</span>
              <p>{card.texto}</p>
              <small className="imageHint">{card.imagePrompt}</small>
              {previews[index] && (
                <div className="previewWrapper">
                  <img src={previews[index]!} alt={`Card ${card.card}`} className="previewImg" />
                </div>
              )}
              <div className="cardActions">
                <button
                  className="generateBtn"
                  type="button"
                  onClick={() => handleGenerateCard(index)}
                  disabled={busyIndex !== null}
                >
                  {busyIndex === index ? 'Gerando...' : previews[index] ? '↻ Gerar novamente' : '⬇ Gerar card'}
                </button>
                {previews[index] && (
                  <button
                    className="downloadBtn"
                    type="button"
                    onClick={() => downloadDataUrl(previews[index]!, `dia-${dayNumber}-card-${card.card}.jpg`)}
                  >
                    Baixar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function ReelsCard({ reels, kit, mood, dayNumber }: { reels: NonNullable<MethodOpResult['reels']>; kit: BrandKit; mood: MoodCode; dayNumber: number }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busyVideo, setBusyVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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
      setVideoUrl(null);
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally { setBusy(false); }
  }

  async function handleGenerateVideo() {
    if (!preview) return;
    setBusyVideo(true);
    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: preview,
          script: reels.script,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar vídeo');
      setVideoUrl(data.videoUrl);
    } catch (e) {
      alert(`Erro: ${(e as Error).message}`);
    } finally { setBusyVideo(false); }
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
            <button className="generateBtn" type="button" onClick={handleGenerate} disabled={busy || busyVideo}>
              {busy ? 'Gerando...' : preview ? '↻ Gerar novamente' : '⬇ Gerar imagem pura'}
            </button>
            {preview && (
              <button className="downloadBtn" type="button" onClick={() => downloadDataUrl(preview, `dia-${dayNumber}-reels.jpg`)}>
                Baixar
              </button>
            )}
          </div>
          {preview && (
            <div className="cardActions" style={{ marginTop: 8 }}>
              <button className="generateBtn" type="button" onClick={handleGenerateVideo} disabled={busyVideo || busy}>
                {busyVideo ? 'Gerando vídeo...' : videoUrl ? '↻ Gerar vídeo novamente' : '🎬 Gerar vídeo com voz'}
              </button>
            </div>
          )}
          {videoUrl && (
            <div className="previewWrapper" style={{ marginTop: 12 }}>
              <video src={videoUrl} controls style={{ width: '100%', borderRadius: 12 }} />
              <a href={videoUrl} download={`dia-${dayNumber}-reels.mp4`} className="downloadBtn" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
                ⬇ Baixar vídeo
              </a>
            </div>
          )}
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
  const [savingPdf, setSavingPdf] = useState(false);

  if (!result) return null;

  async function handlePdf() {
    setSavingPdf(true);
    try {
      const filename = `metodo-op-${kit.companyName}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      const bytes = generateSequencePdf(result!, kit, mood);
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      await fetch('/api/supabase-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: kit.companyName, pdfBase64: base64, filename }),
      });
    } catch (e) {
      console.error('Erro ao salvar PDF:', e);
    } finally {
      setSavingPdf(false);
    }
  }

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
        <button className="pdfBtn" type="button" onClick={handlePdf} disabled={savingPdf}>
          {savingPdf ? 'Salvando...' : '📄 Baixar PDF'}
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
