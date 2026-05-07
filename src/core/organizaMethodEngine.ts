import { ContentFormData, MethodOpResult, FeedItem, GenerationSummary, Track } from '../types';

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
  'VAREJO':   { entrada: 'identificação e movimento',   bloqueio: 'indecisão e inércia' },
  'MARCA':    { entrada: 'reconhecimento e vínculo',    bloqueio: 'desconexão e falta de familiaridade' },
} as const;

const segmentConfigB2B = {
  'SERVIÇOS': { entrada: 'eficiência e previsibilidade operacional', bloqueio: 'risco de mudança e falta de referências' },
  'VAREJO':   { entrada: 'margem e giro de estoque',                 bloqueio: 'custo de troca e incerteza de demanda' },
  'MARCA':    { entrada: 'posicionamento e diferenciação no mercado', bloqueio: 'comoditização e falta de percepção de valor' },
} as const;

// Composição interna por tamanho. NA TRILHA VISUAL, a contagem de "reels"
// vira contagem de "estaticos_finais" — mesma posição narrativa, formato diferente.
const SEQUENCE_COMPOSITION = {
  3: { estatico: 1, carrossel: 1, fechamento: 1 },
  6: { estatico: 2, carrossel: 2, fechamento: 2 },
  9: { estatico: 3, carrossel: 3, fechamento: 3 },
};

function buildPostProgression(qty: number, entrada: string, isB2BOperational: boolean, moment: MomentModulator): string {
  const ativacao = isB2BOperational
    ? `Ativação da ENTRADA (${entrada}) via gatilho de SEGURANÇA ${moment.securityAngle}: enfatizar estabilidade, proteção, previsibilidade operacional, redução de incerteza e controle de processo. Modulação do momento "${moment.label}": ${moment.entryModifier}`
    : `Ativação da ENTRADA: ${entrada}, aplicada ao contexto real do negócio. Modulação do momento "${moment.label}": ${moment.entryModifier}`;

  const segurancaNote = isB2BOperational
    ? ' → Como o início já ativou Segurança, esta etapa deve aprofundar com provas concretas. NÃO repetir estabilidade/proteção.'
    : '';

  if (qty === 1) return `- Post 1: ${ativacao}`;
  if (qty === 2) return `- Post 1: ${ativacao}\n- Post 2: Confiança e autoridade`;
  if (qty === 3) return `- Post 1: ${ativacao}\n- Post 2: Confiança e segurança${segurancaNote}\n- Post 3: Autoridade e ação`;
  return `- Post 1: ${ativacao}\n- Post 2: Clareza aplicada\n- Post 3: Confiança\n- Post 4: Segurança${segurancaNote}\n- Post 5: Autoridade\n- Post 6: Agir`;
}

