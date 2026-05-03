export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt ausente' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY não configurada na Vercel.' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um estrategista de conteúdo para redes sociais. Retorne SOMENTE JSON válido, sem markdown. Cada conteúdo deve cumprir uma função diferente e avançar psicologicamente em relação ao anterior. Proibido repetir argumento. O último conteúdo conduz à decisão ou ação.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.55,
        max_tokens: 7000,
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return res.status(openaiRes.status).json({ error: 'Erro na OpenAI', details: text });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: 'Resposta vazia da OpenAI.' });

    return res.status(200).json({ result: JSON.parse(content), usage: data.usage || null });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao gerar conteúdo', details: String(error?.message || error) });
  }
}
