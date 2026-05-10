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
// ARQUITETURA DEFINITIVA:
// GPT-Image-1 entrega a PEÇA INTEIRA (foto + título + texto + design),
// integrando tipografia, cores e hierarquia da marca.
// O Canvas, depois (applyLogoToImage), só aplica a LOGO com respiro
// de 110px na borda inferior direita. Nada mais.
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// BLOCOS UNIVERSAIS — aplicados a TODAS as imagens, qualquer mood
// ─────────────────────────────────────────────────────────────────

const TIPOLOGIA_BRASILEIRA = `
TIPOLOGIA HUMANA (regra universal):
- Pessoas brasileiras autênticas, de tipologia latino-americana.
- Etnias permitidas: negros brasileiros, pardos miscigenados, brancos brasileiros (mediterrânicos, descendentes de italianos, descendentes de alemães do sul), mulatos, caboclos miscigenados.
- PROIBIDO traços asiáticos do leste (japonês, chinês, coreano, vietnamita).
- PROIBIDO traços indígenas puros e traços sul-asiáticos puros (indianos, paquistaneses).
- Variação de idade conforme contexto.
`.trim();

const VESTIMENTA_TROPICAL = `
VESTIMENTA DE CLIMA TROPICAL:
- Roupas leves e respiráveis, coerentes com clima quente do Brasil.
- Categorias profissionais visíveis quando aplicável: jaleco, polo de balconista, uniforme de comércio, blusa leve, polo de fazendeiro, camisa social de manga curta.
- PROIBIDO: terno e gravata como padrão genérico, sobretudos, casacos pesados, roupa de inverno europeu.
`.trim();

// ─────────────────────────────────────────────────────────────────
// REGRA DE RESPIRO PARA A LOGO
// O Canvas vai carimbar a logo no canto inferior direito com 110px de
// margem. O modelo precisa garantir que esta área esteja livre.
// ─────────────────────────────────────────────────────────────────

const RESPIRO_LOGO = `
ÁREA RESERVADA PARA LOGOMARCA (obrigatória):
- Reserve uma área LIMPA de aproximadamente 280x140px no CANTO INFERIOR DIREITO da imagem.
- Essa área será preenchida depois pela logomarca da marca — nada de texto, rosto, elemento gráfico ou ponto focal pode invadir esse canto.
- Mantenha respiro mínimo de 110px em TODAS as bordas internas da peça.
`.trim();

// ─────────────────────────────────────────────────────────────────
// CONSTRUTOR DO PROMPT VISUAL — GPT-Image-1 monta a peça completa
// (foto + título + texto + design integrados).
// ─────────────────────────────────────────────────────────────────

interface BuildImagePromptParams {
  imagePrompt: string;
  titulo: string;
  texto: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  moodInstructions: string;
  leituraCenica?: {
    intencao?: string;
    personagem?: string;
    ambiente?: string;
    expressao?: string;
    clima?: string;
    composicao?: string;
  };
  isFinal?: boolean;
}

const ESTATICO_FINAL_MODIFIER = `
MODULAÇÃO DE FECHAMENTO (Estático Final — peça de resolução narrativa):
- Composição mais limpa e centralizada
- Mais espaço negativo, sensação de respiro ampliado
- Foco visual concentrado num único elemento principal
- Sensação de resolução e fechamento, não de provocação
`.trim();

