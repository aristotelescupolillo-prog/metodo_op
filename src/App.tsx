import { useState } from 'react';
import BrandKitForm from './components/BrandKitForm';
import ContentForm from './components/ContentForm';
import TemplateChooser from './components/TemplateChooser';
import ResultsView from './components/ResultsView';
import { defaultVoice } from './data/brandVoice';
import { generateMethodContent } from './services/api';
import { BrandKit, ContentFormData, MethodOpResult, MoodCode } from './types';
import './style.css';

const initialKit: BrandKit = {
  companyName: 'Oficina de Propaganda',
  segment: 'SERVIÇOS',
  logoHasName: true,
  primaryColor: '#123a63',
  secondaryColor: '#0f172a',
  accentColor: '#f4b000',
  fontPair: 'Montserrat',
  brandVoice: defaultVoice('SERVIÇOS'),
};

const initialForm: ContentFormData = {
  companyName: 'Oficina de Propaganda',
  segment: 'SERVIÇOS',
  audience: 'B2C',
  mainActivity: '',
  instagramUrl: '',
  businessMoment: 'consolidação',
  keyInfo: '',
  brandVoice: defaultVoice('SERVIÇOS'),
  outputMode: 'feed',
  feedFormats: ['feed'],
  feedQuantity: 6,
  storiesDays: 3,
  storiesQuantity: 3,
  outputFormats: ['feed'],
};

export default function App() {
  const [kit, setKit] = useState<BrandKit>(initialKit);
  const [mood, setMood] = useState<MoodCode>('OP-01');
  const [result, setResult] = useState<MethodOpResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ContentFormData>(initialForm);

  function handleKitChange(next: BrandKit) {
    setKit(next);
    setForm((prev) => ({
      ...prev,
      companyName: next.companyName,
      segment: next.segment,
      brandVoice: next.brandVoice,
    }));
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
          <ResultsView result={result} kit={kit} />
        </div>
      </div>
    </main>
  );
}
