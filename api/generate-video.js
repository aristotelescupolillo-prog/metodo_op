export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

 const falKey = process.env.FAL_API_KEY;
if (!falKey) return res.status(500).json({ error: 'FAL_API_KEY não configurada' });

  const { imageBase64, script } = req.body || {};
  if (!imageBase64 || !script) return res.status(400).json({ error: 'imageBase64 e script são obrigatórios' });

  try {
    // 1. Upload da imagem para fal.ai storage
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(imageData, 'base64');

    const uploadRes = await fetch('https://fal.run/fal-ai/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: `Erro no upload: ${err}` });
    }

    const uploadData = await uploadRes.json();
    const imageUrl = uploadData.url;

    // 2. Gerar vídeo com Grok Imagine
    const prompt = `The character in the image speaks directly to the camera, looking forward, natural head movement, realistic lip sync: "${script}". Vertical format 9:16, cinematic quality, natural lighting, audio synchronized with speech.`;

    const videoRes = await fetch('https://fal.run/xai/grok-imagine-video/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
      }),
    });

    if (!videoRes.ok) {
      const err = await videoRes.text();
      return res.status(500).json({ error: `Erro na geração de vídeo: ${err}` });
    }

    const videoData = await videoRes.json();
    const videoUrl = videoData.video?.url || videoData.url;

    return res.status(200).json({ videoUrl });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
