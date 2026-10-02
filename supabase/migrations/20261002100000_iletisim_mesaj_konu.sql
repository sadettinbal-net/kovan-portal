-- İletişim mesajları: hangi sayfadan geldiği (reklam / genel) ve dışarıdan okunamaz.
alter table public.iletisim_mesajlari
  add column if not exists konu text not null default 'genel'
    check (konu in ('genel', 'reklam'));

-- Mesajlarda ad, telefon ve e-posta var: açık anahtarla okunamasın/yazılamasın
-- (RLS politikasına dokunulmaz; site mesajları sunucu üzerinden kaydeder ve okur).
revoke all on public.iletisim_mesajlari from anon, authenticated;
