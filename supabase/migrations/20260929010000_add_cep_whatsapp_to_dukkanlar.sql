-- Dükkanlara cep telefonu ve WhatsApp numarası
alter table public.dukkanlar add column if not exists cep_telefonu text;
alter table public.dukkanlar add column if not exists whatsapp text;
notify pgrst, 'reload schema';
