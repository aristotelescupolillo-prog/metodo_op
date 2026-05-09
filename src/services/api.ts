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
// ARQUITETURA: o modelo gera APENAS a imagem (cena pura, sem texto).
// O canvas (composeFeedPng) adiciona título, texto e logo depois,
// usando a tipografia e cores do brand kit do cliente.
//
// Isso garante:
// - Tipografia consistente com a marca (Google Fonts)
// - Tamanho exato de 1080x1350
// - Respiro lateral garantido (110px / 140px)
// - Hierarquia tipográfica controlada (título 800, apoio 400)
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// BLOCOS UNIVERSAIS — aplicados a TODAS as imagens, qualquer mood
// ─────────────────────────────────────────────────────────────────

const TIPOLOGIA_BRASILEIRA = `
TIPOLOGIA HUMANA (regra universal, vale para qualquer mood):
- Pessoas brasileiras autênticas, de tipologia latino-americana.
- Etnias permitidas: negros brasileiros, pardos miscigenados, brancos brasileiros (mediterrânicos, descendentes de italianos, descendentes de alemães do sul), mulatos, caboclos miscigenados.
- PROIBIDO traços asiáticos do leste (japonês, chinês, coreano, vietnamita) — não usar fenótipo do Leste Asiático.
- PROIBIDO traços indígenas puros e traços sul-asiáticos puros (indianos, paquistaneses).
- Variação de idade conforme contexto: não privilegiar apenas jovens executivos; mostrar adultos maduros, idosos, jovens, conforme o público da peça.
- Naturalidade brasileira: postura relaxada quando o mood permitir, expressão calorosa quando o tom for de proximidade.
`.trim();

const VESTIMENTA_TROPICAL = `
VESTIMENTA DE CLIMA TROPICAL (regra universal):
- Roupas leves e respiráveis, coerentes com clima quente do Brasil.
- Categorias profissionais visíveis quando aplicável: jaleco de mecânico, polo de balconista, uniforme de comércio, blusa de balconista, polo de fazendeiro, camisa social de manga curta, blusa leve.
- PROIBIDO: terno e gravata como padrão genérico, sobretudos, casacos pesados, roupa de inverno europeu.
- Permitido formal apenas quando o contexto da peça pedir explicitamente (advogado, médico, executivo de banco) — e mesmo assim, sem terno completo: camisa social, no máximo blazer leve.
- A vestimenta deve ajudar a identificar o tipo social do personagem (comerciante, profissional liberal, trabalhador, dono de pequeno negócio).
`.trim();

const PROIBICAO_TEXTO = `
⚠️ REGRA ABSOLUTA — IMAGEM 100% PURA, SEM QUALQUER TEXTO:
- PROIBIDO desenhar QUALQUER letra, palavra, número, frase, título, slogan, watermark, marca, logotipo, etiqueta, rótulo, placa de rua, cartaz, livro com título visível, tela de computador com texto legível, post-it com escrita, quadro com texto, ou qualquer elemento gráfico textual.
- A imagem deve ser COMPLETAMENTE LIVRE de letras e palavras. Apenas a CENA visual.
- Se a cena envolver tela de computador, dashboard ou caderno, eles devem mostrar gráficos abstratos, formas geométricas, ou linhas — NUNCA texto legível.
- Se a cena envolver placas, livros ou papéis, eles devem aparecer SEM título visível, SEM texto, em branco ou desfocados.
- O título e o texto da peça serão adicionados DEPOIS, fora do modelo, por um sistema gráfico separado. Você NÃO precisa indicar onde eles ficarão.
- Resultado esperado: uma fotografia editorial pura, sem nenhuma palavra escrita em lugar nenhum da imagem.
`.trim();

const RESPIRO_VISUAL = `
COMPOSIÇÃO VISUAL (comportamento obrigatório):
- Personagem central com espaço visual ao redor (cabeça, ombros e tronco com folga, sem cortes nas bordas do quadro).
- Margens internas generosas em TODOS os lados — o sujeito principal nunca colado nas bordas.
- Cena focada e clara, sem ruído visual nas extremidades.
- Sensação geral: a cena "respira" dentro do quadro, nunca sufocada.
`.trim();

// ─────────────────────────────────────────────────────────────────
// MODULAÇÃO DE FECHAMENTO — específica do estático final
// ─────────────────────────────────────────────────────────────────

