import { supabase } from '@/lib/supabase';

// Yeni tasarımın ortak verileri: kategoriler, sanayi siteleri (firma sayılarıyla)

export type Kategori = { id: number; kategori_adi: string; icon?: string; renk?: string };
export type AltKategori = { id: number; alt_kategori_adi: string; kategori_id: number };
export type Site = { id: number; site_adi: string; il_adi?: string; ilce_adi?: string; sayi: number };

export async function kategorileriYukle() {
  const [{ data: kat }, { data: alt }] = await Promise.all([
    supabase.from('kategoriler').select('id, kategori_adi, icon, renk').order('kategori_adi'),
    supabase.from('alt_kategoriler').select('id, alt_kategori_adi, kategori_id'),
  ]);
  return {
    kategoriler: (kat || []) as Kategori[],
    altKategoriler: new Map((alt || []).map((a) => [a.id, a as AltKategori])),
  };
}

// Sanayi siteleri, en çok firması olan üstte
export async function siteleriYukle() {
  const [{ data: siteler }, { data: firmaSiteleri }] = await Promise.all([
    supabase.from('sanayi_siteleri').select('id, site_adi, il_adi, ilce_adi'),
    supabase.from('dukkanlar').select('site_id').not('site_id', 'is', null),
  ]);
  const sayilar = new Map<number, number>();
  for (const f of firmaSiteleri || []) sayilar.set(f.site_id, (sayilar.get(f.site_id) || 0) + 1);
  return (siteler || [])
    .map((s) => ({ ...s, sayi: sayilar.get(s.id) || 0 }) as Site)
    .sort((a, b) => b.sayi - a.sayi || a.site_adi.localeCompare(b.site_adi, 'tr'));
}

export async function toplamFirmaSayisi() {
  const { count } = await supabase.from('dukkanlar').select('*', { count: 'exact', head: true });
  return count || 0;
}

// Arama metnini Supabase "or" süzgecine güvenli şekilde koy
export function aramaSuzgeci(metin: string) {
  const temiz = metin.replace(/[,()%*]/g, ' ').trim();
  if (!temiz) return null;
  return `dukkan_adi.ilike.%${temiz}%,usta_adi.ilike.%${temiz}%,kategori.ilike.%${temiz}%,hizmetler.ilike.%${temiz}%`;
}

export function basHarfler(ad: string) {
  return ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}

export function whatsappLinki(numara: string) {
  let rakamlar = numara.replace(/\D/g, '');
  if (rakamlar.startsWith('0')) rakamlar = rakamlar.slice(1);
  if (rakamlar.length === 10) rakamlar = '90' + rakamlar;
  return `https://wa.me/${rakamlar}`;
}
