-- Cep numarası doğrulaması SMS yerine WhatsApp ile: işletme sahibi bu kodu sitenin WhatsApp hattına
-- kendi numarasından gönderir; yönetici panelde kodu ve gelen mesajın numarasını karşılaştırıp onaylar.
-- (SMS için açılan kod_ozet / kod_gecerlilik / kod_deneme / kod_gonderim sütunları artık kullanılmıyor.)
alter table public.telefon_talepleri add column if not exists dogrulama_kodu text;
