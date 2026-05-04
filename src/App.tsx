import { useState, useEffect } from 'react';
import BrandKitForm from './components/BrandKitForm';
import ContentForm from './components/ContentForm';
import TemplateChooser from './components/TemplateChooser';
import ResultsView from './components/ResultsView';
import { defaultVoice } from './data/brandVoice';
import { generateMethodContent } from './services/api';
import { saveKitToSupabase, loadKitFromSupabase, listKits } from './services/supabase';
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
  const [kit, setKit] = useState<BrandKit>(() => loadKit(defaultKit as any) as unknown as BrandKit);
  const [mood, setMood] = useState<MoodCode>('OP-01');
  const [result, setResult] = useState<MethodOpResult | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ContentFormData>(() => loadForm(defaultForm as any) as unknown as ContentFormData);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [showClients, setShowClients] = useState(false);
  const [loadingClient, setLoadingClient] = useState(false);

  useEffect(() => { saveKit(kit as any); }, [kit]);
  useEffect(() => { saveForm(form as any); }, [form]);
  useEffect(() => { listKits().then(setClients); }, []);

  function handleKitChange(next: BrandKit) {
    setKit(next);
    setForm((prev) => ({
      ...prev,
      companyName: next.companyName,
      segment: next.segment,
      brandVoice: next.brandVoice,
      mainActivity: (next as any).mainActivity || prev.mainActivity,
      instagramUrl: (next as any).instagramUrl || prev.instagramUrl,
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      saveKit(kit as any);
      saveForm(form as any);
      await saveKitToSupabase(kit);
      const updated = await listKits();
      setClients(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadClient(companyName: string) {
    setLoadingClient(true);
    try {
      const loaded = await loadKitFromSupabase(companyName);
      if (loaded) {
        handleKitChange(loaded);
        setShowClients(false);
      }
    } finally {
      setLoadingClient(false);
    }
  }

  function handleClear() {
    if (!confirm('Limpar kit de marca e dados locais?')) return;
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
          <button className="saveBtn" type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : saved ? '✓ Salvo' : '💾 Salvar kit'}
          </button>
          <div className="clientSelector">
            <button className="clientBtn" type="button" onClick={() => setShowClients(o => !o)}>
              📂 Carregar cliente {clients.length > 0 ? `(${clients.length})` : ''}
            </button>
            {showClients && (
              <div className="clientDropdown">
                {loadingClient && <div className="clientItem">Carregando...</div>}
                {clients.length === 0 && (
                  <div className="clientItem" style={{ color: '#94a3b8' }}>Nenhum cliente salvo ainda</div>
                )}
                {clients.map(c => (
                  <button key={c.id} className="clientItem" type="button" onClick={() => handleLoadClient(c.companyName)}>
                    {c.companyName}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="clearBtn" type="button" onClick={handleClear}>
            Limpar
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
