export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL ausente' });
  try {
    const imgRes = await fetch(url);
    if (!imgRes.ok) return res.status(502).json({ error: 'Falha ao buscar imagem' });
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    return res.status(200).json({ dataUrl: `data:${contentType};base64,${base64}` });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
