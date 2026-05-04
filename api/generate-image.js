export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { prompt, size = '1024x1536' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'FAL_API_KEY não configurada na Vercel.' });

  const isReels = size === '1024x1920' || size === '1080x1920';
  const imageSize = isReels ? 'portrait_16_9' : 'portrait_4_3';

  try {
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

    const start = Date.now();
    while (Date.now() - start < 55000) {
      await new Promise(r => setTimeout(r, 2000));

      const statusRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}/status`, {
        headers: { 'Authorization': `Key ${apiKey}` },
      });

      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(`https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/${requestId}`, {
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
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao gerar imagem', details: String(error?.message || error) });
  }
}
