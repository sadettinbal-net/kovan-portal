-- Ziyaretçi izlemeye reklam olayları: reklama tıklama (reklam_tik) ve reklamın ekranda görünme süresi (reklam_izle)
alter table public.ziyaretci_olaylari add column if not exists reklam_id int;
alter table public.ziyaretci_olaylari add column if not exists sure_ms int;
alter table public.ziyaretci_olaylari drop constraint if exists ziyaretci_olaylari_tip_check;
alter table public.ziyaretci_olaylari add constraint ziyaretci_olaylari_tip_check
  check (tip in ('sayfa', 'tiklama', 'reklam_tik', 'reklam_izle'));
alter table public.ziyaretci_oturumlari add column if not exists reklam_tiklama_sayisi int not null default 0;

-- Olaylar sırasıyla işlenir. reklam_izle tarayıcıdan parça parça (süre farkı olarak) gelir;
-- aynı sayfa gösterimindeki aynı reklamın satırına eklenir (geçmişte her reklam/sayfa için tek satır görünür).
create or replace function public.ziyaretci_kaydet(p_oturum uuid, p_bilgi jsonb, p_olaylar jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o record;
  v_sayfa int := 0;
  v_tik int := 0;
  v_rtik int := 0;
  v_ilk text;
  v_son_sayfa_id bigint;
  v_satir bigint;
  v_ms int;
begin
  -- Oturum yoksa açılır; varsa boş kalan bilgileri (istekler sırasız ulaşabilir) tamamlanır
  insert into ziyaretci_oturumlari as t (id, ip, ulke, bolge, sehir, cihaz, isletim_sistemi, tarayici, ekran, dil, referrer)
  values (
    p_oturum,
    left(p_bilgi->>'ip', 45), left(p_bilgi->>'ulke', 60), left(p_bilgi->>'bolge', 80), left(p_bilgi->>'sehir', 80),
    left(p_bilgi->>'cihaz', 20), left(p_bilgi->>'isletim_sistemi', 40), left(p_bilgi->>'tarayici', 40),
    left(p_bilgi->>'ekran', 20), left(p_bilgi->>'dil', 20), left(p_bilgi->>'referrer', 500)
  )
  on conflict (id) do update set
    ip = coalesce(t.ip, excluded.ip),
    ulke = coalesce(t.ulke, excluded.ulke),
    bolge = coalesce(t.bolge, excluded.bolge),
    sehir = coalesce(t.sehir, excluded.sehir),
    cihaz = coalesce(t.cihaz, excluded.cihaz),
    isletim_sistemi = coalesce(t.isletim_sistemi, excluded.isletim_sistemi),
    tarayici = coalesce(t.tarayici, excluded.tarayici),
    ekran = coalesce(t.ekran, excluded.ekran),
    dil = coalesce(t.dil, excluded.dil),
    referrer = coalesce(t.referrer, excluded.referrer)
  where p_bilgi <> '{}'::jsonb;

  for o in
    select e->>'tip' tip, left(e->>'sayfa', 500) sayfa, left(e->>'hedef', 150) hedef, left(e->>'baglanti', 500) baglanti,
           case when e->>'reklam_id' ~ '^[0-9]{1,9}$' then (e->>'reklam_id')::int end reklam_id,
           case when e->>'sure_ms' ~ '^[0-9]{1,9}$' then (e->>'sure_ms')::int end sure_ms
    from jsonb_array_elements(case when jsonb_typeof(p_olaylar) = 'array' then p_olaylar else '[]'::jsonb end) with ordinality as x(e, n)
    where e->>'tip' in ('sayfa', 'tiklama', 'reklam_tik', 'reklam_izle')
    order by x.n
    limit 80
  loop
    if o.tip = 'reklam_izle' then
      v_ms := least(greatest(coalesce(o.sure_ms, 0), 0), 3600000);
      continue when o.reklam_id is null or v_ms = 0;
      select max(id) into v_son_sayfa_id from ziyaretci_olaylari where oturum_id = p_oturum and tip = 'sayfa';
      v_satir := null;
      select id into v_satir from ziyaretci_olaylari
       where oturum_id = p_oturum and tip = 'reklam_izle' and reklam_id = o.reklam_id
         and sayfa is not distinct from o.sayfa and id > coalesce(v_son_sayfa_id, 0)
       order by id desc limit 1;
      if v_satir is not null then
        update ziyaretci_olaylari set sure_ms = least(coalesce(sure_ms, 0) + v_ms, 86400000) where id = v_satir;
      else
        insert into ziyaretci_olaylari (oturum_id, tip, sayfa, reklam_id, sure_ms) values (p_oturum, 'reklam_izle', o.sayfa, o.reklam_id, v_ms);
      end if;
    else
      insert into ziyaretci_olaylari (oturum_id, tip, sayfa, hedef, baglanti, reklam_id)
      values (p_oturum, o.tip, o.sayfa, o.hedef, o.baglanti, case when o.tip = 'reklam_tik' then o.reklam_id end);
      if o.tip = 'sayfa' then
        v_sayfa := v_sayfa + 1;
        v_ilk := coalesce(v_ilk, o.sayfa);
      elsif o.tip = 'tiklama' then
        v_tik := v_tik + 1;
      else
        v_rtik := v_rtik + 1;
      end if;
    end if;
  end loop;

  update ziyaretci_oturumlari
     set son_gorulme = now(),
         sayfa_sayisi = sayfa_sayisi + v_sayfa,
         tiklama_sayisi = tiklama_sayisi + v_tik,
         reklam_tiklama_sayisi = reklam_tiklama_sayisi + v_rtik,
         giris_sayfasi = coalesce(giris_sayfasi, v_ilk)
   where id = p_oturum;
end;
$$;

revoke all on function public.ziyaretci_kaydet(uuid, jsonb, jsonb) from public, anon, authenticated;
