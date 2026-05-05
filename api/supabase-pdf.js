export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  if (req.method === 'POST') {
    const { companyName, pdfBase64, filename } = req.body || {};
    if (!companyName || !pdfBase64 || !filename) {
      return res.status(400).json({ error: 'Parâmetros ausentes' });
    }

    const folder = companyName.replace(/[^a-zA-Z0-9]/g, '_');

    // Lista arquivos existentes do cliente
    const listRes = await fetch(
      `${supabaseUrl}/storage/v1/object/list/pdfs`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: `${folder}/`, limit: 100, offset: 0 }),
      }
    );
    const listData = await listRes.json();
    const existing = Array.isArray(listData) ? listData : [];

    // Ordena por data e apaga se já tem 2 ou mais
    if (existing.length >= 2) {
      const sorted = existing.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const toDelete = sorted.slice(0, existing.length - 1);
      await fetch(`${supabaseUrl}/storage/v1/object/pdfs`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: toDelete.map(f => `${folder}/${f.name}`) }),
      });
    }

    // Upload do novo PDF
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/pdfs/${folder}/${filename}`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true',
        },
        body: pdfBuffer,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      return res.status(500).json({ error: err });
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const { companyName } = req.query;
    if (!companyName) return res.status(400).json({ error: 'companyName ausente' });

    const folder = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    const listRes = await fetch(
      `${supabaseUrl}/storage/v1/object/list/pdfs`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: `${folder}/`, limit: 100, offset: 0 }),
      }
    );
    const listData = await listRes.json();
    const files = Array.isArray(listData) ? listData : [];
    const sorted = files.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const urls = sorted.map(f => ({
      name: f.name,
      url: `${supabaseUrl}/storage/v1/object/pdfs/${folder}/${f.name}`,
    }));
    return res.status(200).json({ pdfs: urls });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
