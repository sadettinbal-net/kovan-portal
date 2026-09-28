-- Dükkanlar mahalleye bağlanabilsin (sokak isteğe bağlı, mahalle yeterli)
-- mahalle_id = mahalleler_yeni.mahalle_id (sokaklar.mahalle_id ile aynı numara)
alter table public.dukkanlar add column if not exists mahalle_id bigint;
create index if not exists dukkanlar_mahalle_id_idx on public.dukkanlar (mahalle_id);

-- Sokağı belli olan mevcut dükkanların mahallesini sokaktan doldur
update public.dukkanlar d set mahalle_id = s.mahalle_id
from (select distinct on (sokak_id) sokak_id, mahalle_id from public.sokaklar order by sokak_id) s
where d.sokak_id = s.sokak_id and d.mahalle_id is null;

notify pgrst, 'reload schema';
