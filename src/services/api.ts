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
  return normalizeMethodResult(payload.result);
}

async function getFalKey(): Promise<string> {
  const res = await fetch('/api/fal-key');
  if (!res.ok) throw new Error('Não foi possível obter a chave do fal.ai');
  const data = await res.json();
  return data.key;
}

const moodVisualInstructions: Record<MoodCode, string> = {
  'OP-01': `ESTILO VISUAL — OP-01 CLAREZA (raiz: Renascentista):
- Grid organizado em 3 zonas horizontais bem definidas
- Logo pequeno e discreto no topo, área central para a cena principal
- Título em 2 linhas máximo, hierarquia tipográfica clara
- Texto de apoio curto abaixo do título
- Luz natural equilibrada, composição simétrica
- Fundo limpo, sem elementos decorativos desnecessários
- Paleta fria e controlada, cor de destaque apenas no elemento-chave`,

  'OP-02': `ESTILO VISUAL — OP-02 IMPACTO (raiz: Barroco):
- Fundo muito escuro (#0f0f0f ou similar), contraste extremo
- Imagem com iluminação dramática, luz focal sobre o elemento principal
- Texto em cor quente de destaque (amarelo, laranja ou vermelho)
- CTA pequeno e direto no rodapé
- Composição assimétrica com tensão visual intencional
- Sombras profundas, luz e sombra como protagonistas`,

  'OP-03': `ESTILO VISUAL — OP-03 INSTANTE (raiz: Impressionista):
- Foto de bastidor ou cena cotidiana capturada ao vivo
- Filtro quente e orgânico, luz ambiente natural sem estúdio
- Texto manuscrito ou informal sobreposto à imagem
- Sem simetria rígida, sem moldura formal
- Sensação de captura espontânea, autêntica
- Cores vibrantes e quentes, textura visível`,

  'OP-04': `ESTILO VISUAL — OP-04 FRAGMENTO (raiz: Cubista):
- Post-colagem com 3 a 5 blocos visuais distintos
- Cada bloco carrega uma informação ou ângulo diferente
- Título ancora toda a composição no rodapé
- Multiperspectividade: diferentes recortes do mesmo tema
- Grid visível ou implícito organizando os fragmentos
- Paleta controlada unificando os blocos`,

  'OP-05': `ESTILO VISUAL — OP-05 DESVIO (raiz: Surrealista):
- Imagem-conceito com elemento inesperado ou metáfora visual
- Composição ousada que provoca estranhamento controlado
- Texto-pergunta curto e provocativo
- Colagem digital ou manipulação visual intencional
- Elemento fora do lugar como ponto focal
- Paleta incomum ou contraste inesperado`,

  'OP-06': `ESTILO VISUAL — OP-06 SILÊNCIO (raiz: Minimalista):
- Fundo quase branco ou muito claro, espaço vazio como elemento principal
- Uma única frase, fonte tipográfica como protagonista
- Detalhe mínimo de cor como assinatura (linha, ponto ou elemento discreto)
- Sem logo visível — a fonte é a marca
- Composição com muito respiro, elementos reduzidos ao essencial
- Sensação de premium, contenção e autoridade`,
};

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
  vertical: 'post' | 'reels';
}): Promise<string> {
  const key = await getFalKey();
  const { imagePrompt, titulo, texto, companyName, primaryColor, accentColor, fontFamily, logoDataUrl, mood, vertical } = params;

  const isReels = vertical === 'reels';
  const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];

  const logoInstruction = logoDataUrl
    ? `LOGOMARCA: Aplique a logomarca fornecida como referência no local correto conforme o estilo visual, com fidelidade e sem distorções.`
    : `MARCA: Escreva o nome "${companyName}" como assinatura da marca no local indicado pelo estilo visual.`;

  const prompt = isReels
    ? `${imagePrompt}. Fotografia editorial profissional, imagem pura sem texto, sem logo, composição vertical cinematográfica 1080x1920px, luz natural, alta qualidade.`
    : `Crie um post profissional para Instagram. Formato vertical 1080x1350px.

RESPIRO INTERNO OBRIGATÓRIO: 110px em todos os lados (topo, base, esquerda, direita). Todo texto e logo devem respeitar esse espaçamento.

${moodInstructions}

CENA FOTOGRÁFICA: ${imagePrompt}

CONTEÚDO TEXTUAL A APLICAR NA IMAGEM:
- Título principal (bold, destaque máximo): "${titulo}"
- Texto de apoio (regular, secundário): "${texto}"
- ${logoInstruction}

COR PRIMÁRIA DA MARCA: ${primaryColor}
COR DE DESTAQUE: ${accentColor}
TIPOGRAFIA: ${fontFamily}

REGRAS ABSOLUTAS:
- O texto "${titulo}" e "${texto}" devem aparecer EXATAMENTE como escritos, em português
- Sem texto em inglês
- Sem elementos decorativos genéricos
- Sem bordas externas
- Alta resolução, estética editorial contemporânea brasileira`;

  const body: Record<string, unknown> = {
    prompt,
    image_size: isReels ? 'portrait_16_9' : 'portrait_4_3',
    num_images: 1,
    quality: 'high',
    output_format: 'jpeg',
  };

  if (logoDataUrl && !isReels) {
    body.image_url = logoDataUrl;
  }

  const falRes = await fetch('https://fal.run/fal-ai/gpt-image-1/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!falRes.ok) {
    const errText = await falRes.text();
    throw new Error(`Erro no gpt-image-1: ${errText}`);
  }

  const falData = await falRes.json();
  const imageUrl = falData.images?.[0]?.url;
  if (!imageUrl) throw new Error('URL de imagem ausente na resposta do gpt-image-1');
  return imageUrl;
}
