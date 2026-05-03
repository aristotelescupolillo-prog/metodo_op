import { getRecommendedMoods, templateMoods } from '../data/templateCatalog';
import { MoodCode, Segment } from '../types';

interface Props {
  segment: Segment;
  selected: MoodCode;
  onSelect: (code: MoodCode) => void;
}

export default function TemplateChooser({ segment, selected, onSelect }: Props) {
  const moods = getRecommendedMoods(segment);
  return (
    <section className="panel">
      <div className="sectionHeader">
        <div>
          <span className="eyebrow">Forma visual</span>
          <h2>O que você quer comunicar hoje?</h2>
        </div>
        <p>O sistema ordena primeiro os moods recomendados pelo segmento do Kit de Marca.</p>
      </div>
      <div className="moodGrid">
        {moods.map((mood) => (
          <button
            key={mood.code}
            className={`moodCard ${selected === mood.code ? 'active' : ''}`}
            onClick={() => onSelect(mood.code)}
            type="button"
          >
            <span className="moodMini" style={{ background: mood.color }} />
            <strong>{mood.code} · {mood.name}</strong>
            <small>{mood.intent}</small>
            {mood.recommendedFor.includes(segment) && <em>recomendado</em>}
          </button>
        ))}
      </div>
      <p className="note">Variações internas ficam para a etapa técnica dos templates. Nesta base, o mood já governa cor, hierarquia e direção visual inicial.</p>
    </section>
  );
}
