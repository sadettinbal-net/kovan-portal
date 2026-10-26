-- Birden çok paneli olan yan alanlarda (ör. detay sayfası sol: 2 panel) reklamın hangi panelde çıkacağı.
-- 0 = fark etmez (boş panele), 1 = üstteki panel, 2 = alttaki panel.
alter table public.reklamlar add column if not exists panel smallint not null default 0 check (panel between 0 and 2);
