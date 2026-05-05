export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const falKey = process.env.FAL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!falKey) return res.status(500).json({ error: 'FAL_API_KEY não configurada' });
  if (!openaiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada' });

  const { imageBase64, script } = req.body || {};
  if (!imageBase64 || !script) return res.status(400).json({ error: 'imageBase64 e script são obrigatórios' });

  try {
    // 1. Detectar gênero via GPT Vision
    const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageBase64 },
              },
              {
                type: 'text',
                text: 'Is the main person in this image male or female? Reply with only one word: male or female.',
              },
            ],
          },
        ],
      }),
    });

    let voice = 'pm_alex';
    if (visionRes.ok) {
      const visionData = await visionRes.json();
      const gender = visionData.choices?.[0]?.message?.content?.toLowerCase().trim();
      if (gender?.includes('female')) voice = 'pf_dora';
    }

    // 2. Gerar áudio TTS em português brasileiro
    const ttsRes = await fetch('https://fal.run/fal-ai/kokoro/brazilian-portuguese', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: script,
        voice,
      }),
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return res.status(500).json({ error: `Erro no TTS: ${err}` });
    }

    const ttsData = await ttsRes.json();
    const audioUrl = ttsData.audio?.url || ttsData.audio_url?.url;
    if (!audioUrl) return res.status(500).json({ error: 'URL de áudio ausente' });

    // 3. Gerar vídeo com Omnihuman v1.5
    const prompt = 'Camera holds steady. The character speaks directly and naturally to the camera with clear lip sync, natural head movement and expressive facial emotions matching the audio tone.';

    const videoRes = await fetch('https://fal.run/fal-ai/bytedance/omnihuman/v1.5', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageBase64,
        audio_url: audioUrl,
        prompt,
        resolution: '720p',
        turbo_mode: true,
      }),
    });

    if (!videoRes.ok) {
      const err = await videoRes.text();
      return res.status(500).json({ error: `Erro no Omnihuman: ${err}` });
    }

    const videoData = await videoRes.json();
    const videoUrl = videoData.video?.url || videoData.url;
    return res.status(200).json({ videoUrl });

  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
