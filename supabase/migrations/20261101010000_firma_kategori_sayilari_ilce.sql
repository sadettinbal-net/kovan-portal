-- Konuma Göre Ara: il (ve seçiliyse ilçe) için sağ menüdeki Sanayi Dışı / Kurumsal kategori sayıları
create or replace function public.firma_kategori_sayilari_ilce(p_il text, p_ilce text default null)
returns table(grup text, kategori_id bigint, sayi bigint)
language sql stable
set search_path to 'public'
as $function$
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
    and g.grup is not null
  group by g.grup, f.kategori_id;
$function$;

grant execute on function public.firma_kategori_sayilari_ilce(text, text) to anon, authenticated;
