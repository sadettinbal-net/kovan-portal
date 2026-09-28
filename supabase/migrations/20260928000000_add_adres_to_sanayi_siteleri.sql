-- Sanayi sitelerine adres alanı eklendi (admin formu ve ana sayfa araması bu alanı kullanıyor)
alter table public.sanayi_siteleri add column if not exists adres text;
notify pgrst, 'reload schema';
