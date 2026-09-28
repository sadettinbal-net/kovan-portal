-- Site üyeleri (Supabase Auth hesaplarının profil bilgileri)
-- E-postayla üye olunca ad/soyad/telefon/cep üye olma formundan (user metadata) gelir,
-- Google ile girişte ad soyad Google hesabından alınır.
create table if not exists public.uyeler (
  id uuid primary key references auth.users (id) on delete cascade,
  ad text,
  soyad text,
  telefon text,
  cep_telefonu text,
  email text,
  giris_yontemi text,
  created_at timestamptz not null default now()
);

alter table public.uyeler enable row level security;

-- Üye sadece kendi bilgisini görebilir ve güncelleyebilir; admin paneli service role ile okur
create policy "uye kendi kaydini gorur" on public.uyeler
  for select to authenticated using ((select auth.uid()) = id);
create policy "uye kendi kaydini gunceller" on public.uyeler
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.yeni_uye_kaydi()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  tam_ad text := coalesce(meta->>'full_name', meta->>'name', '');
begin
  insert into public.uyeler (id, ad, soyad, telefon, cep_telefonu, email, giris_yontemi)
  values (
    new.id,
    coalesce(nullif(meta->>'ad', ''), nullif(regexp_replace(tam_ad, '\s+\S+$', ''), ''), nullif(tam_ad, '')),
    coalesce(nullif(meta->>'soyad', ''), case when tam_ad ~ '\s' then substring(tam_ad from '(\S+)$') end),
    nullif(meta->>'telefon', ''),
    nullif(meta->>'cep_telefonu', ''),
    new.email,
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists yeni_uye_kaydi on auth.users;
create trigger yeni_uye_kaydi
  after insert on auth.users
  for each row execute function public.yeni_uye_kaydi();

-- Fonksiyon sadece tetikleyiciden çalışsın, dışarıdan çağrılamasın
revoke execute on function public.yeni_uye_kaydi() from public, anon, authenticated;