function buildImagePrompt(params: BuildImagePromptParams): string {
  const {
    imagePrompt, titulo, texto,
    primaryColor, accentColor, fontFamily,
    moodInstructions, leituraCenica, isFinal,
  } = params;

  const cenaDetalhada = leituraCenica
    ? `CENA FOTOGRÁFICA DETALHADA:
- Intenção emocional: ${leituraCenica.intencao || ''}
- Personagem: ${leituraCenica.personagem || ''}
- Ambiente: ${leituraCenica.ambiente || ''}
- Expressão: ${leituraCenica.expressao || ''}
- Clima/Luz: ${leituraCenica.clima || ''}
- Composição: ${leituraCenica.composicao || ''}
- Referência visual adicional: ${imagePrompt}`
    : `CENA FOTOGRÁFICA: ${imagePrompt}`;

  const finalModifier = isFinal ? `\n${ESTATICO_FINAL_MODIFIER}\n` : '';

  return `Crie uma peça gráfica COMPLETA e PRONTA para um post de Instagram (formato vertical 4:5, 1024x1536). A peça deve integrar fotografia + título + texto de apoio num único design coeso, com a identidade visual da marca aplicada.

═══════════════════════════════════════════════════════════════
TEXTOS DA PEÇA (renderize-os EXATAMENTE como escritos, sem alterar nem traduzir):
═══════════════════════════════════════════════════════════════
TÍTULO PRINCIPAL: "${titulo}"
TEXTO DE APOIO: "${texto}"

HIERARQUIA OBRIGATÓRIA:
- Título: peso máximo (extrabold/black), tamanho dominante, primeiro a ser lido.
- Texto de apoio: peso secundário (regular/medium), tamanho menor, integrado abaixo do título.
- Sem outras palavras na peça além desses dois textos.

═══════════════════════════════════════════════════════════════
IDENTIDADE VISUAL DA MARCA (use EXATAMENTE estas cores e tipografia):
═══════════════════════════════════════════════════════════════
- Cor primária: ${primaryColor} — base de blocos, fundos sólidos ou tipografia principal conforme o mood.
- Cor de destaque (accent): ${accentColor} — usar em detalhes pontuais (faixa, ícone, palavra-chave, subline).
- Família tipográfica: ${fontFamily} (sans-serif geométrica e contemporânea).
- A tipografia deve parecer impressa de fato pelo tipo "${fontFamily}" — geometria limpa, espaçamento equilibrado.
- Texto sempre legível, com contraste suficiente sobre o fundo.

═══════════════════════════════════════════════════════════════
COMPOSIÇÃO POR MOOD (estrutura visual obrigatória):
═══════════════════════════════════════════════════════════════
${moodInstructions}
${finalModifier}

═══════════════════════════════════════════════════════════════
${RESPIRO_LOGO}

═══════════════════════════════════════════════════════════════
${TIPOLOGIA_BRASILEIRA}

═══════════════════════════════════════════════════════════════
${VESTIMENTA_TROPICAL}

═══════════════════════════════════════════════════════════════
${cenaDetalhada}

═══════════════════════════════════════════════════════════════
REGRAS DE RENDERIZAÇÃO:
═══════════════════════════════════════════════════════════════
- Fotografia realista e editorial brasileira contemporânea.
- Título e texto INTEGRADOS à peça como design — não como legenda solta sobre a foto.
- Renderize o título e o texto de apoio EXATAMENTE como escritos acima, sem inventar palavras adicionais.
- A tampa traseira de tablets e celulares é sólida e opaca — sem display visível.
- Telas, dashboards, livros e papéis em cena devem mostrar gráficos abstratos ou ficar desfocados — NUNCA texto legível inventado pelo modelo.
- Alta resolução, acabamento profissional.
- Pessoas brasileiras autênticas com fenótipo latino-americano.
- A peça final deve parecer DESIGN gráfico fotográfico — não uma foto com texto colado por cima.`;
}

// ─────────────────────────────────────────────────────────────────
// INSTRUÇÕES POR MOOD — agora descrevem a COMPOSIÇÃO completa,
// não só paleta/luz. É isto que faz o mood realmente mudar o visual.
// ─────────────────────────────────────────────────────────────────

