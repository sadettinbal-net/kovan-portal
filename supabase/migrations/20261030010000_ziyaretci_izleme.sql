-- Ziyaretçi izleme: her ziyaret (tarayıcı sekmesi oturumu) bir satır; gezilen sayfalar ve tıklamalar ayrı tabloda.
-- Yalnızca sunucu (service role) okur/yazar; RLS açık, herkese açık kural yok.
create table if not exists public.ziyaretci_oturumlari (
  id uuid primary key,
  ip text,
  ulke text,
  bolge text,
  sehir text,
  cihaz text,
  isletim_sistemi text,
  tarayici text,
  ekran text,
  dil text,
  referrer text,
  giris_sayfasi text,
  baslangic timestamptz not null default now(),
  son_gorulme timestamptz not null default now(),
  sayfa_sayisi int not null default 0,
  tiklama_sayisi int not null default 0
);
create index if not exists ziyaretci_oturumlari_baslangic_idx on public.ziyaretci_oturumlari (baslangic desc);

create table if not exists public.ziyaretci_olaylari (
  id bigserial primary key,
  oturum_id uuid not null references public.ziyaretci_oturumlari (id) on delete cascade,
  tip text not null check (tip in ('sayfa', 'tiklama')),
  sayfa text,
  hedef text,
  baglanti text,
  created_at timestamptz not null default now()
);
create index if not exists ziyaretci_olaylari_oturum_idx on public.ziyaretci_olaylari (oturum_id, created_at);

alter table public.ziyaretci_oturumlari enable row level security;
alter table public.ziyaretci_olaylari enable row level security;

-- Tek çağrıda: oturumu (yoksa) açar, olayları ekler, son görülme zamanını ve sayaçları günceller.
create or replace function public.ziyaretci_kaydet(p_oturum uuid, p_bilgi jsonb, p_olaylar jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sayfa int := 0;
  v_tik int := 0;
  v_ilk text;
begin
  insert into ziyaretci_oturumlari as t (id, ip, ulke, bolge, sehir, cihaz, isletim_sistemi, tarayici, ekran, dil, referrer)
  values (
    p_oturum,
    left(p_bilgi->>'ip', 45), left(p_bilgi->>'ulke', 60), left(p_bilgi->>'bolge', 80), left(p_bilgi->>'sehir', 80),
    left(p_bilgi->>'cihaz', 20), left(p_bilgi->>'isletim_sistemi', 40), left(p_bilgi->>'tarayici', 40),
    left(p_bilgi->>'ekran', 20), left(p_bilgi->>'dil', 20), left(p_bilgi->>'referrer', 500)
  )
  -- Varsa boş kalan bilgileri tamamla (istekler sırasız ulaşabilir)
  on conflict (id) do update set
    ip = coalesce(t.ip, excluded.ip),
    ulke = coalesce(t.ulke, excluded.ulke),
    bolge = coalesce(t.bolge, excluded.bolge),
    sehir = coalesce(t.sehir, excluded.sehir),
    cihaz = coalesce(t.cihaz, excluded.cihaz),
    isletim_sistemi = coalesce(t.isletim_sistemi, excluded.isletim_sistemi),
    tarayici = coalesce(t.tarayici, excluded.tarayici),
    ekran = coalesce(t.ekran, excluded.ekran),
    dil = coalesce(t.dil, excluded.dil),
    referrer = coalesce(t.referrer, excluded.referrer)
  where p_bilgi <> '{}'::jsonb;

  with yeni as (
    insert into ziyaretci_olaylari (oturum_id, tip, sayfa, hedef, baglanti)
    select p_oturum, o.tip, left(o.sayfa, 500), left(o.hedef, 150), left(o.baglanti, 500)
    from (
      select * from jsonb_to_recordset(coalesce(p_olaylar, '[]'::jsonb)) as x(tip text, sayfa text, hedef text, baglanti text)
      limit 50
    ) o
    where o.tip in ('sayfa', 'tiklama')
    returning tip, sayfa, id
  )
  select count(*) filter (where tip = 'sayfa'), count(*) filter (where tip = 'tiklama'),
         (array_agg(sayfa order by id) filter (where tip = 'sayfa'))[1]
    into v_sayfa, v_tik, v_ilk
  from yeni;

  update ziyaretci_oturumlari
     set son_gorulme = now(),
         sayfa_sayisi = sayfa_sayisi + v_sayfa,
         tiklama_sayisi = tiklama_sayisi + v_tik,
         giris_sayfasi = coalesce(giris_sayfasi, v_ilk)
   where id = p_oturum;
end;
$$;

revoke all on function public.ziyaretci_kaydet(uuid, jsonb, jsonb) from public, anon, authenticated;
