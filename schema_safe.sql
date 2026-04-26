-- ByMEY HotTap — Güvenli Şema (tekrar çalıştırılabilir)

-- ============================================================
-- 1. TABLOLAR
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  ad_soyad      text NOT NULL,
  telefon       text,
  rol           text NOT NULL DEFAULT 'beklemede'
                  CHECK (rol IN ('admin', 'tam_kullanici', 'demo', 'beklemede')),
  onay_durumu   text NOT NULL DEFAULT 'beklemede'
                  CHECK (onay_durumu IN ('beklemede', 'onaylandi', 'reddedildi', 'silindi', 'pasif')),
  demo_kalan_hak integer DEFAULT NULL,
  created_at    timestamptz DEFAULT now(),
  son_giris     timestamptz
);

CREATE TABLE IF NOT EXISTS public.calculations (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid REFERENCES public.users(id) ON DELETE SET NULL,
  user_display_name    text NOT NULL,
  proje_no             text,
  operasyon_tarihi     date,
  sistem_kayit_zamani  timestamptz DEFAULT now(),
  konum_lat            decimal(10, 8),
  konum_lng            decimal(11, 8),
  operasyonlar         jsonb NOT NULL,
  resimler             text[] DEFAULT '{}',
  sync_durum           text DEFAULT 'synced'
                         CHECK (sync_durum IN ('synced', 'pending', 'error'))
);

CREATE TABLE IF NOT EXISTS public.pipe_data (
  id           serial PRIMARY KEY,
  pipe_od_inch decimal NOT NULL,
  pipe_od_mm   decimal NOT NULL,
  pipe_wall_mm decimal NOT NULL,
  pipe_id_mm   decimal NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cutter_data (
  id                  serial PRIMARY KEY,
  cutter_nominal_inch decimal NOT NULL,
  cutter_actual_mm    decimal NOT NULL
);

CREATE TABLE IF NOT EXISTS public.spring_data (
  id                 serial PRIMARY KEY,
  cutter_od_inch     decimal NOT NULL,
  spring_travel_inch decimal NOT NULL,
  spring_travel_mm   decimal NOT NULL
);

-- ============================================================
-- 2. ADMIN FONKSİYONU
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND rol = 'admin'
      AND onay_durumu = 'onaylandi'
  );
$$;

-- ============================================================
-- 3. RLS AKTİF ET
-- ============================================================

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipe_data     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutter_data   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spring_data   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLİTİKALARI SIFIRLA VE YENİDEN OLUŞTUR
-- ============================================================

DROP POLICY IF EXISTS "user_own_profile"             ON public.users;
DROP POLICY IF EXISTS "user_insert_own_profile"      ON public.users;
DROP POLICY IF EXISTS "admin_all_users"              ON public.users;
DROP POLICY IF EXISTS "user_own_calculations"        ON public.calculations;
DROP POLICY IF EXISTS "user_insert_calculations"     ON public.calculations;
DROP POLICY IF EXISTS "user_update_own_calculations" ON public.calculations;
DROP POLICY IF EXISTS "admin_all_calculations"       ON public.calculations;
DROP POLICY IF EXISTS "anyone_read_pipe_data"        ON public.pipe_data;
DROP POLICY IF EXISTS "admin_write_pipe_data"        ON public.pipe_data;
DROP POLICY IF EXISTS "anyone_read_cutter_data"      ON public.cutter_data;
DROP POLICY IF EXISTS "admin_write_cutter_data"      ON public.cutter_data;
DROP POLICY IF EXISTS "anyone_read_spring_data"      ON public.spring_data;
DROP POLICY IF EXISTS "admin_write_spring_data"      ON public.spring_data;

CREATE POLICY "user_own_profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "user_insert_own_profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_all_users"
  ON public.users FOR ALL
  USING (public.is_admin());

CREATE POLICY "user_own_calculations"
  ON public.calculations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_insert_calculations"
  ON public.calculations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_calculations"
  ON public.calculations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "admin_all_calculations"
  ON public.calculations FOR ALL
  USING (public.is_admin());

CREATE POLICY "anyone_read_pipe_data"
  ON public.pipe_data FOR SELECT
  USING (true);

CREATE POLICY "admin_write_pipe_data"
  ON public.pipe_data FOR ALL
  USING (public.is_admin());

CREATE POLICY "anyone_read_cutter_data"
  ON public.cutter_data FOR SELECT
  USING (true);

CREATE POLICY "admin_write_cutter_data"
  ON public.cutter_data FOR ALL
  USING (public.is_admin());

CREATE POLICY "anyone_read_spring_data"
  ON public.spring_data FOR SELECT
  USING (true);

CREATE POLICY "admin_write_spring_data"
  ON public.spring_data FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 5. SEED VERİLERİ (zaten varsa atla)
-- ============================================================

INSERT INTO public.pipe_data
  (pipe_od_inch, pipe_od_mm, pipe_wall_mm, pipe_id_mm)
VALUES
  (4,  114.3, 4.37, 105.56),
  (6,  168.3, 4.37, 159.56),
  (8,  219.1, 4.78, 209.54),
  (12, 323.8, 5.56, 312.68),
  (16, 406.4, 6.35, 393.70),
  (20, 508.0, 7.14, 493.72),
  (24, 609.6, 7.92, 593.76),
  (28, 711.2, 9.52, 692.16)
ON CONFLICT DO NOTHING;

INSERT INTO public.cutter_data
  (cutter_nominal_inch, cutter_actual_mm)
VALUES
  (4,  98),
  (6,  149),
  (8,  197),
  (10, 248),
  (12, 299),
  (14, 332),
  (16, 383),
  (18, 432),
  (20, 483),
  (22, 533),
  (24, 584),
  (26, 635),
  (28, 686),
  (30, 737),
  (32, 787),
  (34, 838),
  (36, 889),
  (38, 937),
  (40, 987),
  (42, 1038)
ON CONFLICT DO NOTHING;

INSERT INTO public.spring_data
  (cutter_od_inch, spring_travel_inch, spring_travel_mm)
VALUES
  (4,  0.750, 19.05),
  (6,  0.750, 19.05),
  (8,  0.750, 19.05),
  (10, 1.000, 25.40),
  (12, 1.000, 25.40)
ON CONFLICT DO NOTHING;
