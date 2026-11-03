-- Sağ menü (Sanayi Dışı / Kurumsal) kategori sayıları: il, ilçe, mahalle ve sokağa göre
create or replace function public.firma_kategori_sayilari_konum(p_il text, p_ilce text default null, p_mahalle bigint default null, p_sokak bigint default null)
returns table(grup text, kategori_id bigint, sayi bigint) language sql stable set search_path to 'public' as $$
  select g.grup, f.kategori_id::bigint, count(*)::bigint
  from firmalar f
  cross join lateral (
    select case
      when f.firma_tipi = 'kurumsal' then 'kurumsal'
      when f.firma_tipi = 'sitesiz'
        or (f.firma_tipi is null and (f.sanayi_sitesi is null or f.sanayi_sitesi = '')) then 'sitesiz'
    end as grup
  ) g
  where f.onay_durumu = 'onaylandi'
    and f.ad not ilike '(Firma%'
    and f.il_adi = p_il
    and (p_ilce is null or f.ilce_adi = p_ilce)
    and (p_mahalle is null or f.mahalle_id = p_mahalle)
    and (p_sokak is null or f.sokak_id = p_sokak)
    and g.grup is not null
  group by g.grup, f.kategori_id;
$$;
grant execute on function public.firma_kategori_sayilari_konum(text, text, bigint, bigint) to anon, authenticated;
