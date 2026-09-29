-- ============================================================
-- USERS TABLOSU - Google OAuth için
-- Supabase SQL Editor'da çalıştırın
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    google_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Indexler
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON public.users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- RLS (Row Level Security) - Kullanıcılar sadece kendi verilerini görebilir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Herkes kendi kaydını okuyabilir
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT
  USING (auth.uid()::text = google_id);

-- Admin service key ile tüm işlemler yapılabilir (kod tarafında)
DROP POLICY IF EXISTS "users_all_authenticated" ON public.users;
CREATE POLICY "users_all_authenticated"
  ON public.users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
