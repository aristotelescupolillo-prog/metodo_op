export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { prompt, size = '1024x1536', references } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL_API_KEY não configurada na Vercel.' });

  const model = process.env.IMAGE_MODEL || 'flux-pro';

  try {
    if (model === 'nano-banana-pro') {
      return await generateWithNanoBananaPro({ prompt, size, references, apiKey, res });
    }
    return await generateWithFluxPro({ prompt, size, apiKey, res });
  } catch (error) {
    return res.status(500).json({
      error: 'Falha ao gerar imagem',
      details: String(error?.message || error),
    });
  }
}

async function generateWithFluxPro({ prompt, size, apiKey, res }) {
  const isReels = size === '1024x1920' || size === '1080x1920';
  const imageSize = isReels ? 'portrait_16_9' : 'portrait_4_3';

  const submitRes = await fetch('https://queue.fal.run/fal-ai/flux-pro/v1.1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: `${prompt}. Fotografia realista, estética editorial contemporânea, luz natural, composição limpa, sem texto, sem logotipo, sem distorções.`,
      image_size: imageSize,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      safety_tolerance: '2',
      output_format: 'jpeg',
    }),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    return res.status(submitRes.status).json({ error: 'Erro ao submeter job no fal.ai', details: text });
  }

  const submitData = await submitRes.json();
  const requestId = submitData.request_id;
  if (!requestId) return res.status(500).json({ error: 'request_id ausente na resposta do fal.ai' });

  return await pollAndReturn({
    statusUrl: `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}/status`,
    resultUrl: `https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}`,
    apiKey,
    res,
  });
}

async function generateWithNanoBananaPro({ prompt, size, references, apiKey, res }) {
  const isReels = size === '1024x1920' || size === '1080x1920';
  const aspectRatio = isReels ? '9:16' : '4:5';
  const resolution = '2K';

  const hasReferences = Array.isArray(references) && references.length > 0;
  if (hasReferences && references.length > 14) {
    return res.status(400).json({
      error: 'Nano Banana Pro Edit aceita no máximo 14 imagens de referência',
    });
  }

  const endpoint = hasReferences
    ? 'https://queue.fal.run/fal-ai/nano-banana-pro/edit'
    : 'https://queue.fal.run/fal-ai/nano-banana-pro';

  const enrichedPrompt = `${prompt}. Fotografia realista, estética editorial contemporânea, luz natural, composição limpa, sem texto, sem logotipo, sem distorções.`;

  const body = {
    prompt: enrichedPrompt,
    aspect_ratio: aspectRatio,
    resolution,
    num_images: 1,
    output_format: 'jpeg',
    safety_tolerance: '4',
    limit_generations: true,
  };

  if (hasReferences) {
    body.image_urls = references.map((r) => (typeof r === 'string' ? r : r.url));
  }

  const submitRes = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!submitRes.ok) {
    const text = await submitRes.text();
    return res.status(submitRes.status).json({
      error: 'Erro ao submeter job no Nano Banana Pro',
      details: text,
    });
  }

  const submitData = await submitRes.json();
  const requestId = submitData.request_id;
  if (!requestId) return res.status(500).json({ error: 'request_id ausente na resposta do fal.ai' });

  const basePath = hasReferences
    ? 'https://queue.fal.run/fal-ai/nano-banana-pro/edit'
    : 'https://queue.fal.run/fal-ai/nano-banana-pro';

  return await pollAndReturn({
    statusUrl: `${basePath}/requests/${requestId}/status`,
    resultUrl: `${basePath}/requests/${requestId}`,
    apiKey,
    res,
  });
}

async function pollAndReturn({ statusUrl, resultUrl, apiKey, res }) {
  const start = Date.now();
  while (Date.now() - start < 55000) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${apiKey}` },
    });
    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();

    if (statusData.status === 'COMPLETED') {
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });
      const resultData = await resultRes.json();
      const imageUrl = resultData.images?.[0]?.url;
      if (!imageUrl) return res.status(500).json({ error: 'URL de imagem ausente no resultado fal.ai' });

      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = imageUrl.includes('.png') ? 'image/png' : 'image/jpeg';

      return res.status(200).json({ imageDataUrl: `data:${mimeType};base64,${base64}` });
    }

    if (statusData.status === 'FAILED') {
      return res.status(500).json({ error: 'Job falhou no fal.ai', details: statusData });
    }
  }
  return res.status(504).json({ error: 'Timeout aguardando imagem do fal.ai' });
}
