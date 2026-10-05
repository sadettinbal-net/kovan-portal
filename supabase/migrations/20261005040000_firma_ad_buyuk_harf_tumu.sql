-- Tüm firmaların adı büyük harfle tutulur (önceki kural sadece SAĞLIK kategorisi içindi).
-- Kayıt hangi sayfadan gelirse gelsin veritabanında çevrilir.
-- Türkçe büyütme: önce i → İ, ı → I; kalan harfleri upper() çevirir ('Cengiz usta' → 'CENGİZ USTA').

-- Değişen adların eski hali (geri almak gerekirse). RLS açık, politika yok → sadece sunucu anahtarı erişir.
create table if not exists public.firma_ad_yedek (
  firma_id integer not null,
  eski_ad text,
  yedek_tarihi timestamptz not null default now()
);
alter table public.firma_ad_yedek enable row level security;

insert into public.firma_ad_yedek (firma_id, eski_ad)
select id, ad from public.firmalar where ad is distinct from upper(translate(ad, 'iı', 'İI'));

create or replace function public.firma_ad_buyuk_harf()
returns trigger
language plpgsql
as $$
begin
  if new.ad is not null then
    new.ad := upper(translate(new.ad, 'iı', 'İI'));
  end if;
  return new;
end;
$$;

drop trigger if exists saglik_firma_ad_buyuk_harf on public.firmalar;
drop function if exists public.saglik_firma_ad_buyuk_harf();
drop function if exists public.saglik_kategorisi_mi(bigint);

drop trigger if exists firma_ad_buyuk_harf on public.firmalar;
create trigger firma_ad_buyuk_harf
  before insert or update of ad on public.firmalar
  for each row execute function public.firma_ad_buyuk_harf();

-- Mevcut firmalar (tetikleyici adı çevirir)
update public.firmalar set ad = ad where ad is distinct from upper(translate(ad, 'iı', 'İI'));
