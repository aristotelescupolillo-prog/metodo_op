export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  if (req.method === 'GET') {
    const { company, list } = req.query;

    if (list) {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/brand_kits?select=id,company_name&order=updated_at.desc`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json({ kits: data });
    }

    if (company) {
      const r = await fetch(
        `${supabaseUrl}/rest/v1/brand_kits?company_name=eq.${encodeURIComponent(company)}&order=updated_at.desc&limit=1`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json({ kit: data[0] || null });
    }

    return res.status(400).json({ error: 'Parâmetro ausente' });
  }

  if (req.method === 'POST') {
    const { kit } = req.body || {};
    if (!kit) return res.status(400).json({ error: 'kit ausente' });

    const payload = {
      company_name: kit.companyName,
      segment: kit.segment,
      primary_color: kit.primaryColor,
      secondary_color: kit.secondaryColor,
      accent_color: kit.accentColor,
      font_pair: kit.fontPair,
      brand_voice: kit.brandVoice,
      logo_has_name: kit.logoHasName,
      logo_url: kit.logoDataUrl || null,
      main_activity: kit.mainActivity || null,
      instagram_url: kit.instagramUrl || null,
      updated_at: new Date().toISOString(),
    };

    const r = await fetch(`${supabaseUrl}/rest/v1/brand_kits`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    return res.status(200).json({ id: data[0]?.id || null });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
