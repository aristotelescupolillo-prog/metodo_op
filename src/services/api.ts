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

const APLICACAO_DE_CORES = (primaryColor: string, accentColor: string) => `
APLICAÇÃO DE CORES (regra obrigatória sobre as cores do brand kit):
- Cor primária ${primaryColor}: usada como cor de TÍTULO sobre fundo claro, OU em bloco de fundo com texto branco por cima.
- Cor de destaque ${accentColor}: reservada APENAS para 1 elemento focal por imagem (linha decorativa fina, pequeno ícone, ou bloco de respaldo de tamanho contido). NUNCA aplicada em texto de apoio. NUNCA dominando a paleta da imagem.
- Texto de apoio: tom neutro escuro (cor primária dessaturada, cinza-grafite, ou preto suave). NUNCA usar a cor de destaque no texto de apoio.
- CONTRASTE OBRIGATÓRIO entre texto e fundo:
  * Fundo escuro → texto em branco ou cor de destaque clara
  * Fundo claro → texto em cor primária escura
  * PROIBIDO texto em cor próxima do fundo (ex: cinza claro sobre creme, azul claro sobre branco)
- Resultado esperado: legibilidade imediata, sem esforço visual, mesmo a 1 metro de distância.
`.trim();

const HIERARQUIA_TIPOGRAFICA = `
HIERARQUIA TIPOGRÁFICA (regra obrigatória):
- Título principal: fonte sans-serif BOLD (peso 700-900), alta visibilidade, tamanho dominante na imagem.
- Texto de apoio: fonte sans-serif REGULAR (peso 400), NUNCA bold, NUNCA seminegrito, NUNCA itálico decorativo.
- Texto de apoio em tamanho aproximadamente 35-45% do título.
- Diferença de peso entre título e apoio deve ser EVIDENTE — leitor identifica em 1 segundo qual é título e qual é apoio.
- Espaçamento entre título e apoio: respiração visual clara entre os dois.
- PROIBIDO: título e texto de apoio com aparência tipográfica similar (mesmo peso, mesmo tamanho percebido).
`.trim();

const RESPIRO_VISUAL = `
RESPIRO E MARGENS (comportamento visual obrigatório):
- Margens internas generosas em TODOS os lados (mínimo 8% da largura da imagem como respiro lateral, idem na vertical).
- Texto NUNCA colado nas bordas — sempre com folga lateral e vertical evidente.
- Título com espaço amplo ao seu redor, jamais cortado nas extremidades.
- Personagem central com espaço visual ao redor (cabeça, ombros e tronco com folga, sem cortes nas bordas do quadro).
- Logo e assinatura no canto inferior direito com folga interna (não colado na borda do quadro).
- Sensação geral: o conteúdo "respira" dentro do quadro, nunca sufocado.
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
// CONSTRUTOR DO PROMPT VISUAL
// ─────────────────────────────────────────────────────────────────

function buildImagePrompt(params: {
  titulo: string;
  texto: string;
  imagePrompt: string;
  leituraCenica?: {
    intencao?: string;
    personagem?: string;
    ambiente?: string;
    expressao?: string;
    clima?: string;
    composicao?: string;
  };
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  moodInstructions: string;
  isFinal?: boolean;
}): string {
  const { titulo, texto, imagePrompt, leituraCenica, primaryColor, accentColor, fontFamily, moodInstructions, isFinal } = params;
  const tituloUpper = titulo.toUpperCase();
  const marcaInstruction = `Não adicione nenhum texto de assinatura ou nome de marca — a assinatura será aplicada separadamente.`;

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

  return `Crie um post profissional para Instagram. Formato vertical, proporção 4:5.

${RESPIRO_VISUAL}

