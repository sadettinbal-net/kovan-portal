-- Firma adını karşılaştırma için sadeleştirir: Türkçe harfler düz harfe, küçük harf, noktalama ve
-- şirket türü ekleri (Ltd. Şti., A.Ş., San. ve Tic. ...) atılır.
-- Örnek: 'Yılmaz Oto San. ve Tic. Ltd. Şti.' → 'yilmaz oto'
-- Noktalar boşluğa değil hiçliğe çevrilir ki 'A.Ş.' → 'as', 'Ltd.Şti.' → 'ltdsti' tek kelime olarak yakalansın.
create or replace function public.normalize_ad(p_ad text)
returns text
language sql
immutable
parallel safe
as $$
  select btrim(regexp_replace(
    regexp_replace(
      ' ' || regexp_replace(
        replace(lower(translate(coalesce(p_ad, ''), 'İIıŞşĞğÜüÖöÇçÂâÎîÛû', 'iiissgguuooccaaiiuu')), '.', ''),
        '[^a-z0-9]+', ' ', 'g'
      ) || ' ',
      '\m(ltd|sti|ltdsti|as|san|tic|ve|limited|sirketi|sirket|sanayi|ticaret|anonim)\M', ' ', 'g'
    ),
    '\s+', ' ', 'g'
  ));
$$;
