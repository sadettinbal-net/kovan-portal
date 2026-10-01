import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key, {
  global: {
    fetch: (input, init) => fetch(input as RequestInfo, { ...(init as RequestInit), cache: 'no-store' }),
  },
});

export type Firma = {
  id: number;
  ad: string;
  sahip: string;
  sektor: string;
  sanayi_sitesi: string;
  adres: string;
  telefon: string;
  mobil_telefon?: string | null;
  hizmetler: string[];
  ozel_firma: boolean;
  fotograf_url: string | null;
  detay_fotograflar: string[] | null;
  onay_durumu: 'beklemede' | 'onaylandi' | 'reddedildi';
  aciklama?: string | null;
  web_sitesi?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  kullanici_email?: string | null;
  yeniden_gonderildi?: boolean | null;
  bekleyen_degisiklikler?: Record<string, unknown> | null;
  guncelleme_talep_tarihi?: string | null;
  hedef_sayfa?: number | null;
  yeni_kategori?: boolean | null;
  yeni_kategori_tipi?: string | null;
  plus_code?: string | null;
  firma_tipi?: 'siteli' | 'sitesiz' | 'kurumsal' | null;
  kategori_id?: number | null;
  created_at: string;
};

export type Yorum = {
  id: number;
  firma_id: number;
  kullanici_email: string;
  kullanici_ad: string;
  yorum: string;
  puan: number;
  created_at: string;
};