${moodInstructions}
${finalModifier}
${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

${cenaDetalhada}

CONTEÚDO TEXTUAL:
- Título principal em CAIXA ALTA (bold, destaque máximo, tamanho ajustado para caber sem cortar): "${tituloUpper}"
- Texto de apoio (regular, secundário, caixa normal): "${texto}"
- ${marcaInstruction}

${HIERARQUIA_TIPOGRAFICA}

${APLICACAO_DE_CORES(primaryColor, accentColor)}

TIPOGRAFIA SUGERIDA: ${fontFamily} (ou similar sans-serif neutra).

REGRAS DE RENDERIZAÇÃO:
- Título renderizado em CAIXA ALTA exatamente como: "${tituloUpper}"
- Texto de apoio exatamente como: "${texto}", em caixa normal
- Todo texto em português, sem tradução, sem texto em inglês
- Sem elementos decorativos genéricos
- A tampa traseira de tablets e celulares é uma superfície SÓLIDA e OPACA — não tem tela, não tem display, não mostra absolutamente nada
- Gráficos, dashboards e interfaces só podem aparecer na tela frontal, nunca na tampa
- O canto inferior direito deve ficar SEMPRE limpo e livre de texto (espaço reservado para assinatura aplicada depois)
- Alta resolução, estética editorial contemporânea brasileira`;
}

// ─────────────────────────────────────────────────────────────────
// INSTRUÇÕES POR MOOD — composição/paleta/tipografia (não tocam em etnia/vestuário/ambiente)
// ─────────────────────────────────────────────────────────────────

const moodVisualInstructions: Record<MoodCode, string> = {
'OP-01': `ESTILO VISUAL — OP-01 CLAREZA (raiz: Renascentista):
- Grid organizado em 3 zonas horizontais bem definidas
- Assinatura da marca pequena e discreta no topo
- Título em 2 linhas máximo, hierarquia tipográfica clara, alinhado à ESQUERDA
- Texto de apoio curto abaixo do título, alinhado à esquerda
- Luz natural equilibrada, composição simétrica
- Fundo limpo, sem elementos decorativos desnecessários
- Paleta fria e controlada, cor de destaque apenas no elemento-chave`,

  'OP-02': `ESTILO VISUAL — OP-02 IMPACTO (raiz: Barroco):
- Fundo muito escuro, contraste extremo
- Imagem com iluminação dramática, luz focal sobre o elemento principal
- Texto em cor quente de destaque (amarelo ou laranja)
- Título CENTRALIZADO, bold, dominando o terço superior
- Assinatura da marca pequena e direta no rodapé
- Composição assimétrica com tensão visual intencional
- Sombras profundas, luz e sombra como protagonistas`,

  'OP-03': `ESTILO VISUAL — OP-03 INSTANTE (raiz: Impressionista):
- Foto de bastidor ou cena cotidiana capturada ao vivo
- Filtro quente e orgânico, luz ambiente natural sem estúdio
- Título sobreposto à imagem em posição LIVRE e informal, sem alinhamento rígido
- Sem simetria rígida, sem moldura formal
- Sensação de captura espontânea, autêntica
- Cores vibrantes e quentes, textura visível`,

  'OP-04': `ESTILO VISUAL — OP-04 FRAGMENTO (raiz: Cubista):
- Post-colagem com 3 a 5 blocos visuais distintos
- Cada bloco carrega uma informação ou ângulo diferente
- Título ancorado num bloco de cor, alinhado à ESQUERDA — NUNCA centralizado solto, NUNCA no canto inferior direito
- Texto de apoio posicionado no centro ou terço superior, longe do canto inferior direito
- Grid visível ou implícito organizando os fragmentos
- Paleta controlada unificando os blocos
- O canto inferior direito deve permanecer SEMPRE limpo e livre de texto, reservado para assinatura`,

  'OP-05': `ESTILO VISUAL — OP-05 DESVIO (raiz: Surrealista):
- Imagem-conceito com elemento inesperado ou metáfora visual
- Composição ousada que provoca estranhamento controlado
- Título DESLOCADO e assimétrico — fora do centro, quebrando o equilíbrio esperado
- Elemento fora do lugar como ponto focal
- Paleta incomum ou contraste inesperado
- Sombras presentes mas LEVES — o rosto e a cabeça das pessoas NUNCA podem ficar encobertos por escurecimento
- Iluminação equilibrada: o elemento surreal não pode obscurecer o sujeito principal`,

  'OP-06': `ESTILO VISUAL — OP-06 SILÊNCIO (raiz: Minimalista):
- Fundo quase branco ou muito claro, espaço vazio como elemento principal
- Título CENTRALIZADO, fonte tipográfica como protagonista, com muito respiro ao redor
- Detalhe mínimo de cor como assinatura
- Composição com muito respiro, elementos reduzidos ao essencial
- Sensação de premium, contenção e autoridade`,
};

// ─────────────────────────────────────────────────────────────────
// FUNÇÃO PÚBLICA — gera 1 imagem chamando o backend
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
  const { imagePrompt, titulo, texto, primaryColor, accentColor, fontFamily, mood, vertical, leituraCenica } = params;

  const isReels = vertical === 'reels';
  const isFinal = vertical === 'estatico_final';
  const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];

  const prompt = isReels
    ? `${moodInstructions}

${TIPOLOGIA_BRASILEIRA}

${VESTIMENTA_TROPICAL}

CENA: ${imagePrompt}. Imagem pura sem texto, sem assinatura, sem logo, composição vertical cinematográfica 9:16, alta qualidade.`
    : buildImagePrompt({
        titulo,
        texto,
        imagePrompt,
        leituraCenica,
        primaryColor,
        accentColor,
        fontFamily,
        moodInstructions,
        isFinal,
      });

  // Tamanho enviado ao backend: reels = vertical 9:16, demais = 4:5
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

  // O backend já retorna em base64 (data URL), pronto pra usar — não precisa de proxy
  return data.imageDataUrl;
}
