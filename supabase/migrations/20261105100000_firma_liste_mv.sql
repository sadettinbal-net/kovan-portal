-- Hız: listeleme, arama ve sağ menü sayıları onaylı firmaların önceden hazırlanmış kopyalarından okunur.
-- firma_liste_mv : ince liste (süzme, ad sırası "sira", sayım)
-- firma_arama_mv : normalize arama metni (trigram dizinli) + aramanın döndürdüğü uzun alanlar
-- İkisi de firma_ozet_yenile() içinde yenilenir (pg_cron "firma-ozet-yenile", 5 dk'da bir).
-- Büyük aktarımdan sonra hemen görünmesi için: select firma_ozet_yenile();
-- Ölçüm (5 Kasım 2026): firma_liste tümü 2,7 sn → 0,07 sn; firma_ara_aday 1,5 sn → 0,03 sn;
-- site sayfası listesi 0,27 sn → 0,005 sn; arama kutusu önerisi (nadir kelime) 1,5 sn → 0,002 sn.

create materialized view public.firma_liste_mv as
select f.id,
       row_number() over (order by f.ad, f.id)::int as sira,
       f.sektor, f.sanayi_sitesi, f.il_adi, f.ilce_adi, f.mahalle_id, f.sokak_id, f.firma_tipi, f.kategori_id,
       f.hedef_sayfa, f.yorum_sayisi, f.olumlu_yuzde,
       (f.firma_tipi = 'sitesiz' or (f.firma_tipi is null and coalesce(f.sanayi_sitesi, '') = '')) as sitesiz,
       (coalesce(f.sanayi_sitesi, '') = '') as sitesi_bos
from public.firmalar f
where f.onay_durumu = 'onaylandi' and f.ad not ilike '(Firma%';
create unique index firma_liste_mv_id on public.firma_liste_mv (id);
create index firma_liste_mv_sira on public.firma_liste_mv (sira);
create index firma_liste_mv_il on public.firma_liste_mv (il_adi, ilce_adi);
create index firma_liste_mv_mahalle on public.firma_liste_mv (mahalle_id);
create index firma_liste_mv_site on public.firma_liste_mv (sanayi_sitesi);
create index firma_liste_mv_kat on public.firma_liste_mv (kategori_id);
create index firma_liste_mv_tip on public.firma_liste_mv (firma_tipi);

create materialized view public.firma_arama_mv as
select f.id, f.ad, f.sahip, f.hizmetler,
       lower(translate(concat_ws(' ', f.ad, f.sektor, f.sanayi_sitesi, f.sahip, array_to_string(f.hizmetler, ' ')),
             'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc')) as arama
from public.firmalar f
where f.onay_durumu = 'onaylandi' and f.ad not ilike '(Firma%';
create unique index firma_arama_mv_id on public.firma_arama_mv (id);
create index firma_arama_mv_trgm on public.firma_arama_mv using gin (arama gin_trgm_ops);

grant select on public.firma_liste_mv, public.firma_arama_mv to anon, authenticated;

-- Arama kutusu önerileri ve kenar menü aramaları (imatch = ~*) için
create index if not exists firmalar_ad_trgm on public.firmalar using gin (ad gin_trgm_ops);
create index if not exists firmalar_sektor_trgm on public.firmalar using gin (sektor gin_trgm_ops);
create index if not exists firmalar_sanayi_sitesi_trgm on public.firmalar using gin (sanayi_sitesi gin_trgm_ops);
create index if not exists firmalar_il_ilce on public.firmalar (il_adi, ilce_adi);
create index if not exists firmalar_firma_tipi on public.firmalar (firma_tipi);

-- Süzgeç parametresinden yalnızca verilen koşulları içeren WHERE metni (değerler %L / sayı dönüşümüyle güvenli)
create or replace function public.firma_suzgec_kosulu(p jsonb)
returns text language plpgsql immutable set search_path = public as $$
declare k text[] := array['true'];
begin
  if p->>'il' is not null then k := array_append(k, format('m.il_adi = %L', p->>'il')); end if;
  if p->>'ilce' is not null then k := array_append(k, format('m.ilce_adi = %L', p->>'ilce')); end if;
  if p->>'mahalle_id' is not null then k := array_append(k, format('m.mahalle_id = %s', (p->>'mahalle_id')::bigint)); end if;
  if p->>'sokak_id' is not null then k := array_append(k, format('m.sokak_id = %s', (p->>'sokak_id')::bigint)); end if;
  case p->>'firma_tipi'
    when 'siteli' then k := array_append(k, 'm.firma_tipi = ''siteli''');
    when 'kurumsal' then k := array_append(k, 'm.firma_tipi = ''kurumsal''');
    when 'sitesiz' then k := array_append(k, 'm.sitesiz');
    else null;
  end case;
  if coalesce((p->>'eski_sitesiz')::boolean, false) then k := array_append(k, 'm.sitesi_bos'); end if;
  if p->'siteler' is not null then
    k := array_append(k, format('m.sanayi_sitesi = any(%L::text[])', array(select jsonb_array_elements_text(p->'siteler'))));
  end if;
  if p->'kategori_idler' is not null then
    k := array_append(k, format('m.kategori_id = any(%L::bigint[])', array(select (jsonb_array_elements_text(p->'kategori_idler'))::bigint)));
  end if;
  if p->>'sektor' is not null then k := array_append(k, format('m.sektor = %L', p->>'sektor')); end if;
  return array_to_string(k, ' and ');
end $$;

create or replace function public.firma_liste_yeni(p jsonb default '{}'::jsonb)
returns json language plpgsql stable set search_path = public as $$
declare sonuc json;
begin
  execute format($q$
    select json_build_object(
      'idler', coalesce((select json_agg(m.id order by m.sira) from firma_liste_mv m where %1$s), '[]'::json),
      'ozel', coalesce((select json_agg(json_build_array(m.id, m.sektor, m.hedef_sayfa, m.yorum_sayisi, m.olumlu_yuzde))
                        from firma_liste_mv m where (%1$s)
                          and (m.hedef_sayfa is not null or coalesce(m.yorum_sayisi, 0) > 0 or m.sektor = 'SANAYİ SİTESİ YÖNETİMİ')), '[]'::json))
  $q$, firma_suzgec_kosulu(p)) into sonuc;
  return sonuc;
end $$;

create or replace function public.firma_kategori_adetleri_yeni(p jsonb default '{}'::jsonb)
returns json language plpgsql stable set search_path = public as $$
declare sonuc json;
begin
  execute format($q$
    select coalesce(json_object_agg(kategori_id, adet), '{}'::json) from (
      select m.kategori_id, count(*) adet from firma_liste_mv m
      where m.kategori_id is not null and %s group by m.kategori_id) t
  $q$, firma_suzgec_kosulu(p - 'kategori_idler' - 'sektor')) into sonuc;
  return sonuc;
end $$;

create or replace function public.firma_ara_aday_yeni(p jsonb default '{}'::jsonb, kelimeler text[] default '{}'::text[])
returns json language plpgsql stable set search_path = public as $$
declare sonuc json; kos text := firma_suzgec_kosulu(p); k text;
begin
  foreach k in array coalesce(kelimeler, '{}'::text[]) loop
    kos := kos || format(' and a.arama like %L', '%' || replace(replace(replace(k, '\', '\\'), '%', '\%'), '_', '\_') || '%');
  end loop;
  execute format($q$
    select coalesce(json_agg(json_build_array(m.id, a.ad, a.sahip, m.sektor, m.sanayi_sitesi, a.hizmetler,
                                              m.hedef_sayfa, m.yorum_sayisi, m.olumlu_yuzde) order by m.sira), '[]'::json)
    from firma_arama_mv a join firma_liste_mv m on m.id = a.id where %s
  $q$, kos) into sonuc;
  return sonuc;
end $$;

create or replace function public.firma_kategori_sayilari_yeni()
returns table(grup text, kategori_id bigint, sayi bigint) language sql stable set search_path = public as $$
  select case when m.firma_tipi = 'kurumsal' then 'kurumsal' else 'sitesiz' end, m.kategori_id::bigint, count(*)::bigint
  from firma_liste_mv m where m.firma_tipi = 'kurumsal' or m.sitesiz
  group by 1, 2;
$$;

create or replace function public.firma_kategori_sayilari_konum_yeni(p_il text, p_ilce text default null, p_mahalle bigint default null, p_sokak bigint default null)
returns table(grup text, kategori_id bigint, sayi bigint) language sql stable set search_path = public as $$
  select case when m.firma_tipi = 'kurumsal' then 'kurumsal' else 'sitesiz' end, m.kategori_id::bigint, count(*)::bigint
  from firma_liste_mv m
  where (m.firma_tipi = 'kurumsal' or m.sitesiz)
    and m.il_adi = p_il
    and (p_ilce is null or m.ilce_adi = p_ilce)
    and (p_mahalle is null or m.mahalle_id = p_mahalle)
    and (p_sokak is null or m.sokak_id = p_sokak)
  group by 1, 2;
$$;

-- Sitenin çağırdığı fonksiyonlar (adlar ve dönüş biçimleri aynı)
create or replace function public.firma_liste(p jsonb default '{}'::jsonb)
returns json language plpgsql stable set search_path = public as $$ begin return firma_liste_yeni(p); end $$;
create or replace function public.firma_kategori_adetleri(p jsonb default '{}'::jsonb)
returns json language plpgsql stable set search_path = public as $$ begin return firma_kategori_adetleri_yeni(p); end $$;
create or replace function public.firma_ara_aday(p jsonb default '{}'::jsonb, kelimeler text[] default '{}'::text[])
returns json language plpgsql stable set search_path = public as $$ begin return firma_ara_aday_yeni(p, kelimeler); end $$;
create or replace function public.firma_kategori_sayilari()
returns table(grup text, kategori_id bigint, sayi bigint) language sql stable set search_path = public as $$
  select * from firma_kategori_sayilari_yeni(); $$;
create or replace function public.firma_kategori_sayilari_konum(p_il text, p_ilce text default null, p_mahalle bigint default null, p_sokak bigint default null)
returns table(grup text, kategori_id bigint, sayi bigint) language sql stable set search_path = public as $$
  select * from firma_kategori_sayilari_konum_yeni(p_il, p_ilce, p_mahalle, p_sokak); $$;

create or replace function public.firma_ozet_yenile()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.firma_ozet_onbellek;
  insert into public.firma_ozet_onbellek
  select f.sanayi_sitesi, f.sektor, f.il_adi, count(*)::bigint from public.firmalar f
  where f.onay_durumu = 'onaylandi' and f.ad not ilike '(Firma%' group by 1,2,3;
  refresh materialized view concurrently public.firma_liste_mv;
  refresh materialized view concurrently public.firma_arama_mv;
end $$;
