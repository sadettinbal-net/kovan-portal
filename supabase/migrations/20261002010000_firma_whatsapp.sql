-- Firma WhatsApp bilgisi: numara (05xx...) veya WhatsApp linki (wa.me, api.whatsapp.com, whatsapp.com).
-- Sadece yeni, boş sütun ekler; mevcut veriler değişmez. Boş olan firmalarda buton mobil telefona yönlenir.
alter table public.firmalar
  add column if not exists whatsapp text;
