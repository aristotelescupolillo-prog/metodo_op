// ─────────────────────────────────────────────────────────────────
// API ROUTE — GPT-Image-1
// O Canvas só aplica logomarca depois (110px de respiro).
// Tudo que aparece dentro da peça (foto + título + texto + design)
// vem deste request.
// ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada na Vercel.' });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1536',
        quality: 'medium',
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(openaiRes.status).json({
        error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 500)}`,
      });
    }

    const data = await openaiRes.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(500).json({
        error: 'Resposta da OpenAI sem b64_json',
        details: JSON.stringify(data).slice(0, 500),
      });
    }

    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return res.status(500).json({
      error: 'Falha ao chamar GPT-Image-1: ' + String(error?.message || error),
    });
  }
}