const moodVisualInstructions: Record<MoodCode, string> = {
  'OP-01': `MOOD OP-01 CLAREZA (raiz Renascentista):
- Composição equilibrada e simétrica, hierarquia visual nítida.
- Foto ocupa o quadro inteiro; título e texto sobrepostos com fundo translúcido sutil para legibilidade.
- Título alinhado à esquerda, no terço inferior. Texto de apoio logo abaixo do título.
- Luz natural equilibrada, sem dramaticidade. Paleta fria e controlada.
- Fundo limpo, sem elementos decorativos. Sensação de organização e leitura fácil.`,

  'OP-02': `MOOD OP-02 IMPACTO (raiz Barroca):
- Fundo MUITO ESCURO, contraste extremo. Iluminação dramática focal sobre o sujeito.
- Foto ocupa o quadro inteiro com vinheta escura. Título em branco puro, peso extrabold, ocupando espaço considerável do quadro.
- Texto de apoio em peso secundário, embaixo do título.
- Composição assimétrica, tensão visual intencional. Sombras profundas como protagonistas.`,

  'OP-03': `MOOD OP-03 INSTANTE (raiz Impressionista):
- Foto de bastidor ou cena cotidiana, captura espontânea. Filtro quente e orgânico, luz ambiente natural.
- Sem simetria rígida. Texto integrado de forma orgânica — em uma faixa colorida lateral, num post-it gráfico ou num bloco assimétrico no canto.
- Cores vibrantes e quentes, textura visível. Sensação de autenticidade e bastidor.`,

  'OP-04': `MOOD OP-04 FRAGMENTO (raiz Cubista) — LAYOUT DE COLAGEM OBRIGATÓRIO:
- NÃO é foto fullbleed. É uma COLAGEM fragmentada em blocos geométricos.
- Estrutura: o quadro é dividido em zonas retangulares de cores e texturas distintas.
- Bloco grande (≈55% da altura, topo esquerdo) preenchido com a COR PRIMÁRIA da marca, contendo o TÍTULO em branco, peso extrabold.
- Faixa estreita de cor de DESTAQUE (accent) atravessando o layout, criando ritmo visual.
- Bloco grande (≈50% da altura, parte inferior/direita) com a FOTOGRAFIA do personagem em ação.
- Bloco menor com TEXTO DE APOIO em fundo neutro claro.
- Sensação geral: revista editorial cubista, fragmentos que dialogam, geometria evidente. NÃO é foto com texto sobreposto — é colagem gráfica com foto sendo um dos fragmentos.`,

  'OP-05': `MOOD OP-05 DESVIO (raiz Surrealista):
- Imagem-conceito com elemento inesperado ou metáfora visual. Composição ousada, estranhamento controlado.
- Foto ocupa o quadro com um elemento fora do lugar como ponto focal.
- Título em peso pesado, posicionado de forma a dialogar com o elemento surreal — pode ser cortado parcialmente pela cena.
- Paleta incomum ou contraste inesperado. Iluminação equilibrada — o rosto NUNCA pode ficar encoberto por sombra.`,

  'OP-06': `MOOD OP-06 SILÊNCIO (raiz Minimalista) — LAYOUT SPLIT MINIMALISTA:
- Fundo BRANCO ou quase branco ocupa a metade superior. Foto pequena e centralizada na metade inferior, com muito respiro ao redor.
- Título em cor PRIMÁRIA da marca, peso extrabold, alinhado à esquerda no topo (acima da foto), com bastante espaço negativo.
- Texto de apoio em cinza-grafite, logo abaixo do título.
- Faixa fina de cor de destaque (accent) como acento mínimo no canto superior esquerdo.
- Foco em UM único sujeito. Sensação de premium, contenção e autoridade. ESPAÇO VAZIO é elemento principal.`,
};

// Para reels, usamos uma instrução visual reduzida — frame de vídeo, sem texto.
const moodVisualInstructionsReels: Record<MoodCode, string> = {
  'OP-01': 'Cena fotográfica equilibrada e simétrica, luz natural, paleta fria controlada.',
  'OP-02': 'Cena fotográfica de alto contraste, fundo escuro, iluminação dramática focal.',
  'OP-03': 'Cena fotográfica espontânea de bastidor, luz quente ambiente, autenticidade.',
  'OP-04': 'Cena fotográfica com personagem centralizado em ação, paleta harmônica com a marca.',
  'OP-05': 'Cena fotográfica com elemento surreal pontual, iluminação equilibrada sem sombra no rosto.',
  'OP-06': 'Cena fotográfica minimalista, fundo claro, foco num único sujeito, muito respiro.',
};

// ─────────────────────────────────────────────────────────────────
// FUNÇÃO PÚBLICA — generatePostImage
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
    imagePrompt, titulo, texto, primaryColor, accentColor, fontFamily,
    mood, vertical, leituraCenica,
  } = params;

  const isReels = vertical === 'reels';
  const isFinal = vertical === 'estatico_final';

  let prompt: string;

  if (isReels) {
    // Reels: frame de vídeo, IMAGEM PURA, sem título nem texto.
    const reelsMood = moodVisualInstructionsReels[mood] || moodVisualInstructionsReels['OP-01'];
    prompt = `Crie um frame fotográfico vertical 9:16 (1024x1820) para um Reels do Instagram. IMAGEM PURA, sem qualquer texto, letra ou logotipo na cena.

ESTILO VISUAL: ${reelsMood}

${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

CENA: ${imagePrompt}
${leituraCenica?.personagem ? `Personagem: ${leituraCenica.personagem}` : ''}
${leituraCenica?.ambiente ? `Ambiente: ${leituraCenica.ambiente}` : ''}
${leituraCenica?.expressao ? `Expressão: ${leituraCenica.expressao}` : ''}
${leituraCenica?.clima ? `Clima: ${leituraCenica.clima}` : ''}

REGRAS:
- NENHUM texto, letra, palavra ou logotipo dentro da imagem.
- Telas e papéis sem texto legível.
- Pessoas brasileiras autênticas com fenótipo latino-americano.
- Alta resolução, fotografia editorial contemporânea brasileira.`;
  } else {
    const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];
    prompt = buildImagePrompt({
      imagePrompt,
      titulo,
      texto,
      primaryColor,
      accentColor,
      fontFamily,
      moodInstructions,
      leituraCenica,
      isFinal,
    });
  }

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
