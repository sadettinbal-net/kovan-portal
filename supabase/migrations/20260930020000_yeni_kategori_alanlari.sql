-- Firmalara yeni kategori bilgilerini ekle
alter table public.firmalar
add column if not exists yeni_kategori boolean default false,
add column if not exists yeni_kategori_tipi text;

comment on column public.firmalar.yeni_kategori is 'Bu firma yeni bir kategori önerdi mi?';
comment on column public.firmalar.yeni_kategori_tipi is 'Yeni kategorinin tipi: siteli veya sitesiz';
