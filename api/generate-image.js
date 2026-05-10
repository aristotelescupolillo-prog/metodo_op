// ─────────────────────────────────────────────────────────────────
// API ROUTE — GPT-Image-1 entrega a peça PRONTA
// (foto + título + texto + design integrados).
// O Canvas, depois, só aplica a logomarca com respiro de 110px.
// ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY não configurada na Vercel.' });

  // O prompt já vem 100% formatado de services/api.ts (buildImagePrompt).
  // Esta route NÃO injeta mais titulo/texto: tudo está no prompt original.
  // Isso elimina a contradição "proibido texto + insira este texto"
  // que estava confundindo o modelo.

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
        quality: 'high',
        output_format: 'b64_json',
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: 'Erro na OpenAI GPT-Image-1', details: errText });
    }

    const data = await openaiRes.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: 'b64_json ausente na resposta da OpenAI' });

    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}` });
  } catch (error) {
    return res.status(500).json({
      error: 'Falha ao gerar imagem com GPT-Image-1',
      details: String(error?.message || error),
    });
  }
}
