import { BrandKit, FontPair, Segment } from '../types';
import { brandVoiceCatalog, defaultVoice } from '../data/brandVoice';
import { fileToDataUrl } from '../utils/file';

interface Props {
  kit: BrandKit;
  onChange: (kit: BrandKit) => void;
}

const FONTS: { value: FontPair; label: string; sample: string; category: 'sans' | 'serif' }[] = [
  { value: 'Inter',            label: 'Inter',            sample: 'Aa', category: 'sans'  },
  { value: 'Montserrat',       label: 'Montserrat',       sample: 'Aa', category: 'sans'  },
  { value: 'Poppins',          label: 'Poppins',          sample: 'Aa', category: 'sans'  },
  { value: 'Raleway',          label: 'Raleway',          sample: 'Aa', category: 'sans'  },
  { value: 'Roboto Slab',      label: 'Roboto Slab',      sample: 'Aa', category: 'serif' },
  { value: 'Playfair Display', label: 'Playfair Display', sample: 'Aa', category: 'serif' },
  { value: 'Lora',             label: 'Lora',             sample: 'Aa', category: 'serif' },
  { value: 'Merriweather',     label: 'Merriweather',     sample: 'Aa', category: 'serif' },
];

const COLORS_PRESET = [
  '#123a63','#0f172a','#1e3a5f','#1a1a2e',
  '#7c3aed','#0891b2','#059669','#dc2626',
  '#d97706','#f4b000','#e5e7eb','#ffffff',
];

export default function BrandKitForm({ kit, onChange }: Props) {
  const update = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => onChange({ ...kit, [key]: value });
  const changeSegment = (segment: Segment) => onChange({ ...kit, segment, brandVoice: defaultVoice(segment) });

  const sansFonts = FONTS.filter(f => f.category === 'sans');
  const serifFonts = FONTS.filter(f => f.category === 'serif');

  return (
    <section className="panel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Base editável</span>
          <h2>Kit de Marca</h2>
        </div>
        <p>Entra uma vez e governa tudo: logo, cor, fonte e voz.</p>
      </div>

      <div className="grid2">
        <label>Nome da marca
          <input value={kit.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="Oficina de Propaganda" />
        </label>
        <label>Segmento
          <select value={kit.segment} onChange={(e) => changeSegment(e.target.value as Segment)}>
            <option value="SERVIÇOS">Serviços</option>
            <option value="VAREJO">Varejo</option>
            <option value="MARCA">Marca</option>
          </select>
        </label>
      </div>

      <div className="grid2">
        <label>Logotipo
          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) update('logoDataUrl', await fileToDataUrl(file));
          }} />
          {kit.logoDataUrl && <img src={kit.logoDataUrl} alt="logo" style={{ height: 40, objectFit: 'contain', borderRadius: 8, background: '#f1f5f9', padding: 4 }} />}
        </label>
        <label className="checkRow" style={{ alignSelf: 'end', marginBottom: 16 }}>
          <input type="checkbox" checked={kit.logoHasName} onChange={(e) => update('logoHasName', e.target.checked)} />
          Logotipo já contém o nome da marca
        </label>
      </div>

      <div className="colorSection">
        <strong className="colorLabel">Cores da marca</strong>
        <div className="colorGrid">
          {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((key) => (
            <div key={key} className="colorItem">
              <span className="colorName">{key === 'primaryColor' ? 'Primária' : key === 'secondaryColor' ? 'Secundária' : 'Destaque'}</span>
              <div className="colorRow">
                <input type="color" value={kit[key] || '#f4b000'} onChange={(e) => update(key, e.target.value)} className="colorPicker" />
                <input type="text" value={kit[key] || '#f4b000'} onChange={(e) => update(key, e.target.value)} className="colorHex" placeholder="#000000" />
              </div>
              <div className="colorPresets">
                {COLORS_PRESET.map(c => (
                  <button key={c} type="button" className="colorDot" style={{ background: c, border: kit[key] === c ? '2px solid #f4b000' : '2px solid transparent' }} onClick={() => update(key, c)} title={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fontSection">
        <strong className="fontLabel">Tipografia</strong>
        <div className="fontCategories">
          <div className="fontCategory">
            <span className="fontCategoryLabel">Sem serifa — Helvéticas</span>
            <div className="fontGrid">
              {sansFonts.map(f => (
                <button key={f.value} type="button"
                  className={`fontCard${kit.fontPair === f.value ? ' active' : ''}`}
                  onClick={() => update('fontPair', f.value)}
                  style={{ fontFamily: f.value }}>
                  <span className="fontSample">{f.sample}</span>
                  <span className="fontName">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="fontCategory">
            <span className="fontCategoryLabel">Com serifa — Editoriais</span>
            <div className="fontGrid">
              {serifFonts.map(f => (
                <button key={f.value} type="button"
                  className={`fontCard${kit.fontPair === f.value ? ' active' : ''}`}
                  onClick={() => update('fontPair', f.value)}
                  style={{ fontFamily: f.value }}>
                  <span className="fontSample">{f.sample}</span>
                  <span className="fontName">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <label>Tom de voz
        <select value={kit.brandVoice} onChange={(e) => update('brandVoice', e.target.value)}>
          {brandVoiceCatalog[kit.segment].map((voice) => <option key={voice} value={voice}>{voice}</option>)}
        </select>
        <small>Segue o seletor simples do Organiza Postagem.</small>
      </label>

      <label>Atividade principal
        <input
          value={kit.mainActivity || ''}
          onChange={(e) => update('mainActivity', e.target.value)}
          placeholder="Ex.: consultoria de marketing digital para pequenos negócios"
        />
      </label>

      <label>URL do Instagram (opcional)
        <input
          value={kit.instagramUrl || ''}
          onChange={(e) => update('instagramUrl', e.target.value)}
          placeholder="https://instagram.com/perfil"
        />
      </label>
    </section>
  );
}
