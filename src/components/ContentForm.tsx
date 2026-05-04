import { ContentFormData } from '../types';

interface Props {
  data: ContentFormData;
  onChange: (data: ContentFormData) => void;
  onGenerate: () => void;
  loading: boolean;
}

const SEQUENCE_COMPOSITION: Record<3 | 6 | 9, { estatico: number; carrossel: number; reels: number }> = {
  3: { estatico: 1, carrossel: 1, reels: 1 },
  6: { estatico: 2, carrossel: 2, reels: 2 },
  9: { estatico: 3, carrossel: 3, reels: 3 },
};

export default function ContentForm({ data, onChange, onGenerate, loading }: Props) {
  const update = <K extends keyof ContentFormData>(key: K, value: ContentFormData[K]) => onChange({ ...data, [key]: value });

  const setMode = (mode: ContentFormData['outputMode']) => {
    const hasFeed = mode === 'feed' || mode === 'feed+stories';
    const hasStories = mode === 'stories' || mode === 'feed+stories';
    const outputFormats: ContentFormData['outputFormats'] = [
      ...(hasFeed ? ['feed', 'carrossel', 'reels'] as const : []),
      ...(hasStories ? ['stories' as const] : []),
    ];
    onChange({ ...data, outputMode: mode, outputFormats });
  };

  const hasFeed = data.outputMode === 'feed' || data.outputMode === 'feed+stories';
  const hasStories = data.outputMode === 'stories' || data.outputMode === 'feed+stories';
  const comp = SEQUENCE_COMPOSITION[data.sequenceSize];

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
        <textarea value={data.keyInfo || ''} onChange={(e) => update('keyInfo', e.target.value)} placeholder="O ponto que deve orientar a geração: promoção, campanha, lançamento, problema do cliente, novidade..." rows={3} />
      </label>

      <div className="formatBox">
        <strong>Quais conteúdos produzir?</strong>
        <div className="radioRow">
          {(['feed', 'stories', 'feed+stories'] as const).map((mode) => (
            <label key={mode} className="radioLabel">
              <input type="radio" name="outputMode" value={mode} checked={data.outputMode === mode} onChange={() => setMode(mode)} />
              {mode === 'feed' ? 'Apenas Feed' : mode === 'stories' ? 'Apenas Stories' : 'Feed + Stories'}
            </label>
          ))}
        </div>

        {hasFeed && (
          <div className="subFormatBox">
            <span className="subFormatLabel">Tamanho da sequência</span>
            <div className="sequenceGrid">
              {([3, 6, 9] as const).map(size => {
                const c = SEQUENCE_COMPOSITION[size];
                return (
                  <button
                    key={size}
                    type="button"
                    className={`sequenceCard${data.sequenceSize === size ? ' active' : ''}`}
                    onClick={() => update('sequenceSize', size)}
                  >
                    <span className="sequenceNum">{size} peças</span>
                    <div className="sequencePills">
                      <span className="pill pill-estatico">{c.estatico} estático{c.estatico > 1 ? 's' : ''}</span>
                      <span className="pill pill-carrossel">{c.carrossel} carrossel{c.carrossel > 1 ? 'is' : ''}</span>
                      <span className="pill pill-reels">{c.reels} reels</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="sequenceNote">
              A distribuição de formatos é definida pelo método — {comp.estatico} estático{comp.estatico > 1 ? 's' : ''}, {comp.carrossel} carrossel{comp.carrossel > 1 ? 'is' : ''} e {comp.reels} reels seguem a progressão da sequência.
            </p>
          </div>
        )}

        {hasStories && (
          <div className="subFormatBox">
            <span className="subFormatLabel">Configuração dos Stories</span>
            <div className="grid2">
              <label>Número de dias
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
          </div>
        )}
      </div>

      <button className="primaryBtn" type="button" onClick={onGenerate} disabled={loading || !data.mainActivity.trim()}>
        {loading ? 'Gerando com o método...' : 'Gerar conteúdo'}
      </button>
    </section>
  );
}
