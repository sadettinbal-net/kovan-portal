-- Kart fotoğrafı (fotograf_url) yapay zekâ ile üretilmiş temsili görsel mi?
-- Sitede görselin sol altında "Temsili görsel" etiketi gösterilir. Firma gerçek fotoğrafını yüklerse yönetici panelinden false yapılır.
alter table public.firmalar add column if not exists temsili_gorsel boolean not null default true;
comment on column public.firmalar.temsili_gorsel is 'Kart fotoğrafı (fotograf_url) yapay zekâ ile üretilmiş temsili görsel mi? Firma gerçek fotoğrafını yüklerse yönetici false yapar.';
