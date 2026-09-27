-- RLS Migration - Supabase Dashboard'da zaten uygulanmıştır (2026-09-27)
-- Bu dosya sadece kayıt tutmak içindir

alter table public.dukkanlar enable row level security;
alter table public.ilceler enable row level security;
alter table public.mahalleler enable row level security;
alter table public.mahalleler_yeni enable row level security;
alter table public.sanayi_siteleri enable row level security;
alter table public.sokaklar enable row level security;

create policy "herkes okur" on public.dukkanlar for select using (true);
create policy "herkes okur" on public.mahalleler for select using (true);
create policy "herkes okur" on public.mahalleler_yeni for select using (true);
create policy "herkes okur" on public.sanayi_siteleri for select using (true);
create policy "herkes okur" on public.sokaklar for select using (true);
