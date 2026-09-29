-- Firma başvuruları (üyenin "Firma Ekle" formu). Yönetici onaylayınca dukkanlar tablosuna aktarılır.
-- mahalle_id = mahalleler_yeni.mahalle_id, sokak_id = sokaklar.sokak_id (dukkanlar tablosu gibi)
create table if not exists public.firma_talepleri (
  id serial primary key,
  kullanici_id uuid not null references auth.users(id) on delete cascade,
  dukkan_adi varchar(255) not null,
  usta_adi varchar(255),
  telefon varchar(50),
  cep_telefonu varchar(50),
  whatsapp varchar(50),
  site_id integer references public.sanayi_siteleri(id) on delete set null,
  mahalle_id bigint,
  sokak_id integer,
  blok_no varchar(50),
  adres text,
  web_sitesi varchar(255),
  hizmetler text,
  kart_resmi text,
  fotograflar text[] not null default '{}',
  alt_kategori_id integer references public.alt_kategoriler(id) on delete set null,
  durum varchar(20) default 'beklemede' check (durum in ('beklemede', 'onaylandi', 'reddedildi')),
  yonetici_notu text,
  olusturulma_tarihi timestamp default now(),
  guncelleme_tarihi timestamp default now(),
  onaylayan_admin_id uuid references auth.users(id) on delete set null,
  onay_tarihi timestamp
);

create index if not exists idx_firma_talepleri_kullanici on public.firma_talepleri(kullanici_id);
create index if not exists idx_firma_talepleri_durum on public.firma_talepleri(durum);

-- Kayıt ve onay sunucuda tam yetkiyle yapılır; üye sadece kendi başvurularını görebilir
alter table public.firma_talepleri enable row level security;
create policy "uye kendi taleplerini gorur" on public.firma_talepleri
  for select to authenticated using ((select auth.uid()) = kullanici_id);

-- Firmada adres, sunulan hizmetler, kart resmi ve detay fotoğrafları
alter table public.dukkanlar add column if not exists adres text;
alter table public.dukkanlar add column if not exists hizmetler text;
alter table public.dukkanlar add column if not exists kart_resmi text;
alter table public.dukkanlar add column if not exists fotograflar text[] not null default '{}';

-- Firma resimleri için herkese açık depo (her dosya en fazla 5MB, sadece resim)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('firma-resimleri', 'firma-resimleri', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Üye sadece kendi klasörüne (kullanıcı id'si) resim yükleyebilir
create policy "uye kendi klasorune firma resmi yukler" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'firma-resimleri' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
