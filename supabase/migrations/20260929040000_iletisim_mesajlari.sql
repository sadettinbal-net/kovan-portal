-- İletişim sayfasından gelen mesajlar. Kayıt sunucuda tam yetkiyle yapılır, sadece yönetici okur.
create table if not exists public.iletisim_mesajlari (
  id bigint generated always as identity primary key,
  ad_soyad text not null,
  telefon text,
  eposta text,
  mesaj text not null,
  okundu boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.iletisim_mesajlari enable row level security;
