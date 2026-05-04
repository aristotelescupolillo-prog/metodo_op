import { buildMetodoOpPrompt, normalizeMethodResult } from '../core/organizaMethodEngine';
import { ContentFormData, MethodOpResult } from '../types';

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

export async function generateBaseImage(prompt: string, vertical: 'post' | 'reels' = 'post'): Promise<string> {
  const key = await getFalKey();
  const isReels = vertical === 'reels';
  const imageSize = isReels ? 'portrait_16_9' : 'portrait_4_3';

  const falRes = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${key}`,
    },
    body: JSON.stringify({
      prompt: `${prompt}. Fotografia realista, estética editorial contemporânea, luz natural, composição limpa, sem texto, sem logotipo, sem distorções anatômicas.`,
      image_size: imageSize,
      num_inference_steps: 20,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false,
      output_format: 'jpeg',
    }),
  });

  if (!falRes.ok) {
    const text = await falRes.text();
    throw new Error(`Erro no fal.ai: ${text}`);
  }

  const falData = await falRes.json();
  const imageUrl = falData.images?.[0]?.url;
  if (!imageUrl) throw new Error('URL de imagem ausente na resposta do fal.ai');

  return imageUrl;
}
