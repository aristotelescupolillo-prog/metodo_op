import { BrandKit, Segment } from '../types';
import { brandVoiceCatalog, defaultVoice } from '../data/brandVoice';
import { fileToDataUrl } from '../utils/file';

interface Props {
  kit: BrandKit;
  onChange: (kit: BrandKit) => void;
}

export default function BrandKitForm({ kit, onChange }: Props) {
  const update = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => onChange({ ...kit, [key]: value });
  const changeSegment = (segment: Segment) => onChange({ ...kit, segment, brandVoice: defaultVoice(segment) });

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
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) update('logoDataUrl', await fileToDataUrl(file));
          }} />
          <small>V1 aceita imagem. Futuro: validar SVG/PDF vetor e PNG transparente em alta.</small>
        </label>
        <label className="checkRow">
          <input type="checkbox" checked={kit.logoHasName} onChange={(e) => update('logoHasName', e.target.checked)} />
          O logotipo já contém o nome da marca
        </label>
      </div>

      <div className="grid3">
        <label>Cor primária
          <input type="color" value={kit.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
        </label>
        <label>Cor secundária
          <input type="color" value={kit.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} />
        </label>
        <label>Cor de destaque
          <input type="color" value={kit.accentColor || '#f4b000'} onChange={(e) => update('accentColor', e.target.value)} />
        </label>
      </div>

      <div className="grid2">
        <label>Tipografia
          <select value={kit.fontPair} onChange={(e) => update('fontPair', e.target.value as BrandKit['fontPair'])}>
            <option value="Inter">Inter — limpa e digital</option>
            <option value="Montserrat">Montserrat — moderna e forte</option>
            <option value="Playfair">Playfair — sofisticada</option>
            <option value="Roboto Slab">Roboto Slab — editorial e firme</option>
          </select>
        </label>
        <label>Tom de voz
          <select value={kit.brandVoice} onChange={(e) => update('brandVoice', e.target.value)}>
            {brandVoiceCatalog[kit.segment].map((voice) => <option key={voice} value={voice}>{voice}</option>)}
          </select>
          <small>Segue o seletor simples do Organiza Postagem.</small>
        </label>
      </div>
    </section>
  );
}