const ESTATICO_FINAL_MODIFIER = `
MODULAÇÃO DE FECHAMENTO (formato Estático Final — peça de resolução narrativa):
- Composição mais limpa e centralizada que o estático comum
- Mais espaço negativo, sensação de respiro ampliado
- Foco visual mais concentrado num único elemento principal
- Menor ruído gráfico, menos camadas visuais simultâneas
- Maior estabilidade visual, sensação de equilíbrio assentado
- Sensação geral de resolução e fechamento emocional, não de provocação
- Manter integralmente a identidade do mood escolhido (cores, tipografia, alinhamento, raiz visual)
- Apenas modular intensidade: reduzir agressividade onde houver, aumentar contenção
`.trim();

// ─────────────────────────────────────────────────────────────────
// CONSTRUTOR DO PROMPT VISUAL — gera CENA PURA, sem texto
// ─────────────────────────────────────────────────────────────────

function buildImagePrompt(params: {
  imagePrompt: string;
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
  const { imagePrompt, leituraCenica, moodInstructions, isFinal } = params;

  const cenaDetalhada = leituraCenica
    ? `CENA DETALHADA:
- Intenção emocional: ${leituraCenica.intencao || ''}
- Personagem: ${leituraCenica.personagem || ''}
- Ambiente: ${leituraCenica.ambiente || ''}
- Expressão: ${leituraCenica.expressao || ''}
- Clima/Luz: ${leituraCenica.clima || ''}
- Composição: ${leituraCenica.composicao || ''}
- Referência visual adicional: ${imagePrompt}`
    : `CENA FOTOGRÁFICA: ${imagePrompt}`;

  const finalModifier = isFinal ? `\n${ESTATICO_FINAL_MODIFIER}\n` : '';

  return `Crie uma fotografia editorial pura para um post de Instagram. Formato vertical, proporção 4:5.

${PROIBICAO_TEXTO}

${RESPIRO_VISUAL}

${moodInstructions}
${finalModifier}
${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

${cenaDetalhada}

REGRAS DE RENDERIZAÇÃO:
- Imagem realista, fotográfica, sem nenhum texto.
- Pessoas brasileiras autênticas com fenótipo latino-americano.
- A tampa traseira de tablets e celulares é uma superfície SÓLIDA e OPACA — não tem tela, não tem display, não mostra absolutamente nada.
- Telas e dashboards visíveis devem mostrar gráficos abstratos, NUNCA texto legível.
- Alta resolução, estética editorial contemporânea brasileira.
- A cena toda livre de palavras, letras, marcas e textos.`;
}

// ─────────────────────────────────────────────────────────────────
// INSTRUÇÕES POR MOOD — composição/paleta/tipografia (não tocam em etnia/vestuário/ambiente)
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
- IMPORTANTE: esta foto vai ocupar APENAS UMA ZONA do layout cubista final, então mantenha o sujeito centralizado e bem enquadrado`,

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
// FUNÇÃO PÚBLICA — gera 1 imagem PURA chamando o backend
// (texto/título/logo são adicionados depois pelo canvas)
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
  const { imagePrompt, mood, vertical, leituraCenica } = params;

  const isReels = vertical === 'reels';
  const isFinal = vertical === 'estatico_final';
  const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];

  const prompt = isReels
    ? `${moodInstructions}

${PROIBICAO_TEXTO}

${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

CENA: ${imagePrompt}. Imagem pura sem texto, sem assinatura, sem logo, composição vertical cinematográfica 9:16, alta qualidade.`
    : buildImagePrompt({
        imagePrompt,
        leituraCenica,
        moodInstructions,
        isFinal,
      });

  // Tamanho enviado ao backend: reels = vertical 9:16, demais = 4:5
  // O canvas reescala depois pra 1080x1350 final.
  const size = isReels ? '1024x1920' : '1024x1536';

  // Chama o backend (que protege a chave da fal.ai e suporta Flux Pro / Nano Banana Pro)
  const res = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, size }),
  });

  if (!res.ok) {
    const errPayload = await res.json().catch(() => ({}));
    throw new Error(errPayload.error || 'Erro ao gerar imagem');
  }

  const data = await res.json();
  if (!data.imageDataUrl) throw new Error('imageDataUrl ausente na resposta');

  // O backend retorna a CENA PURA em base64.
  // O ResultsView passa essa imagem pelo canvas (composeFeedPng) antes de mostrar.
  return data.imageDataUrl;
}
