-- Kategoriler artık kod dosyalarında değil, bu tabloda tutulur.
-- tip: 'sanayi_sitesi' | 'sanayi_disi' | 'kurumsal'
-- ust_kategori_id boşsa ana kategori, doluysa o ana kategorinin alt kategorisi.
-- Bu dosya yalnızca YENİ şeyler ekler; mevcut hiçbir tabloyu, sütunu veya veriyi silmez/değiştirmez.
create table if not exists public.firma_kategorileri (
  id bigint generated always as identity primary key,
  ad text not null,
  tip text not null check (tip in ('sanayi_sitesi', 'sanayi_disi', 'kurumsal')),
  ust_kategori_id bigint references public.firma_kategorileri(id),
  sira integer not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- Aynı tipte, aynı ana kategori altında aynı ad iki kez olmasın (büyük/küçük harf farkı gözetmeden)
create unique index if not exists firma_kategorileri_ad_tekil
  on public.firma_kategorileri (tip, coalesce(ust_kategori_id, 0), lower(ad));
create index if not exists firma_kategorileri_ust_idx
  on public.firma_kategorileri (ust_kategori_id);

-- Herkes okuyabilir; yazma politikası yok, yani yazma sadece service role (sunucu) ile yapılır.
alter table public.firma_kategorileri enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'firma_kategorileri'
      and policyname = 'firma_kategorileri herkes okur'
  ) then
    create policy "firma_kategorileri herkes okur"
      on public.firma_kategorileri for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- Firmaları kategoriye bağla. Bağlantı varsayılan davranışıyla çalışır:
-- içinde firma veya alt kategori olan bir kategori veritabanı tarafından da silinemez.
alter table public.firmalar
  add column if not exists kategori_id bigint references public.firma_kategorileri(id),
  add column if not exists firma_tipi text check (firma_tipi in ('siteli', 'sitesiz', 'kurumsal'));
create index if not exists firmalar_kategori_id_idx on public.firmalar (kategori_id);

comment on column public.firmalar.kategori_id is 'firma_kategorileri tablosundaki kategori (sektor yazısının yerini alacak)';
comment on column public.firmalar.firma_tipi is 'siteli / sitesiz / kurumsal (kod zaten bu alanı kullanıyordu ama sütun yoktu)';
