-- Puanlama 1. aşama: e-posta gizliliği, gizlenebilir yorumlar, veritabanında hesaplanan puan özetleri.

-- 1) Yeni sütunlar
alter table public.yorumlar
  add column if not exists gizli boolean not null default false,       -- admin gizlediyse sitede görünmez, puana katılmaz
  add column if not exists guncelleme_tarihi timestamptz;              -- üye düzenlediyse "düzenlendi" yazar

alter table public.firmalar
  add column if not exists yorum_sayisi integer not null default 0,
  add column if not exists ortalama_puan numeric(2,1),                 -- örn. 4.3 (yorum yoksa boş)
  add column if not exists olumlu_yuzde integer;                       -- 4-5 yıldızların yüzdesi (yorum yoksa boş)

-- 2) Bir firmanın puan özetini yeniden hesaplar (gizli yorumlar sayılmaz)
create function public.firma_puan_ozeti_guncelle(p_firma_id integer)
returns void language sql security definer set search_path = public as $$
  update firmalar f set
    yorum_sayisi  = o.sayi,
    ortalama_puan = o.ortalama,
    olumlu_yuzde  = o.olumlu
  from (
    select count(*)::int as sayi,
           round(avg(puan), 1) as ortalama,
           round(100.0 * count(*) filter (where puan >= 4) / nullif(count(*), 0))::int as olumlu
    from yorumlar where firma_id = p_firma_id and not gizli
  ) o
  where f.id = p_firma_id;
$$;

-- 3) Yorum eklenince / değişince / silinince özet kendiliğinden güncellenir
create function public.yorumlar_puan_tetik()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform firma_puan_ozeti_guncelle(new.firma_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.firma_id <> new.firma_id) then
    perform firma_puan_ozeti_guncelle(old.firma_id);
  end if;
  return null;
end $$;

create trigger yorumlar_puan_ozeti
  after insert or update or delete on public.yorumlar
  for each row execute function public.yorumlar_puan_tetik();

-- Bu fonksiyonlar dışarıdan (açık anahtarla) çağrılamasın
revoke execute on function public.firma_puan_ozeti_guncelle(integer) from public, anon, authenticated;
revoke execute on function public.yorumlar_puan_tetik() from public, anon, authenticated;

-- 4) Mevcut 8 yorum için özetleri bir kez doldur
select public.firma_puan_ozeti_guncelle(firma_id) from (select distinct firma_id from public.yorumlar) y;

-- 5) E-posta gizliliği: yorumlar tablosu açık anahtarla okunamaz/yazılamaz (RLS politikasına dokunulmaz).
--    Site yorumları sunucu üzerinden okumaya devam eder.
revoke all on public.yorumlar from anon, authenticated;
