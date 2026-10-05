-- Kurumsal "SAĞLIK" kategorisindeki (ve alt kategorilerindeki) firmaların adı her zaman büyük harfle tutulur.
-- Kayıt hangi sayfadan gelirse gelsin (firma ekle, düzenle, admin, güncelleme onayı) veritabanında çevrilir.
-- Türkçe büyütme: önce i → İ, ı → I; kalan harfleri upper() çevirir ('Şifa' → 'ŞİFA').

create or replace function public.saglik_kategorisi_mi(p_kategori_id bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.firma_kategorileri k
    left join public.firma_kategorileri ust on ust.id = k.ust_kategori_id
    where k.id = p_kategori_id
      and (
        (k.ad = 'SAĞLIK' and k.tip = 'kurumsal' and k.ust_kategori_id is null)
        or (ust.ad = 'SAĞLIK' and ust.tip = 'kurumsal' and ust.ust_kategori_id is null)
      )
  );
$$;

create or replace function public.saglik_firma_ad_buyuk_harf()
returns trigger
language plpgsql
as $$
begin
  if new.ad is not null
     and (public.saglik_kategorisi_mi(new.kategori_id) or public.saglik_kategorisi_mi(new.alt_kategori_id)) then
    new.ad := upper(translate(new.ad, 'iı', 'İI'));
  end if;
  return new;
end;
$$;

drop trigger if exists saglik_firma_ad_buyuk_harf on public.firmalar;
create trigger saglik_firma_ad_buyuk_harf
  before insert or update of ad, kategori_id, alt_kategori_id on public.firmalar
  for each row execute function public.saglik_firma_ad_buyuk_harf();

-- Mevcut sağlık firmaları (tetikleyici adı çevirir)
update public.firmalar
set ad = ad
where public.saglik_kategorisi_mi(kategori_id) or public.saglik_kategorisi_mi(alt_kategori_id);
