-- Ana sayfa "Kayıtlı Firmalar": her açılışta farklı sanayi sitelerinden karışık firmalar (her siteden en fazla 1)
create or replace function public.anasayfa_site_firmalari(p_adet int default 21)
returns setof public.firmalar
language sql volatile
set search_path = public
as $$
  select f.* from public.firmalar f
  join (
    select id from (
      select id, row_number() over (partition by sanayi_sitesi order by random()) rn
      from public.firmalar
      where firma_tipi = 'siteli' and onay_durumu = 'onaylandi'
        and ad not ilike '(Firma%'
        and coalesce(sektor, '') <> 'SANAYİ SİTESİ YÖNETİMİ'
    ) x where rn = 1
    order by random() limit least(greatest(p_adet, 1), 60)
  ) s on s.id = f.id;
$$;
grant execute on function public.anasayfa_site_firmalari(int) to anon, authenticated;
