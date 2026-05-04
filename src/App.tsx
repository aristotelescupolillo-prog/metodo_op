import { useState, useEffect } from 'react';
import BrandKitForm from './components/BrandKitForm';
import ContentForm from './components/ContentForm';
import TemplateChooser from './components/TemplateChooser';
import ResultsView from './components/ResultsView';
import { defaultVoice } from './data/brandVoice';
import { generateMethodContent } from './services/api';
import { saveKit, loadKit, saveForm, loadForm, clearAll } from './utils/storage';
import { BrandKit, ContentFormData, MethodOpResult, MoodCode } from './types';
import './style.css';

const defaultKit: BrandKit = {
  companyName: '',
  segment: 'SERVIÇOS',
  logoHasName: true,
  primaryColor: '#123a63',
  secondaryColor: '#0f172a',
  accentColor: '#f4b000',
  fontPair: 'Montserrat',
  brandVoice: defaultVoice('SERVIÇOS'),
};

const defaultForm: ContentFormData = {
  companyName: '',
  segment: 'SERVIÇOS',
  audience: 'B2C',
  mainActivity: '',
  instagramUrl: '',
  businessMoment: 'consolidação',
  keyInfo: '',
  brandVoice: defaultVoice('SERVIÇOS'),
  outputMode: 'feed',
  sequenceSize: 6,
  storiesDays: 3,
  storiesQuantity: 3,
  outputFormats: ['feed', 'carrossel', 'reels'],
};

export default function App() {
  const [kit, setKit] = useState<BrandKit>(() => {
  const saved = loadKit(defaultKit as any) as unknown as BrandKit;
  console.log('Kit carregado:', saved);
  return saved;
});
  const [mood, setMood] = useState<MoodCode>('OP-01');
  const [result, setResult] = useState<MethodOpResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ContentFormData>(() => loadForm(defaultForm as any) as unknown as ContentFormData);
  const [saved, setSaved] = useState(false);

  useEffect(() => { saveKit(kit as any); }, [kit]);
  useEffect(() => { saveForm(form as any); }, [form]);

  function handleKitChange(next: BrandKit) {
    setKit(next);
    setForm((prev) => ({
      ...prev,
      companyName: next.companyName,
      segment: next.segment,
      brandVoice: next.brandVoice,
    }));
  }

  function handleSave() {
    saveKit(kit as any);
    saveForm(form as any);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    if (!confirm('Limpar kit de marca e dados salvos?')) return;
    clearAll();
    setKit(defaultKit);
    setForm(defaultForm);
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setResult(undefined);
    try {
      const generated = await generateMethodContent({
        ...form,
        companyName: kit.companyName,
        segment: kit.segment,
        brandVoice: kit.brandVoice,
      });
      setResult(generated);
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="appShell">
      <header className="hero">
        <span className="eyebrow">Produto independente · Vercel ready</span>
        <h1>MÉTODO OP</h1>
        <p>Organiza o conteúdo, escolhe a forma, gera a imagem base e aplica a marca dentro do próprio app.</p>
        <div className="heroActions">
          <button className="saveBtn" type="button" onClick={handleSave}>
            {saved ? '✓ Salvo' : '💾 Salvar kit'}
          </button>
          <button className="clearBtn" type="button" onClick={handleClear}>
            Limpar dados
          </button>
        </div>
      </header>

      <div className="layout">
        <div className="leftCol">
          <BrandKitForm kit={kit} onChange={handleKitChange} />
          <ContentForm data={form} onChange={setForm} onGenerate={handleGenerate} loading={loading} />
        </div>
        <div className="rightCol">
          <TemplateChooser segment={kit.segment} selected={mood} onSelect={setMood} />
          {error && <div className="errorBox">{error}</div>}
          {loading && (
            <div className="loadingBox">
              <div className="spinner" />
              <p>Gerando conteúdo com o método...</p>
            </div>
          )}
          <ResultsView result={result} kit={kit} mood={mood} />
        </div>
      </div>
    </main>
  );
}
