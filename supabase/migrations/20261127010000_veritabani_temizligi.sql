-- 2026-11-27 (canlıya uygulandı) — Supabase ücretsiz plan 500 MB sınırı için temizlik (983 MB -> 467 MB)
--
-- 1) public.mahalleler silindi (140 MB, 1 milyon satır). Kodda kullanılmıyordu; site mahalleler_yeni'yi kullanıyor.
--    Geri yüklemek gerekirse: database/08_import_mahalleler.sql
-- 2) Eski aktarım/yedek tabloları silindi (osb_aktarim_ham, egitim_aktarim_20261014, *_adana_ham,
--    eczane_aktarim_202610xx, yedek_*_oncesi_202610xx vb.). Tutulanlar: yedek_ozel_kaynak_20261025,
--    yedek_sanayi_duzeltme_20261029, aktarim_gecmisi, osb_aktarim_token, uyeler_eski, firmalar_yedek, firma_ad_yedek.
-- 3) sokaklar sadeleştirildi (328 MB -> 91 MB): 2,09 milyon satırın yarısı tekrardı; her sokak_id bir kez,
--    yalnızca kodun kullandığı sütunlar (sokak_id, mahalle_id, sokak_adi). sokak_id artık birincil anahtar
--    (sokak_id ile arama hızlandı). Sokağı olan 15.330 firmanın hepsi yeni tabloda bulunuyor.
--
-- Aşağıdaki adım canlıda şu şekilde uygulandı (sokaklar_ince önceden dolduruldu):
--   create table public.sokaklar_ince (sokak_id integer primary key, mahalle_id integer, sokak_adi varchar);
--   insert into public.sokaklar_ince select distinct on (sokak_id) sokak_id, mahalle_id, sokak_adi from public.sokaklar ...;
--   create index idx_sokaklar_ince_mahalle on public.sokaklar_ince (mahalle_id);
alter table public.sokaklar rename to sokaklar_eski_silinecek;
alter table public.sokaklar_ince rename to sokaklar;
alter index public.sokaklar_ince_pkey rename to sokaklar_sokak_id_pkey;
alter index public.idx_sokaklar_ince_mahalle rename to idx_sokaklar_mahalle_id;
alter table public.sokaklar enable row level security;
create policy "herkes okur" on public.sokaklar for select using (true);
grant select on public.sokaklar to anon, authenticated;
grant all on public.sokaklar to service_role;
drop table public.sokaklar_eski_silinecek;
