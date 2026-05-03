export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { prompt, size = '1024x1536' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada na Vercel.' });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size,
        quality: 'medium',
        n: 1,
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: 'Erro na geração de imagem', details: text });
    }

    const data = await openaiRes.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'Imagem vazia.' });
    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao gerar imagem', details: String(error?.message || error) });
  }
}