export function buildMetodoOpPrompt(data: ContentFormData): string {
  const isB2B = data.audience === 'B2B';
  const segConfig = isB2B ? segmentConfigB2B : segmentConfigB2C;
  const seg = segConfig[data.segment];
  const moment = momentModulators[data.businessMoment] || momentModulators['consolidação'];
  const isB2BOperational = isB2B && (data.segment === 'SERVIÇOS' || data.segment === 'VAREJO');
  const wantsStories = data.outputMode === 'stories' || data.outputMode === 'feed+stories';
  const hasFeed = data.outputMode === 'feed' || data.outputMode === 'feed+stories';

  // Trilha narrativa — define o que entra no fechamento da sequência.
  // Default: cinematica (comportamento idêntico ao da Fase 1).
  const track: Track = data.track || 'cinematica';
  const isVisual = track === 'visual';
  const isExperimentacao = track === 'experimentacao';

  // Experimentação força tamanho 3 (1 estático + 1 carrossel + 1 estatico_final por período).
  // Na Fase 2 Experimentação está bloqueada na UI; a infraestrutura fica pronta para Fase 3.
  const requestedSize = (data.sequenceSize || 6) as 3 | 6 | 9;
  const size: 3 | 6 | 9 = isExperimentacao ? 3 : requestedSize;
  const comp = SEQUENCE_COMPOSITION[size];

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

  // ── Bloco de fechamento ──
  // Cinemática: REELS (movimento, retenção, expansão emocional)
  // Visual: ESTÁTICO FINAL (resolução, fechamento, imagem fixa de consolidação)
  const closingBlockTitle = isVisual ? 'ESTÁTICO FINAL' : 'REELS';

  const closingPiecesLabel = isVisual
    ? `${comp.fechamento} peça${comp.fechamento > 1 ? 's' : ''} de fechamento`
    : `${comp.fechamento} reels`;

  // Composição declarada no topo do bloco — a IA precisa saber quantas peças totais.
  const composicaoLine = isVisual
    ? `${size} peças no total: ${comp.estatico} estático${comp.estatico > 1 ? 's' : ''} + ${comp.carrossel} carrossel${comp.carrossel > 1 ? 'is' : ''} + ${comp.fechamento} estático${comp.fechamento > 1 ? 's' : ''} final${comp.fechamento > 1 ? 'is' : ''}`
    : `${size} peças no total: ${comp.estatico} estático${comp.estatico > 1 ? 's' : ''} + ${comp.carrossel} carrossel${comp.carrossel > 1 ? 'is' : ''} + ${comp.fechamento} reels`;

  const reelsBlock = `
REELS (${comp.fechamento} guia${comp.fechamento > 1 ? 's' : ''} de produção):
- Cada Reels: até 15 segundos, imagem PURA (sem texto, sem logo).
- Texto de tela em "screenText", frase curta até 7 palavras.
- Roteiro falado de NO MÁXIMO 25 palavras, curtas e de fácil dicção, sem palavras difíceis ou compostas.
- Retornar em "reels": [{ "sequencia": 1, "hook", "screenText", "script", "imagePrompt", "legenda": "até 20 palavras para uso na legenda do post" }]
${comp.fechamento > 1 ? `- Gerar ${comp.fechamento} reels com abordagens visuais distintas.` : ''}`;

  const estaticoFinalBlock = `
ESTÁTICO FINAL (${comp.fechamento} peça${comp.fechamento > 1 ? 's' : ''} de fechamento narrativo):
- O Estático Final NÃO é um estático comum nem um reel congelado.
- É um formato HÍBRIDO de fechamento visual com função psicológica própria: consolidação, resolução visual, fechamento emocional, organização da decisão.
- Função na sequência: encerrar o ciclo narrativo aberto pelo estático e desenvolvido pelo carrossel.
- Cada Estático Final: título com NO MÁXIMO 7 palavras; texto com NO MÁXIMO 15 palavras; legenda com NO MÁXIMO 20 palavras.
- O TÍTULO do Estático Final deve carregar resolução, não provocação. Frase de conclusão, não de abertura.
- O TEXTO deve consolidar a direção da sequência em uma afirmação clara e estável.
- A IMAGEM deve traduzir literalmente o título e o texto, com cena de calma, foco e estabilidade — não tensão, não movimento.
- Retornar dentro do array "feed" com formato exato "Estático Final" (com acento e espaço, exatamente assim).
- Estrutura de cada item: { "dia", "formato": "Estático Final", "titulo", "texto", "legenda", "imagem", "leituraCenica": { "intencao": "sensação de fechamento que esta peça consolida", "personagem": "quem aparece na cena, em postura de calma e direção definida", "ambiente": "ambiente estável, com poucos elementos competindo pela atenção", "expressao": "expressão serena, decidida, sem dramaticidade", "clima": "luz suave, atmosfera de resolução, hora estável do dia", "composicao": "composição centralizada ou em equilíbrio claro, com espaço negativo amplo, sem ruído gráfico" } }
${comp.fechamento > 1 ? `- Gerar ${comp.fechamento} Estáticos Finais com abordagens narrativas distintas, cada um fechando uma camada diferente da sequência.` : ''}`;

  const closingBlock = isVisual ? estaticoFinalBlock : reelsBlock;

  const feedRules = hasFeed ? `
SEQUÊNCIA DO FEED (${composicaoLine}):

A SEQUÊNCIA COMPLETA segue a progressão: ${progressionText}
Os formatos são distribuídos pelo método — NÃO pelo usuário.

ESTÁTICOS (${comp.estatico} peça${comp.estatico > 1 ? 's' : ''}):
- Cada estático: título com NO MÁXIMO 7 palavras; texto com NO MÁXIMO 15 palavras; legenda com NO MÁXIMO 20 palavras.
- Variar títulos entre afirmação, pergunta, contraste e observação cotidiana.
- Progressão dos estáticos: ${buildPostProgression(comp.estatico, seg.entrada, isB2BOperational, moment)}
- Retornar em "feed": [{ "dia", "formato":"Estático", "titulo", "texto", "legenda", "imagem", "leituraCenica": { "intencao": "o que este post ativa emocionalmente", "personagem": "quem aparece na cena e o que faz", "ambiente": "onde a cena acontece com detalhes físicos", "expressao": "expressão facial e corporal do personagem", "clima": "luz, hora do dia, atmosfera", "composicao": "como os elementos se organizam no quadro" } }]

CARROSSEL (${comp.carrossel} sequência${comp.carrossel > 1 ? 's' : ''} de 5 cards cada):
- Cada carrossel tem exatamente 5 cards: abertura → desenvolvimento → aprofundamento → direção → ação.
- Cada card: titulo até 6 palavras; texto até 12 palavras; imagePrompt próprio.
- Retornar em "carousel": [{ "sequencia": 1, "legenda": "até 20 palavras para uso na legenda do post", "cards": [{ "card":1, "titulo", "texto", "imagePrompt", "leituraCenica": { "intencao": "o que este card ativa", "personagem": "quem aparece e o que faz", "ambiente": "onde acontece com detalhes físicos", "expressao": "expressão do personagem", "clima": "luz e atmosfera", "composicao": "organização dos elementos no quadro" } }, ...] }]
${comp.carrossel > 1 ? `- Gerar ${comp.carrossel} sequências de carrossel com temas complementares, não repetidos.` : ''}
${closingBlock}
` : '';

  const storiesRules = wantsStories ? `
STORIES (CONTEÚDO TEXTUAL, SEM IMAGEM):
- Gerar exatamente ${data.storiesDays} sequência(s), uma por dia.
- Cada sequência deve ter ${data.storiesQuantity} stories.
- Stories não geram imagem no MÉTODO OP V1.
- Vídeo: tom de conversa, 20-30 palavras, uma ideia por story.
- Post textual: frase curta, até 8 palavras.
- A primeira story de cada dia deve ativar a entrada psicológica do segmento (${seg.entrada}).
- Retornar em "stories": [{ "dia", "sequencia", "stories": [{ "ordem", "tipo":"vídeo"|"post", "texto" }] }]
` : '';

  const coordinationRules = hasFeed && wantsStories ? `
MATRIZ DE INTENÇÃO — COORDENAÇÃO FEED ↔ STORIES:
Esta seção só roda porque Feed e Stories foram solicitados juntos.

CONCEITO CENTRAL — INTENÇÃO DO DIA:
Para cada dia N em que existe Feed[dia=N] E Stories[dia=N]:
- Defina internamente UMA única "Intenção do Dia" expressa como VERBO + FOCO.
  Exemplos válidos: "abrir percepção sobre previsibilidade", "romper inércia em organização da rotina".
- Essa intenção é INTERNA ao raciocínio do modelo.
- NUNCA aparece no texto final. NUNCA aparece no JSON de saída.
- Ela é o eixo invisível que amarra Post e Stories daquele dia.

PAPÉIS FIXOS — IMUTÁVEIS:
- Feed (Post do dia N): PLANTA a intenção — apresenta, provoca ou estrutura o tema.
- Stories (do dia N): EXECUTAM a intenção plantada pelo post.
- O Feed NUNCA executa. Os Stories NUNCA plantam. Isso é absoluto.

MODOS DE EXECUÇÃO DOS STORIES:
Os Stories do dia N executam a intenção em EXATAMENTE UM destes três modos,
escolhido conforme o estágio do dia dentro da progressão estratégica geral:
1. APROFUNDAMENTO — detalhar uma camada que o post deixou em superfície. (dias de início do ciclo)
2. CURIOSIDADE — abrir um ângulo que o post não revelou, sem clickbait. (dias de meio do ciclo)
3. CONVERSÃO — traduzir o interesse plantado pelo post em micro-ação concreta, sem CTA agressivo. (dias de fim do ciclo)

QUANDO OS DIAS NÃO BATEM:
- A coordenação só se aplica aos dias com sobreposição (Feed[dia=N] + Stories[dia=N] existem juntos).
- Dias de Stories sem post correspondente: seguem progressão de stories independente.
- Dias de Feed sem story correspondente: seguem progressão de feed independente.

PROIBIÇÕES DURAS — VIOLAÇÃO DESTRÓI A ESTRATÉGIA:
1. PROIBIDO o Story ser reescrita, paráfrase ou resumo do Post do mesmo dia.
2. PROIBIDO usar o mesmo título, mesma frase de abertura ou mesmo exemplo do post correspondente.
Essas proibições forçam o Story a entrar por outro ângulo, mesmo tratando do mesmo tema.

RESUMO OPERACIONAL:
Para cada dia com Feed + Stories: defina internamente a intenção (verbo + foco) → Feed planta → Stories executam por APROFUNDAMENTO, CURIOSIDADE ou CONVERSÃO — nunca por repetição.
` : '';

  // Chaves esperadas no JSON de saída — mudam conforme a trilha.
  const outputKeys = (() => {
    const parts: string[] = [];
    if (hasFeed) {
      parts.push('"feed"', '"carousel"');
      if (!isVisual) parts.push('"reels"');
    }
    if (wantsStories) parts.push('"stories"');
    return parts.join(', ');
  })();

  const trackContextNote = isVisual
    ? `Trilha narrativa: VISUAL (sequência em imagem fixa, fechamento em Estático Final, sem reels)`
    : isExperimentacao
      ? `Trilha narrativa: EXPERIMENTAÇÃO (entrada de validação, sequência reduzida em imagem fixa)`
      : `Trilha narrativa: CINEMÁTICA (sequência com movimento, fechamento em Reels)`;

  return `Você é o motor estratégico do MÉTODO OP. Retorne SOMENTE JSON válido, sem markdown, sem comentários.

CONTEXTO:
- Empresa: ${data.companyName}
- Segmento: ${data.segment}
- Público-alvo: ${isB2B ? 'B2B (empresas e decisores empresariais)' : 'B2C (consumidor final)'}
- Atividade principal: ${(data as any).mainActivity}
- Momento do negócio: ${moment.contextNote}
- ${trackContextNote}
${(data as any).instagramUrl ? `- Instagram: ${(data as any).instagramUrl} (usar só para ajuste de vocabulário, nunca para definir a estratégia)` : ''}
${data.keyInfo ? `- Informação-chave: ${data.keyInfo}` : ''}

ANÁLISE INTERNA — NÃO EXIBIR NO TEXTO FINAL:
1. Ponto de entrada do público: ${seg.entrada}
2. Bloqueio inicial típico: ${seg.bloqueio}
3. Progressão interna obrigatória: ${progressionText}
4. Modulação do momento: ${moment.entryModifier}
5. Palavras proibidas no conteúdo final: ${prohibitedWords}
6. Proibido usar termos da metodologia: pensar, fazer, agir, destravamento, bloco inicial, bloco intermediário, bloco final, progressão, entrada, matriz.

DIREÇÃO DE LINGUAGEM:
- ${audienceDirection}
- Voz da marca: ${data.brandVoice || 'padrão do segmento'}.
- A voz governa ritmo, vocabulário e registro emocional.
- Proibido mencionar literalmente a voz no texto final.

REGRA DE VENDA:
${vendaRule}

${feedRules}
${storiesRules}
${coordinationRules}

DIRETRIZES VISUAIS PARA CAMPOS DE IMAGEM:
- A cena deve traduzir literalmente o título e o texto, nunca decorar genericamente o tema.
- Pessoas em cena são regra quando houver cliente, profissional, decisor, problema vivido ou ação humana.
- Proibido: distorções anatômicas, texto dentro da imagem, logomarca inventada, interfaces irreais, gráficos flutuantes, lâmpadas, engrenagens e handshake genérico.
- Estático e Carrossel: composição vertical 1080x1350.
- Estático Final: composição vertical 1080x1350, com mais respiro, menos ruído e foco centralizado.
${!isVisual ? '- Reels: composição vertical 1080x1920, imagem pura sem texto e sem logo.' : ''}
- Sufixo técnico: fotografia realista, estética editorial contemporânea, luz natural, composição limpa.

INEDITISM O CONTROLADO:
- Não repetir estruturas de abertura.
- Alternar pergunta, afirmação, contraste, exemplo cotidiano e micro narrativa.
- Priorizar linguagem concreta, cotidiana e específica da atividade.
- Evitar clichês: descubra, saiba mais, transforme, segredo, incrível.

FORMATO DE SAÍDA:
Retorne as chaves: ${outputKeys}.
${isVisual ? 'IMPORTANTE: NÃO retornar a chave "reels". Os Estáticos Finais entram dentro do array "feed" com formato="Estático Final".' : ''}
`;
}

