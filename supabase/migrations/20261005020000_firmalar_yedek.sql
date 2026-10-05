-- Çift kayıt temizliğinde silinen firmaların yedeği (silinen satırın tamamı + hangi kayıtla birleştirildiği).
-- Sitede okunmaz; RLS açık, politika yok → sadece sunucu anahtarı erişir.
create table if not exists public.firmalar_yedek (
  like public.firmalar,
  yedek_tarihi timestamptz not null default now(),
  birlestirilen_id integer,
  yedek_nedeni text
);
alter table public.firmalar_yedek enable row level security;
