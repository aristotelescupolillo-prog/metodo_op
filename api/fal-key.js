export default function handler(req, res) {
  const key = process.env.FAL_API_KEY;
  if (!key) return res.status(500).json({ error: 'FAL_API_KEY não configurada' });
  return res.status(200).json({ key });
}
