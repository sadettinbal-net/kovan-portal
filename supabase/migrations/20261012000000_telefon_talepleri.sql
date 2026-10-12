-- Telefon talepleri: işletme sahibi, telefonu olmayan firmasının detay sayfasından numara ekler.
-- Akış: Google ile giriş → numara + KVKK onayı → cep ise SMS kodu, sabit ise e-postadaki bağlantı
--       → yönetici panelinde onay → numara firma kartında görünür.
-- Tablo dışarıya kapalı (RLS açık, politika yok, anon/authenticated yetkisi yok); tüm işlemler sunucudan.

create table if not exists public.telefon_talepleri (
  id               bigserial primary key,
  firma_id         integer not null references public.firmalar(id) on delete cascade,
  kullanici_email  text not null,                       -- Google hesabının e-postası (firmanın e-posta alanına da yazılır)
  ad_soyad         text,
  telefon          text not null,                       -- 0XXXXXXXXXX
  tur              text not null check (tur in ('cep', 'sabit')),
  durum            text not null default 'dogrulama_bekliyor'
                   check (durum in ('dogrulama_bekliyor', 'onay_bekliyor', 'onaylandi', 'reddedildi', 'iptal')),
  -- Cep: SMS kodu (sadece özeti saklanır)
  kod_ozet         text,
  kod_gecerlilik   timestamptz,
  kod_deneme       integer not null default 0,
  kod_gonderim     integer not null default 0,
  -- Sabit: e-postadaki onay bağlantısı (sadece özeti saklanır)
  eposta_token_ozet text,
  dogrulandi_at    timestamptz,
  -- KVKK: kişinin aydınlatma metnini hangi sürümüyle, ne zaman onayladığı
  kvkk_onay_at     timestamptz not null,
  kvkk_surum       text not null,
  ip               text,
  -- Yönetici kararı
  karar_at         timestamptz,
  karar_veren      text,
  red_nedeni       text,
  onceki_degerler  jsonb,                               -- onayda değişen firma alanlarının eski hali (geri almak için)
  created_at       timestamptz not null default now()
);

create index if not exists telefon_talepleri_durum_idx on public.telefon_talepleri (durum, created_at desc);
create index if not exists telefon_talepleri_firma_idx on public.telefon_talepleri (firma_id);
create index if not exists telefon_talepleri_email_idx on public.telefon_talepleri (kullanici_email, created_at desc);
create index if not exists telefon_talepleri_telefon_idx on public.telefon_talepleri (telefon, created_at desc);

alter table public.telefon_talepleri enable row level security;
revoke all on public.telefon_talepleri from anon, authenticated;
revoke all on sequence public.telefon_talepleri_id_seq from anon, authenticated;
