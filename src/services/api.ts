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

  const falRes = await fetch('https://fal.run/fal-ai/nano-banana-2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${key}`,
    },
    body: JSON.stringify({
      prompt: `${prompt}. Fotografia editorial profissional, luz natural abundante e clara, cena bem iluminada, composição limpa e moderna, sem texto, sem logotipo, sem distorções anatômicas, alta qualidade.`,
      image_size: imageSize,
      num_inference_steps: 28,
      num_images: 1,
      output_format: 'jpeg',
    }),
  });

  if (!falRes.ok) {
    const falRes2 = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${key}`,
      },
      body: JSON.stringify({
        prompt: `${prompt}. Fotografia editorial profissional, luz natural abundante e clara, cena bem iluminada, composição limpa, sem texto, sem logotipo, sem distorções.`,
        image_size: imageSize,
        num_inference_steps: 20,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: false,
        output_format: 'jpeg',
      }),
    });
    if (!falRes2.ok) {
      const text = await falRes2.text();
      throw new Error(`Erro no fal.ai: ${text}`);
    }
    const falData2 = await falRes2.json();
    const imageUrl2 = falData2.images?.[0]?.url;
    if (!imageUrl2) throw new Error('URL de imagem ausente');
    return imageUrl2;
  }

  const falData = await falRes.json();
  const imageUrl = falData.images?.[0]?.url;
  if (!imageUrl) throw new Error('URL de imagem ausente na resposta do fal.ai');
  return imageUrl;
}
