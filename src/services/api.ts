import { buildMetodoOpPrompt, normalizeMethodResult } from '../core/organizaMethodEngine';
import { ContentFormData, MethodOpResult, MoodCode } from '../types';

export async function generateMethodContent(data: ContentFormData): Promise<MethodOpResult> {
  const prompt = buildMetodoOpPrompt(data);
  const res = await fetch('/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error || 'Erro ao gerar conteúdo');
  return normalizeMethodResult(payload.result, data.track);
}

// ─────────────────────────────────────────────────────────────────
// ARQUITETURA — Caminho B
// O GPT-Image-1 entrega a peça PRONTA: foto + título + corpo + design.
// O Canvas só carimba a logomarca depois (applyLogoToImage), sem
// desenhar texto. Por isso o prompt manda o título e o corpo
// EXPLICITAMENTE para o modelo, com instruções tipográficas duras
// para evitar o efeito de "tipo fantasma duplicado".
// ─────────────────────────────────────────────────────────────────

const TIPOLOGIA_BRASILEIRA = `
TIPOLOGIA HUMANA (regra universal, vale para qualquer mood):
- Pessoas brasileiras autênticas, de tipologia latino-americana.
- Etnias permitidas: negros brasileiros, pardos miscigenados, brancos brasileiros (mediterrânicos, descendentes de italianos, descendentes de alemães do sul), mulatos, caboclos miscigenados.
- PROIBIDO traços asiáticos do leste (japonês, chinês, coreano, vietnamita).
- PROIBIDO traços indígenas puros e traços sul-asiáticos puros (indianos, paquistaneses).
- Variação de idade conforme contexto: não privilegiar apenas jovens executivos; mostrar adultos maduros, idosos, jovens, conforme o público da peça.
- Naturalidade brasileira: postura relaxada quando o mood permitir, expressão calorosa quando o tom for de proximidade.
`.trim();

const VESTIMENTA_TROPICAL = `
VESTIMENTA DE CLIMA TROPICAL (regra universal):
- Roupas leves e respiráveis, coerentes com clima quente do Brasil.
- Categorias profissionais visíveis quando aplicável: jaleco de mecânico, polo de balconista, uniforme de comércio, blusa de balconista, polo de fazendeiro, camisa social de manga curta, blusa leve.
- PROIBIDO: terno e gravata como padrão genérico, sobretudos, casacos pesados, roupa de inverno europeu.
- Permitido formal apenas quando o contexto da peça pedir explicitamente — e mesmo assim, sem terno completo: camisa social, no máximo blazer leve.
`.trim();

// ─────────────────────────────────────────────────────────────────
// REGRAS TIPOGRÁFICAS — antídoto contra o "tipo fantasma duplicado"
// ─────────────────────────────────────────────────────────────────

function buildTypographyRules(params: {
  titulo: string;
  texto: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}): string {
  const { titulo, texto, primaryColor, accentColor, fontFamily } = params;
  return `
DESIGN E TIPOGRAFIA DA PEÇA (regras absolutas, devem ser obedecidas integralmente):

CORES DO BRAND KIT:
- Cor primária da marca: ${primaryColor} (use em blocos sólidos, faixas ou tipografia de destaque)
- Cor de acento: ${accentColor} (use com parcimônia em detalhes, faixas finas ou pontos de respiração)
- Branco: para tipografia sobre fundos escuros
- Preto/cinza muito escuro: para tipografia sobre fundos claros

TIPOGRAFIA — UMA ÚNICA FONTE, UMA ÚNICA HIERARQUIA:
- Use a família "${fontFamily}" (ou uma sans-serif geométrica equivalente) em TODOS os textos da peça.
- PROIBIDO usar duas fontes diferentes na mesma peça.
- PROIBIDO efeito de "tipo grande borrado/fantasma atrás do tipo principal".
- PROIBIDO sobrepor o mesmo texto duas vezes em tamanhos diferentes.
- PROIBIDO tipografia decorativa, script, manuscrita ou serifada como destaque principal.
- O título aparece UMA ÚNICA VEZ na peça, em peso bold ou extrabold, alinhado à esquerda ou centralizado, com kerning normal.
- O corpo aparece UMA ÚNICA VEZ, em peso regular ou medium, abaixo ou separado do título por uma faixa de cor.
- Sem outline, sem sombra dramática, sem deformações tipográficas, sem letras saindo do quadro.

TEXTO QUE DEVE APARECER NA IMAGEM (renderizar exatamente como está, em português, sem alterar uma vírgula, sem traduzir, sem reescrever):

TÍTULO PRINCIPAL: "${titulo}"

CORPO DE APOIO: "${texto}"

REGRAS FINAIS DE TEXTO:
- NÃO inventar nenhuma outra palavra ou frase além das duas linhas acima.
- NÃO desenhar logotipo, marca, watermark, slogan ou hashtag — a logomarca é aplicada depois pelo sistema.
- NÃO repetir o título mais de uma vez em lugar nenhum da peça.
- A peça deve ter respiro generoso entre o título e o corpo, sem sobreposição de texto sobre o rosto da pessoa.
`.trim();
}

const RESPIRO_VISUAL = `
COMPOSIÇÃO VISUAL (comportamento obrigatório):
- Personagem central com espaço visual ao redor (cabeça, ombros e tronco com folga, sem cortes nas bordas do quadro).
- Margens internas generosas em TODOS os lados — o sujeito principal nunca colado nas bordas.
- Cena focada e clara, sem ruído visual nas extremidades.
- Sensação geral: a cena "respira" dentro do quadro, nunca sufocada.
- O rosto da pessoa NUNCA pode ser coberto por título, corpo ou faixa de cor.
`.trim();

const ESTATICO_FINAL_MODIFIER = `
MODULAÇÃO DE FECHAMENTO (formato Estático Final — peça de resolução narrativa):
- Composição mais limpa e centralizada que o estático comum
- Mais espaço negativo, sensação de respiro ampliado
- Foco visual mais concentrado num único elemento principal
- Menor ruído gráfico, menos camadas visuais simultâneas
- Maior estabilidade visual, sensação de equilíbrio assentado
- Sensação geral de resolução e fechamento emocional, não de provocação
- Manter integralmente a identidade do mood escolhido (cores, tipografia, alinhamento, raiz visual)
`.trim();

// ─────────────────────────────────────────────────────────────────
// CONSTRUTOR DO PROMPT — peça pronta (foto + título + corpo + design)
// ─────────────────────────────────────────────────────────────────

function buildImagePrompt(params: {
  imagePrompt: string;
  titulo: string;
  texto: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  leituraCenica?: {
    intencao?: string;
    personagem?: string;
    ambiente?: string;
    expressao?: string;
    clima?: string;
    composicao?: string;
  };
  moodInstructions: string;
  isFinal?: boolean;
}): string {
  const {
    imagePrompt,
    titulo,
    texto,
    primaryColor,
    accentColor,
    fontFamily,
    leituraCenica,
    moodInstructions,
    isFinal,
  } = params;

  const cenaDetalhada = leituraCenica
    ? `CENA FOTOGRÁFICA DE FUNDO:
- Intenção emocional: ${leituraCenica.intencao || ''}
- Personagem: ${leituraCenica.personagem || ''}
- Ambiente: ${leituraCenica.ambiente || ''}
- Expressão: ${leituraCenica.expressao || ''}
- Clima/Luz: ${leituraCenica.clima || ''}
- Composição: ${leituraCenica.composicao || ''}
- Referência visual adicional: ${imagePrompt}`
    : `CENA FOTOGRÁFICA DE FUNDO: ${imagePrompt}`;

  const finalModifier = isFinal ? `\n${ESTATICO_FINAL_MODIFIER}\n` : '';

  const tipografia = buildTypographyRules({ titulo, texto, primaryColor, accentColor, fontFamily });

  return `Crie uma peça gráfica completa para um post de Instagram, formato vertical 4:5.
A peça final deve combinar uma fotografia editorial de fundo com tipografia limpa por cima, num layout único e harmonioso.

${RESPIRO_VISUAL}

${moodInstructions}
${finalModifier}
${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

${cenaDetalhada}

${tipografia}

REGRAS DE RENDERIZAÇÃO:
- Imagem realista e fotográfica para o fundo, com tipografia digital limpa por cima.
- Pessoas brasileiras autênticas com fenótipo latino-americano.
- A tampa traseira de tablets e celulares é uma superfície SÓLIDA e OPACA.
- Telas e dashboards devem mostrar gráficos abstratos, NUNCA texto legível.
- Alta resolução, estética editorial contemporânea brasileira.
- O texto da peça (título + corpo) deve aparecer EXATAMENTE como informado, em português, em UMA ÚNICA versão, sem efeitos de fantasma, duplicação ou sobreposição tipográfica.`;
}

// ─────────────────────────────────────────────────────────────────
// PROMPT PURO PARA REELS — frame de vídeo, sem texto sobreposto
// ─────────────────────────────────────────────────────────────────

function buildReelsPrompt(params: {
  imagePrompt: string;
  moodInstructions: string;
}): string {
  const { imagePrompt, moodInstructions } = params;
  return `Crie um frame fotográfico vertical 9:16 para um Reels de Instagram. Foto editorial pura, SEM nenhum texto, letra ou palavra desenhada na imagem.

${RESPIRO_VISUAL}

${moodInstructions}

${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

CENA FOTOGRÁFICA: ${imagePrompt}

REGRAS:
- Imagem 100% livre de texto, letras, marcas e logotipos.
- Telas e dashboards mostram gráficos abstratos, nunca texto legível.
- Alta resolução, estética editorial contemporânea brasileira.`.trim();
}

// ─────────────────────────────────────────────────────────────────
// INSTRUÇÕES POR MOOD
// ─────────────────────────────────────────────────────────────────

const moodVisualInstructions: Record<MoodCode, string> = {
  'OP-01': `ESTILO VISUAL — OP-01 CLAREZA (raiz: Renascentista):
- Composição equilibrada e simétrica, hierarquia visual clara
- Luz natural equilibrada, sem dramaticidade
- Fundo limpo, sem elementos decorativos desnecessários
- Paleta fria e controlada
- Sensação de organização visual e leitura fácil`,

  'OP-02': `ESTILO VISUAL — OP-02 IMPACTO (raiz: Barroco):
- Fundo muito escuro, contraste extremo
- Iluminação dramática, luz focal sobre o elemento principal
- Composição assimétrica com tensão visual intencional
- Sombras profundas, luz e sombra como protagonistas
- Atmosfera intensa e magnética`,

  'OP-03': `ESTILO VISUAL — OP-03 INSTANTE (raiz: Impressionista):
- Foto de bastidor ou cena cotidiana capturada ao vivo
- Filtro quente e orgânico, luz ambiente natural sem estúdio
- Sem simetria rígida, sem moldura formal
- Sensação de captura espontânea, autêntica
- Cores vibrantes e quentes, textura visível`,

  'OP-04': `ESTILO VISUAL — OP-04 FRAGMENTO (raiz: Cubista):
- Cena fotográfica com personagem em ação, enquadrada com clareza
- Composição limpa e centralizada — a foto será inserida numa zona definida do layout final
- Foco no personagem e no que ele faz, sem elementos competindo nas bordas
- Paleta controlada que harmonize com cores do brand kit
- IMPORTANTE: o sujeito centralizado e bem enquadrado, sem corte nas bordas`,

  'OP-05': `ESTILO VISUAL — OP-05 DESVIO (raiz: Surrealista):
- Imagem-conceito com elemento inesperado ou metáfora visual
- Composição ousada que provoca estranhamento controlado
- Elemento fora do lugar como ponto focal
- Paleta incomum ou contraste inesperado
- Sombras presentes mas LEVES — o rosto e a cabeça das pessoas NUNCA podem ficar encobertos por escurecimento
- Iluminação equilibrada: o elemento surreal não pode obscurecer o sujeito principal`,

  'OP-06': `ESTILO VISUAL — OP-06 SILÊNCIO (raiz: Minimalista):
- Fundo quase branco ou muito claro, espaço vazio como elemento principal
- Composição com muito respiro, elementos reduzidos ao essencial
- Foco num único sujeito, sem distração
- Sensação de premium, contenção e autoridade`,
};

// ─────────────────────────────────────────────────────────────────
// FUNÇÃO PÚBLICA
// Posts/finais: GPT-Image-1 entrega peça pronta com tipografia.
// Reels: GPT-Image-1 entrega cena pura, sem texto.
// Em ambos os casos, o Canvas só carimba a logomarca depois.
// ─────────────────────────────────────────────────────────────────

export async function generatePostImage(params: {
  imagePrompt: string;
  titulo: string;
  texto: string;
  companyName: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoDataUrl?: string;
  mood: MoodCode;
  vertical: 'post' | 'reels' | 'estatico_final';
  leituraCenica?: {
    intencao?: string;
    personagem?: string;
    ambiente?: string;
    expressao?: string;
    clima?: string;
    composicao?: string;
  };
}): Promise<string> {
  const {
    imagePrompt,
    titulo,
    texto,
    primaryColor,
    accentColor,
    fontFamily,
    mood,
    vertical,
    leituraCenica,
  } = params;

  const isReels = vertical === 'reels';
  const isFinal = vertical === 'estatico_final';
  const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];

  const prompt = isReels
    ? buildReelsPrompt({ imagePrompt, moodInstructions })
    : buildImagePrompt({
        imagePrompt,
        titulo,
        texto,
        primaryColor,
        accentColor,
        fontFamily,
        leituraCenica,
        moodInstructions,
        isFinal,
      });

  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({}));
    throw new Error(errPayload.error || 'Erro ao gerar imagem');
  }

  const data = await res.json();
  if (!data.imageDataUrl) throw new Error('imageDataUrl ausente na resposta');

  return data.imageDataUrl;
}
