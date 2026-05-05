import { BrandKit } from '../types';

export async function saveKitToSupabase(kit: BrandKit): Promise<string | null> {
  try {
    const res = await fetch('/api/supabase-kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kit }),
    });
    const data = await res.json();
    return data.id || null;
  } catch { return null; }
}

export async function loadKitFromSupabase(companyName: string): Promise<BrandKit | null> {
  try {
    const res = await fetch(`/api/supabase-kit?company=${encodeURIComponent(companyName)}`);
    const data = await res.json();
    if (!data.kit) return null;
    const k = data.kit;
   return {
      companyName: k.company_name,
      segment: k.segment,
      primaryColor: k.primary_color,
      secondaryColor: k.secondary_color,
      accentColor: k.accent_color,
      fontPair: k.font_pair,
      brandVoice: k.brand_voice,
      logoHasName: k.logo_has_name,
      logoDataUrl: k.logo_url || undefined,
      mainActivity: k.main_activity || '',
      instagramUrl: k.instagram_url || '',
    };
  } catch { return null; }
}

export async function listKits(): Promise<{ id: string; companyName: string }[]> {
  try {
    const res = await fetch('/api/supabase-kit?list=1');
    const data = await res.json();
    return (data.kits || []).map((k: any) => ({
      id: k.id,
      companyName: k.company_name,
    }));
  } catch { return []; }
}
