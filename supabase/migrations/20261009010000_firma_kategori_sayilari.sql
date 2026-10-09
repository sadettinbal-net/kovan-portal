-- Sağ menüdeki (Sanayi Dışı / Kurumsal) kategori sayıları için tek sorgu.
-- Önceden firmalar tek tek çekilip sayılıyordu; Supabase 1000 satır sınırı yüzünden sayılar 1000'de kalıyordu.
-- Süzgeçler RightSidebarWrapper'daki ile aynı: onaylı, "(Firma..." taslakları hariç.

CREATE OR REPLACE FUNCTION public.firma_kategori_sayilari()
RETURNS TABLE (grup text, kategori_id bigint, sayi bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT g.grup, f.kategori_id::bigint, count(*)::bigint
  FROM firmalar f
  CROSS JOIN LATERAL (
    SELECT CASE
      WHEN f.firma_tipi = 'kurumsal' THEN 'kurumsal'
      WHEN f.firma_tipi = 'sitesiz'
        OR (f.firma_tipi IS NULL AND (f.sanayi_sitesi IS NULL OR f.sanayi_sitesi = '')) THEN 'sitesiz'
    END AS grup
  ) g
  WHERE f.onay_durumu = 'onaylandi'
    AND f.ad NOT ILIKE '(Firma%'
    AND g.grup IS NOT NULL
  GROUP BY g.grup, f.kategori_id;
$$;

GRANT EXECUTE ON FUNCTION public.firma_kategori_sayilari() TO anon, authenticated;
