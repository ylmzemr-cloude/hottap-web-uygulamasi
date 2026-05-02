-- ============================================================
-- Migration: Eksik boru boyutları + cutter et kalınlığı
-- Tarih: 2026-05-02
-- Supabase Dashboard > SQL Editor'dan çalıştır
-- ============================================================

-- 1. Eksik pipe boyutları (10, 14, 18, 22, 30 inç)
INSERT INTO public.pipe_data (pipe_od_inch, pipe_od_mm, pipe_wall_mm, pipe_id_mm)
VALUES
  (10,  254.00,  5.30, 243.00),
  (14,  355.60,  6.00, 349.70),
  (18,  457.20,  7.00, 450.20),
  (22,  558.80,  7.30, 544.20),
  (30,  762.00, 11.13, 739.40)
ON CONFLICT DO NOTHING;

-- 2. Cutter et kalınlığı kolonu ekle (cutter seçilince otomatik dolsun)
ALTER TABLE public.cutter_data
  ADD COLUMN IF NOT EXISTS cutter_wall_mm decimal;

-- 3. Cutter et kalınlıklarını güncelle
UPDATE public.cutter_data SET cutter_wall_mm =  9.5 WHERE cutter_nominal_inch =  4;
UPDATE public.cutter_data SET cutter_wall_mm =  9.5 WHERE cutter_nominal_inch =  6;
UPDATE public.cutter_data SET cutter_wall_mm =  9.5 WHERE cutter_nominal_inch =  8;
UPDATE public.cutter_data SET cutter_wall_mm =  9.5 WHERE cutter_nominal_inch = 10;
UPDATE public.cutter_data SET cutter_wall_mm =  8.0 WHERE cutter_nominal_inch = 12;
UPDATE public.cutter_data SET cutter_wall_mm =  8.0 WHERE cutter_nominal_inch = 14;
UPDATE public.cutter_data SET cutter_wall_mm =  8.5 WHERE cutter_nominal_inch = 16;
UPDATE public.cutter_data SET cutter_wall_mm =  8.5 WHERE cutter_nominal_inch = 18;
UPDATE public.cutter_data SET cutter_wall_mm =  9.0 WHERE cutter_nominal_inch = 20;
UPDATE public.cutter_data SET cutter_wall_mm =  9.0 WHERE cutter_nominal_inch = 22;
UPDATE public.cutter_data SET cutter_wall_mm =  9.0 WHERE cutter_nominal_inch = 24;
UPDATE public.cutter_data SET cutter_wall_mm =  9.0 WHERE cutter_nominal_inch = 26;
UPDATE public.cutter_data SET cutter_wall_mm = 11.0 WHERE cutter_nominal_inch = 28;
UPDATE public.cutter_data SET cutter_wall_mm = 13.0 WHERE cutter_nominal_inch = 30;
UPDATE public.cutter_data SET cutter_wall_mm = 13.0 WHERE cutter_nominal_inch = 32;
UPDATE public.cutter_data SET cutter_wall_mm = 14.0 WHERE cutter_nominal_inch = 34;
UPDATE public.cutter_data SET cutter_wall_mm = 15.0 WHERE cutter_nominal_inch = 36;
UPDATE public.cutter_data SET cutter_wall_mm = 16.0 WHERE cutter_nominal_inch = 38;
UPDATE public.cutter_data SET cutter_wall_mm = 18.0 WHERE cutter_nominal_inch = 40;
UPDATE public.cutter_data SET cutter_wall_mm = 20.0 WHERE cutter_nominal_inch = 42;
