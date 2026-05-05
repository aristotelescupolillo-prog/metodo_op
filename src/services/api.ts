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

async function proxyImageToBase64(url: string): Promise<string> {
  const res = await fetch('/api/proxy-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Falha no proxy de imagem');
  const data = await res.json();
  return data.dataUrl;
}

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
}): string {
  const { titulo, texto, imagePrompt, leituraCenica, primaryColor, accentColor, fontFamily, moodInstructions } = params;
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

  return `Crie um post profissional para Instagram. Formato vertical 1024x1536px.

RESPIRO INTERNO OBRIGATÓRIO: 110px em todos os lados. Todo texto e assinatura devem respeitar esse espaçamento interno.

${moodInstructions}

${cenaDetalhada}

CONTEÚDO TEXTUAL:
- Título principal em CAIXA ALTA (bold, destaque máximo, tamanho ajustado para caber sem cortar): "${tituloUpper}"
- Texto de apoio (regular, secundário, caixa normal): "${texto}"
- ${marcaInstruction}

COR PRIMÁRIA: ${primaryColor}
COR DE DESTAQUE: ${accentColor}
TIPOGRAFIA: ${fontFamily}

REGRAS:
- Título renderizado em CAIXA ALTA exatamente como: "${tituloUpper}"
- Texto de apoio exatamente como: "${texto}", em caixa normal
- Todo texto em português, sem tradução, sem texto em inglês
- Sem elementos decorativos genéricos
- A tampa traseira de tablets e celulares é uma superfície SÓLIDA e OPACA — não tem tela, não tem display, não mostra absolutamente nada
- Gráficos, dashboards e interfaces só podem aparecer na tela frontal, nunca na tampa
- O canto inferior direito deve ficar SEMPRE limpo e livre de texto
- Alta resolução, estética editorial contemporânea brasileira`;
}

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
  leituraCenica?: {
    intencao?: string;
    personagem?: string;
    ambiente?: string;
    expressao?: string;
    clima?: string;
    composicao?: string;
  };
}): Promise<string> {
  const key = await getFalKey();
  const { imagePrompt, titulo, texto, primaryColor, accentColor, fontFamily, mood, vertical, leituraCenica } = params;

  const isReels = vertical === 'reels';
  const moodInstructions = moodVisualInstructions[mood] || moodVisualInstructions['OP-01'];

  const prompt = isReels
    ? `${imagePrompt}. Fotografia editorial profissional, imagem pura sem texto, sem assinatura, composição vertical cinematográfica 1080x1920px, luz natural, alta qualidade.`
    : buildImagePrompt({
        titulo,
        texto,
        imagePrompt,
        leituraCenica,
        primaryColor,
        accentColor,
        fontFamily,
        moodInstructions,
      });

  const falRes = await fetch('https://fal.run/fal-ai/gpt-image-1/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${key}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: '1024x1536',
      num_images: 1,
      quality: 'high',
      output_format: 'jpeg',
    }),
  });

  if (!falRes.ok) {
    const errText = await falRes.text();
    throw new Error(`Erro no gpt-image-1: ${errText}`);
  }

  const falData = await falRes.json();
  const imageUrl = falData.images?.[0]?.url;
  if (!imageUrl) throw new Error('URL de imagem ausente');

  const dataUrl = await proxyImageToBase64(imageUrl);
  return dataUrl;
}
