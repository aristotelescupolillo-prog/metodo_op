import { ContentFormData, MethodOpResult, OutputFormat } from '../types';

interface MomentModulator {
  label: string;
  entryModifier: string;
  securityAngle: string;
  storyEntryModifier: string;
  contextNote: string;
}

const momentModulators: Record<string, MomentModulator> = {
  'lançamento': {
    label: 'Lançamento',
    entryModifier: 'modulada por DESCOBERTA e NOVIDADE — o 1º conteúdo apresenta o que ainda não é percebido pelo público, despertando curiosidade legítima sobre algo novo.',
    securityAngle: 'ancorada na previsibilidade e clareza da adoção do que está sendo introduzido (reduzir incerteza diante do novo)',
    storyEntryModifier: 'modulada por descoberta e novidade — abrir o dia revelando algo que o público ainda não percebeu sobre o tema.',
    contextNote: 'Lançamento (empresa nova ou novo produto/serviço — ativação via descoberta)',
  },
  'consolidação': {
    label: 'Consolidação',
    entryModifier: 'ativação padrão da entrada do segmento, sem modulação adicional — reforçar autoridade e prova sobre o que já é percebido.',
    securityAngle: 'ancorada em estabilidade comprovada e previsibilidade operacional consolidada',
    storyEntryModifier: 'ativação padrão da entrada do segmento, aplicada ao contexto do negócio.',
    contextNote: 'Consolidação (operação estável buscando crescer — ativação padrão do segmento)',
  },
  'reativação': {
    label: 'Reativação',
    entryModifier: 'modulada por RECONEXÃO e RELEVÂNCIA RENOVADA — reabre uma conversa que ficou em aberto, recuperando a atenção de quem já conhece mas se afastou.',
    securityAngle: 'ancorada em reduzir o risco percebido de retomar (mostrar que o caminho de volta é seguro e previsível)',
    storyEntryModifier: 'modulada por reconexão — abrir o dia reativando uma percepção que pode ter esfriado no público.',
    contextNote: 'Reativação (cliente parado, retomada após pausa — ativação via reconexão)',
  },
  'sazonalidade': {
    label: 'Sazonalidade',
    entryModifier: 'modulada pelo CONTEXTO TEMPORAL VIGENTE — ancora a entrada no momento atual (data, temporada, ciclo), conectando a oferta ao agora.',
    securityAngle: 'ancorada na previsibilidade de aproveitar o momento certo, sem improviso',
    storyEntryModifier: 'modulada pelo contexto temporal — abrir o dia ancorando o tema no momento sazonal vigente.',
    contextNote: 'Sazonalidade (data comemorativa ou alta/baixa temporada — ativação ancorada no agora)',
  },
};

const segmentConfigB2C = {
  'SERVIÇOS': { entrada: 'clareza e organização mental', bloqueio: 'confusão e desconfiança' },
  'VAREJO': { entrada: 'identificação e movimento', bloqueio: 'indecisão e inércia' },
  'MARCA': { entrada: 'reconhecimento e vínculo', bloqueio: 'desconexão e falta de familiaridade' },
} as const;

const segmentConfigB2B = {
  'SERVIÇOS': { entrada: 'eficiência e previsibilidade operacional', bloqueio: 'risco de mudança e falta de referências' },
  'VAREJO': { entrada: 'margem e giro de estoque', bloqueio: 'custo de troca e incerteza de demanda' },
  'MARCA': { entrada: 'posicionamento e diferenciação no mercado', bloqueio: 'comoditização e falta de percepção de valor' },
} as const;

function buildPostProgression(qty: number, entrada: string, isB2BOperational: boolean, moment: MomentModulator): string {
  const ativacao = isB2BOperational
    ? `Ativação da ENTRADA (${entrada}) via gatilho de SEGURANÇA ${moment.securityAngle}: enfatizar estabilidade, proteção, previsibilidade operacional, redução de incerteza e controle de processo. Modulação do momento "${moment.label}": ${moment.entryModifier}`
    : `Ativação da ENTRADA: ${entrada}, aplicada ao contexto real do negócio. Modulação do momento "${moment.label}": ${moment.entryModifier}`;

  const segurancaNote = isB2BOperational
    ? ' → Como o início já ativou Segurança, esta etapa deve aprofundar com provas concretas. NÃO repetir estabilidade/proteção.'
    : '';

  if (qty === 3) return `- Post 1: ${ativacao}\n- Post 2: Confiança e segurança${segurancaNote}\n- Post 3: Autoridade e ação`;
  if (qty === 6) return `- Post 1: ${ativacao}\n- Post 2: Clareza aplicada\n- Post 3: Confiança\n- Post 4: Segurança${segurancaNote}\n- Post 5: Autoridade\n- Post 6: Agir`;
  return `- Post 1: ${ativacao}\n- Post 2: Ampliação do problema\n- Post 3: Clareza estruturada\n- Post 4: Confiança\n- Post 5: Segurança${segurancaNote}\n- Post 6: Prova prática\n- Post 7: Autoridade\n- Post 8: Consolidação da decisão\n- Post 9: Agir`;
}

