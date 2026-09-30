-- Firmalara Google Plus Code (ör. "8GHC+2X Ümraniye") alanı
alter table public.firmalar
add column if not exists plus_code text;

comment on column public.firmalar.plus_code is 'Google Haritalar Plus Code';
