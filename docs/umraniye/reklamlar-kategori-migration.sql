-- ÖZEL REKLAM — Kategori hedefleme + Popup alanı eklemesi
-- Supabase SQL Editor'da bir kez çalıştırın (reklamlar tablosu zaten oluşturulmuş olmalı)

-- 1) Kategori hedefleme kolonu (boş = genel / tüm kategoriler)
alter table public.reklamlar add column if not exists kategori text;

-- 2) Yeni "popup" alanını konum seçeneklerine ekle
alter table public.reklamlar drop constraint if exists reklamlar_konum_check;
alter table public.reklamlar
  add constraint reklamlar_konum_check
  check (konum in ('video', 'sidebar', 'popup'));
