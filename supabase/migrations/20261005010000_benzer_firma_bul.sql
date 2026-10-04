-- Firma eklerken "bu bölgede benzer adlı firma var mı?" uyarısı için.
create extension if not exists pg_trgm with schema extensions;

create index if not exists firmalar_normalize_ad_trgm_idx
  on public.firmalar using gin (public.normalize_ad(ad) extensions.gin_trgm_ops);

-- Aynı il ve ilçede adı benzeyen (benzerlik > 0.5) en fazla 5 firma, en benzerden başlayarak.
-- Onay bekleyenler de dahil (reddedilenler hariç); bu yüzden security definer.
-- Doğrudan çağrılamaz; /api/benzer-firma giriş kontrolü yapıp sunucu anahtarıyla çağırır.
create or replace function public.benzer_firma_bul(p_ad text, p_il text, p_ilce text)
returns table (id integer, ad text, kategori text, sanayi_sitesi text, benzerlik real)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select f.id, f.ad, f.sektor, f.sanayi_sitesi, similarity(normalize_ad(f.ad), normalize_ad(p_ad))
  from firmalar f
  where f.il_adi = p_il
    and f.ilce_adi is not distinct from p_ilce
    and f.onay_durumu <> 'reddedildi'
    and normalize_ad(f.ad) % normalize_ad(p_ad)
    and similarity(normalize_ad(f.ad), normalize_ad(p_ad)) > 0.5
  order by 5 desc, f.id
  limit 5;
$$;

revoke execute on function public.benzer_firma_bul(text, text, text) from public, anon, authenticated;
grant execute on function public.benzer_firma_bul(text, text, text) to service_role;
