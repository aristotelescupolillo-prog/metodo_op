import { ContentFormData, OutputFormat } from '../types';

interface Props {
  data: ContentFormData;
  onChange: (data: ContentFormData) => void;
  onGenerate: () => void;
  loading: boolean;
}

export default function ContentForm({ data, onChange, onGenerate, loading }: Props) {
  const update = <K extends keyof ContentFormData>(key: K, value: ContentFormData[K]) => onChange({ ...data, [key]: value });
  const toggleFormat = (format: OutputFormat) => {
    const exists = data.outputFormats.includes(format);
    const next = exists ? data.outputFormats.filter((f) => f !== format) : [...data.outputFormats, format];
    update('outputFormats', next.length ? next : ['feed']);
  };

  return (
    <section className="panel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Motor preservado</span>
          <h2>Geração de conteúdo</h2>
        </div>
        <p>Campos no espírito do Organiza: segmento, público, momento e informação-chave.</p>
      </div>

      <div className="grid2">
        <label>Público-alvo
          <select value={data.audience} onChange={(e) => update('audience', e.target.value as ContentFormData['audience'])}>
            <option value="B2C">B2C — consumidor final</option>
            <option value="B2B">B2B — empresas/decisores</option>
          </select>
        </label>
        <label>Momento do negócio
          <select value={data.businessMoment} onChange={(e) => update('businessMoment', e.target.value as ContentFormData['businessMoment'])}>
            <option value="lançamento">Lançamento</option>
            <option value="consolidação">Consolidação</option>
            <option value="reativação">Reativação</option>
            <option value="sazonalidade">Sazonalidade</option>
          </select>
        </label>
      </div>

      <label>Atividade principal
        <input value={data.mainActivity} onChange={(e) => update('mainActivity', e.target.value)} placeholder="Ex.: consultoria de marketing digital para pequenos negócios" />
      </label>

      <label>URL do Instagram (opcional)
        <input value={data.instagramUrl || ''} onChange={(e) => update('instagramUrl', e.target.value)} placeholder="https://instagram.com/perfil" />
      </label>

      <label>Informação-chave
        <textarea value={data.keyInfo || ''} onChange={(e) => update('keyInfo', e.target.value)} placeholder="O ponto que deve orientar a geração: promoção, campanha, lançamento, problema do cliente, novidade..." rows={4} />
      </label>

      <div className="formatBox">
        <strong>Quais conteúdos produzir?</strong>
        <div className="checkGrid">
          {[
            ['feed', 'Feed estático'],
            ['carrossel', 'Carrossel — 5 cards'],
            ['reels', 'Reels — guia + imagem pura'],
            ['stories', 'Stories — conteúdo textual'],
          ].map(([value, label]) => (
            <label className="checkRow" key={value}>
              <input type="checkbox" checked={data.outputFormats.includes(value as OutputFormat)} onChange={() => toggleFormat(value as OutputFormat)} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {data.outputFormats.includes('feed') && (
        <label>Quantidade de posts estáticos
          <select value={data.feedQuantity} onChange={(e) => update('feedQuantity', Number(e.target.value) as 3 | 6 | 9)}>
            <option value={3}>3 posts</option>
            <option value={6}>6 posts</option>
            <option value={9}>9 posts</option>
          </select>
        </label>
      )}

      {data.outputFormats.includes('stories') && (
        <div className="grid2">
          <label>Dias de stories
            <select value={data.storiesDays} onChange={(e) => update('storiesDays', Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'dia' : 'dias'}</option>)}
            </select>
          </label>
          <label>Stories por sequência
            <select value={data.storiesQuantity} onChange={(e) => update('storiesQuantity', Number(e.target.value) as 3 | 6)}>
              <option value={3}>3 stories</option>
              <option value={6}>6 stories</option>
            </select>
          </label>
        </div>
      )}

      <button className="primaryBtn" type="button" onClick={onGenerate} disabled={loading || !data.mainActivity.trim()}>
        {loading ? 'Gerando com o método...' : 'Gerar conteúdo'}
      </button>
    </section>
  );
}