function has(format: OutputFormat[], name: OutputFormat) {
  return format.includes(name);
}

export function buildMetodoOpPrompt(data: ContentFormData): string {
  const isB2B = data.audience === 'B2B';
  const segConfig = isB2B ? segmentConfigB2B : segmentConfigB2C;
  const seg = segConfig[data.segment];
  const moment = momentModulators[data.businessMoment] || momentModulators['consolidação'];
  const isB2BOperational = isB2B && (data.segment === 'SERVIÇOS' || data.segment === 'VAREJO');
  const wantsFeed = has(data.outputFormats, 'feed');
  const wantsCarousel = has(data.outputFormats, 'carrossel');
  const wantsReels = has(data.outputFormats, 'reels');
  const wantsStories = has(data.outputFormats, 'stories');

  const progressionText = isB2B
    ? 'CLAREZA → CONFIANÇA → SEGURANÇA → AUTORIDADE → AGIR'
    : 'CLAREZA → SEGURANÇA → CONFIANÇA → AUTORIDADE → AGIR';

  const audienceDirection = isB2B
    ? 'Conteúdo SEMPRE para o decisor empresarial (gestor, diretor ou responsável pela área), NUNCA para o consumidor final.'
    : 'Conteúdo SEMPRE para o consumidor final (cliente do cliente), NUNCA para o empresário.';

  const vendaRule = isB2B
    ? `- Venda só pode aparecer no último conteúdo da sequência.\n- O último conteúdo DEVE conter convite claro para reunião, diagnóstico ou proposta personalizada.\n- Proibido CTA agressivo, pressão ou urgência artificial.`
    : `- Venda só pode aparecer no último conteúdo da sequência.\n- A abordagem deve ser consultiva, natural e coerente.\n- Proibido CTA agressivo, pressão ou urgência artificial.`;

  const prohibitedWords = isB2B
    ? '"risco", "comoditização", "incerteza", "custo de troca", "falta de referências", "eficiência", "previsibilidade", "margem", "giro", "posicionamento", "diferenciação", "bloqueio", "entrada", "progressão"'
    : '"confuso", "confusa", "confusão", "desconfiança", "indecisão", "inércia", "desconexão", "bloqueio", "entrada", "progressão"';

  const feedRules = wantsFeed ? `
FEED ESTÁTICO (${data.feedQuantity} posts):
- Gerar exatamente ${data.feedQuantity} posts estáticos.
- Cada estático: título com NO MÁXIMO 7 palavras; texto com NO MÁXIMO 15 palavras; legenda com NO MÁXIMO 20 palavras.
- Variar títulos entre afirmação, pergunta, contraste e observação cotidiana.
- Não usar pergunta em mais da metade dos títulos.
- Cada post responde uma pergunta diferente; proibido repetir argumento.
- Retornar em "feed": [{ "dia", "formato":"Estático", "titulo", "texto", "legenda", "imagem" }].

ATIVAÇÃO INICIAL E PROGRESSÃO DO FEED (${data.feedQuantity} posts):
${buildPostProgression(data.feedQuantity, seg.entrada, isB2BOperational, moment)}
` : '';

  const carouselRules = wantsCarousel ? `
CARROSSEL (PADRÃO FIXO DO MÉTODO OP: 5 CARDS):
- Gerar exatamente 5 cards, sempre 5, sem exceção.
- Card 1: abertura / tensão / atenção.
- Card 2: desenvolvimento.
- Card 3: aprofundamento.
- Card 4: direção / argumento.
- Card 5: ação / fechamento.
- Cada card deve ter: titulo com até 6 palavras; texto com até 12 palavras; imagePrompt próprio.
- A sequência deve seguir internamente ${progressionText}; nunca explicar a metodologia.
- Retornar em "carousel": [{ "card":1, "titulo", "texto", "imagePrompt" }, ... até 5].
` : '';

  const reelsRules = wantsReels ? `
REELS (GUIA DE PRODUÇÃO, NÃO VÍDEO FINAL):
- Gerar um guia de Reels de até 15 segundos.
- A imagem do Reels é PURA: sem texto, sem logo, sem lettering, sem overlay, sem marca.
- O texto de tela deve ser entregue separado em "screenText", frase curta com até 7 palavras.
- Roteiro falado com 20 a 35 palavras.
- Retornar em "reels": { "hook", "screenText", "script", "imagePrompt" }.
` : '';

  const storiesRules = wantsStories ? `
STORIES (CONTEÚDO TEXTUAL, SEM IMAGEM):
- Gerar exatamente ${data.storiesDays} sequência(s), uma por dia.
- Cada sequência deve ter ${data.storiesQuantity} stories.
- Stories não geram imagem no MÉTODO OP V1.
- Vídeo: tom de conversa, 20-30 palavras, uma ideia por story.
- Post textual: frase curta, até 8 palavras.
- A primeira story de cada dia deve ativar a entrada psicológica do segmento (${seg.entrada}).
- Retornar em "stories": [{ "dia", "sequencia", "stories": [{ "ordem", "tipo":"vídeo"|"post", "texto" }] }].
` : '';

  const coordinationRules = (wantsFeed || wantsCarousel || wantsReels) && wantsStories ? `
COORDENAÇÃO PEÇAS VISUAIS ↔ STORIES:
- Feed/Carrossel/Reels plantam a intenção; Stories aprofundam, criam curiosidade ou conduzem micro-ação.
- Proibido Story ser resumo ou reescrita direta de uma peça visual.
- Proibido repetir título, frase de abertura ou exemplo.
` : '';

  return `Você é o motor estratégico do MÉTODO OP. Retorne SOMENTE JSON válido, sem markdown, sem comentários.

CONTEXTO:
- Empresa: ${data.companyName}
- Segmento: ${data.segment}
- Público-alvo: ${isB2B ? 'B2B (empresas e decisores empresariais)' : 'B2C (consumidor final)'}
- Atividade principal: ${data.mainActivity}
- Momento do negócio: ${moment.contextNote}
${data.instagramUrl ? `- Instagram: ${data.instagramUrl} (usar só para ajuste de vocabulário, nunca para definir a estratégia)` : ''}
${data.keyInfo ? `- Informação-chave: ${data.keyInfo}` : ''}

ANÁLISE INTERNA — NÃO EXIBIR NO TEXTO FINAL:
1. Ponto de entrada do público: ${seg.entrada}
2. Bloqueio inicial típico: ${seg.bloqueio}
3. Progressão interna obrigatória: ${progressionText}
4. Modulação do momento: ${moment.entryModifier}
5. Palavras proibidas no conteúdo final, inclusive variações: ${prohibitedWords}
6. Proibido usar termos da metodologia: pensar, fazer, agir, destravamento, bloco inicial, bloco intermediário, bloco final, progressão, entrada, matriz.

DIREÇÃO DE LINGUAGEM:
- ${audienceDirection}
- Voz da marca: ${data.brandVoice || 'padrão do segmento'}.
- A voz governa ritmo, vocabulário e registro emocional.
- Humor, irreverência e provocação servem à clareza, nunca substituem a clareza.
- Técnica, sofisticação e consultoria devem manter precisão sem burocracia.
- Proibido mencionar literalmente a voz no texto final.

REGRA DE VENDA:
${vendaRule}

${feedRules}
${carouselRules}
${reelsRules}
${storiesRules}
${coordinationRules}

DIRETRIZES VISUAIS PARA CAMPOS DE IMAGEM:
- A cena deve traduzir literalmente o título e o texto, nunca decorar genericamente o tema.
- Pessoas em cena são regra quando houver cliente, profissional, decisor, problema vivido ou ação humana.
- Proibido: distorções anatômicas, texto dentro da imagem, logomarca inventada, interfaces irreais, gráficos flutuantes, lâmpadas, engrenagens e handshake genérico.
- Estático e Carrossel: composição vertical 1080x1350.
- Reels: composição vertical 1080x1920, imagem pura sem texto e sem logo.
- Sufixo técnico padrão: fotografia realista, estética editorial contemporânea, aparência fotográfica profissional, luz natural, composição limpa, sem distorções de IA.

INEDITISMO CONTROLADO:
- Não repetir estruturas de abertura.
- Alternar pergunta, afirmação, contraste, exemplo cotidiano e micro narrativa.
- Priorizar linguagem concreta, cotidiana e específica da atividade.
- Evitar clichês: descubra, saiba mais, transforme, segredo, incrível.

FORMATO DE SAÍDA:
Retorne exatamente as chaves necessárias conforme os formatos solicitados: ${data.outputFormats.join(', ')}.
`;
}

export function normalizeMethodResult(raw: any): MethodOpResult {
  return {
    feed: Array.isArray(raw?.feed) ? raw.feed : undefined,
    carousel: Array.isArray(raw?.carousel) ? raw.carousel.slice(0, 5) : undefined,
    reels: raw?.reels,
    stories: Array.isArray(raw?.stories) ? raw.stories : undefined,
    raw,
  };
}