// Calcula o resumo de itens gerados — útil para integração futura com o ERP
// (debitar consumo de plano contratado por cliente).
function buildSummary(result: Pick<MethodOpResult, 'feed' | 'carousel' | 'reels' | 'stories'>): GenerationSummary {
  const feed = result.feed || [];
  const estaticos = feed.filter(f => f.formato === 'Estático').length;
  const estaticosFinais = feed.filter(f => f.formato === 'Estático Final').length;

  // Carrossel é contado em sequências (de 5 cards cada), não em cards soltos
  const carouselCards = result.carousel?.length || 0;
  const carrosseis = Math.ceil(carouselCards / 5);

  const reels = result.reels ? 1 : 0;
  const stories = result.stories?.length || 0;

  return { estaticos, carrosseis, reels, estaticosFinais, stories };
}

export function normalizeMethodResult(raw: any): MethodOpResult {
  let carousel: import('../types').CarouselCard[] | undefined;
  if (Array.isArray(raw?.carousel)) {
    if (raw.carousel[0]?.cards) {
      carousel = raw.carousel.flatMap((seq: any) => {
        const cards = (seq.cards || []).map((c: any, i: number) => ({ ...c, card: i + 1 }));
        if (cards.length > 0 && seq.legenda) {
          cards[cards.length - 1].legenda = seq.legenda;
        }
        return cards;
      });
    } else {
      carousel = raw.carousel.slice(0, 5);
    }
  }

  let reels: import('../types').ReelsGuide | undefined;
  if (Array.isArray(raw?.reels)) {
    reels = raw.reels[0];
  } else if (raw?.reels) {
    reels = raw.reels;
  }

  // Aceita peças com formato "Estático Final" vindas no feed[].
  // Também aceita uma chave alternativa "estaticoFinal" caso a IA retorne separado —
  // nesse caso, mescla no feed[] preservando a ordem.
  let feed: FeedItem[] | undefined = Array.isArray(raw?.feed) ? raw.feed : undefined;
  if (Array.isArray(raw?.estaticoFinal) && raw.estaticoFinal.length > 0) {
    const extras: FeedItem[] = raw.estaticoFinal.map((item: any, idx: number) => ({
      dia: item.dia ?? ((feed?.length || 0) + idx + 1),
      formato: 'Estático Final' as const,
      titulo: item.titulo || '',
      texto: item.texto || '',
      legenda: item.legenda || '',
      imagem: item.imagem || item.imagePrompt || '',
      ...(item.leituraCenica ? { leituraCenica: item.leituraCenica } : {}),
    }));
    feed = [...(feed || []), ...extras];
  }

  const partial = { feed, carousel, reels, stories: Array.isArray(raw?.stories) ? raw.stories : undefined };
  const summary = buildSummary(partial);

  return {
    ...partial,
    raw,
    summary,
  };
}
