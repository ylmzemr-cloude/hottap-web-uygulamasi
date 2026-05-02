-- ============================================================
-- Migration: app_settings tablosu — sonuç görünüm ayarları
-- Tarih: 2026-05-02
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_read_settings"  ON public.app_settings;
DROP POLICY IF EXISTS "admin_write_settings"  ON public.app_settings;

CREATE POLICY "anyone_read_settings"
  ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "admin_write_settings"
  ON public.app_settings FOR ALL USING (public.is_admin());

-- Varsayılan: tüm alanlar görünür
INSERT INTO public.app_settings (key, value) VALUES (
  'result_visibility',
  '{
    "hottap": {
      "summary": ["pipeOd","cutterOd","cutterWall","a","b","ref1"],
      "results": ["cutterID","c1","c","couponFree","catchPosition","nestingSpace","pilotTemas","maxTapping","maxTravel"]
    },
    "stopple": {
      "summary": ["linkedHottap","pipeOd","d","ref2"],
      "results": ["e","stoppleOlcusu","tekerBoruMerkezi","tekerTemasMesafesi"]
    },
    "tapalama": {
      "summary": ["cutterOd","g","h","y","f"],
      "results": ["tapalama","delmeSuresi"]
    },
    "geri-alma": {
      "summary": ["cutterOd","m","n","yay"],
      "results": ["geriAlmaToplam"]
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;
