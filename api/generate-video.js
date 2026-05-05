export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) return res.status(500).json({ error: 'FAL_API_KEY não configurada' });
  const { imageBase64, script } = req.body || {};
  if (!imageBase64 || !script) return res.status(400).json({ error: 'imageBase64 e script são obrigatórios' });
  try {
    const prompt = `The character in the image speaks directly to the camera, natural head movement, realistic lip sync, speaking in Portuguese: "${script}". Vertical format 9:16, cinematic quality, natural lighting, audio synchronized with speech. Duration: 10 seconds.`;
    const videoRes = await fetch('https://fal.run/xai/grok-imagine-video/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageBase64,
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
