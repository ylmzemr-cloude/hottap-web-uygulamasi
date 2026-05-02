-- =====================================================================
-- Migration: Revize sistemi + PDF Storage entegrasyonu
-- Tarih: 2026-05-02
-- Açıklama:
--   1. calculations tablosuna revize_no, parent_id, revize_aciklama,
--      pdf_storage_path kolonları eklenir.
--   2. Supabase Storage 'pdfs' bucket'ı oluşturulur (private).
--   3. Storage RLS: kullanıcı kendi klasörünü görür, admin tümünü.
-- =====================================================================

-- ============================================================
-- 1. calculations tablosuna yeni kolonlar
-- ============================================================

ALTER TABLE public.calculations
  ADD COLUMN IF NOT EXISTS revize_no        integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id        uuid REFERENCES public.calculations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revize_aciklama  text,
  ADD COLUMN IF NOT EXISTS pdf_storage_path text;

-- parent_id üzerinde index (revize zinciri sorgularını hızlandırır)
CREATE INDEX IF NOT EXISTS idx_calculations_parent_id
  ON public.calculations(parent_id);

-- ============================================================
-- 2. Storage bucket oluştur
-- ============================================================
-- Bucket private (public=false) — herkes erişemez, RLS politikalarına bağlı

INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Storage RLS politikaları
-- ============================================================
-- Yol formatı: {user_id}/{calc_id}/v{revize_no}.pdf
-- Yolun ilk segmenti user_id olduğu için ona göre yetkilendirme yapıyoruz.

-- Önce mevcut politikaları temizle (idempotency için)
DROP POLICY IF EXISTS "pdfs_user_select"  ON storage.objects;
DROP POLICY IF EXISTS "pdfs_user_insert"  ON storage.objects;
DROP POLICY IF EXISTS "pdfs_user_update"  ON storage.objects;
DROP POLICY IF EXISTS "pdfs_user_delete"  ON storage.objects;
DROP POLICY IF EXISTS "pdfs_admin_all"    ON storage.objects;

-- Kullanıcı sadece kendi user_id klasörünü görür
CREATE POLICY "pdfs_user_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdfs_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdfs_user_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "pdfs_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin tüm PDF'lere erişebilir
CREATE POLICY "pdfs_admin_all"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'pdfs' AND public.is_admin()
  );

-- ============================================================
-- 4. Doğrulama (manuel kontrol için)
-- ============================================================
-- Yeni kolonları gör:
--   SELECT column_name, data_type, column_default, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'calculations';
--
-- Bucket'ı gör:
--   SELECT id, name, public FROM storage.buckets WHERE id = 'pdfs';
--
-- Storage politikalarını gör:
--   SELECT policyname, cmd FROM pg_policies
--   WHERE tablename = 'objects' AND policyname LIKE 'pdfs_%';
