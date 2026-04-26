-- ByMEY HotTap Ölçüm Kartı — Veritabanı Şeması
-- Supabase SQL Editor'da çalıştırılır.
-- Sırayla çalıştırın: tablolar → fonksiyon → RLS → seed verileri

-- ============================================================
-- 1. USERS TABLOSU
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

-- ============================================================
-- 2. CALCULATIONS TABLOSU
-- ============================================================

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

-- ============================================================
-- 3. TABLO VERİLERİ (pipe, cutter, spring)
-- ============================================================

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
-- 4. ADMIN KONTROL FONKSİYONU
-- Recursive RLS döngüsünü önlemek için SECURITY DEFINER kullanılır.
-- Bu fonksiyon RLS'yi atlayarak users tablosunu okuyabilir.
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
-- 5. RLS — ROW LEVEL SECURITY AKTİF ET
-- ============================================================

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipe_data     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutter_data   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spring_data   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLİTİKALARI — USERS
-- ============================================================

-- Kullanıcı kendi profilini okur
CREATE POLICY "user_own_profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

-- Kullanıcı kendi profilini oluşturur (registerUser sırasında)
CREATE POLICY "user_insert_own_profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- Admin tüm kullanıcıları yönetir
CREATE POLICY "admin_all_users"
  ON public.users FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 7. RLS POLİTİKALARI — CALCULATIONS
-- ============================================================

-- Kullanıcı kendi hesaplamalarını okur
CREATE POLICY "user_own_calculations"
  ON public.calculations FOR SELECT
  USING (user_id = auth.uid());

-- Kullanıcı yeni hesaplama ekler
CREATE POLICY "user_insert_calculations"
  ON public.calculations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Kullanıcı kendi hesaplamalarını günceller (offline sync)
CREATE POLICY "user_update_own_calculations"
  ON public.calculations FOR UPDATE
  USING (user_id = auth.uid());

-- Admin tüm hesaplamaları yönetir
CREATE POLICY "admin_all_calculations"
  ON public.calculations FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 8. RLS POLİTİKALARI — PIPE_DATA
-- ============================================================

-- Herkes okuyabilir
CREATE POLICY "anyone_read_pipe_data"
  ON public.pipe_data FOR SELECT
  USING (true);

-- Sadece admin yazar
CREATE POLICY "admin_write_pipe_data"
  ON public.pipe_data FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 9. RLS POLİTİKALARI — CUTTER_DATA
-- ============================================================

CREATE POLICY "anyone_read_cutter_data"
  ON public.cutter_data FOR SELECT
  USING (true);

CREATE POLICY "admin_write_cutter_data"
  ON public.cutter_data FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 10. RLS POLİTİKALARI — SPRING_DATA
-- ============================================================

CREATE POLICY "anyone_read_spring_data"
  ON public.spring_data FOR SELECT
  USING (true);

CREATE POLICY "admin_write_spring_data"
  ON public.spring_data FOR ALL
  USING (public.is_admin());

-- ============================================================
-- 11. SEED VERİLERİ — PIPE_DATA
-- Kaynak: PROJE.md Bölüm 8
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
  (28, 711.2, 9.52, 692.16);

-- ============================================================
-- 12. SEED VERİLERİ — CUTTER_DATA
-- Kaynak: PROJE.md Bölüm 8
-- ============================================================

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
  (42, 1038);

-- ============================================================
-- 13. SEED VERİLERİ — SPRING_DATA
-- Kaynak: PROJE.md Bölüm 8
-- Not: 12" üzeri cutter için yay baskısı kullanılmaz (F alanı devreye girer)
-- ============================================================

INSERT INTO public.spring_data
  (cutter_od_inch, spring_travel_inch, spring_travel_mm)
VALUES
  (4,  0.750, 19.05),
  (6,  0.750, 19.05),
  (8,  0.750, 19.05),
  (10, 1.000, 25.40),
  (12, 1.000, 25.40);

-- ============================================================
-- 14. İLK ADMİN KAYDI
-- Adımlar:
--   1. Supabase Dashboard → Authentication → Users → "Add user" ile
--      ylmz.emr@gmail.com hesabını oluşturun.
--   2. Hesap oluşturulunca users tablosuna otomatik kayıt gelir
--      (registerUser fonksiyonu çağrılmaz, auth trigger gerekebilir).
--      Alternatif: Aşağıdaki komutu SQL Editor'da çalıştırın:
--
-- UPDATE public.users
--   SET rol = 'admin', onay_durumu = 'onaylandi'
--   WHERE email = 'ylmz.emr@gmail.com';
-- ============================================================
