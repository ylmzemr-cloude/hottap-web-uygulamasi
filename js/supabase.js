// Supabase istemci başlatma
// Gerçek URL ve key değerleri index.html'de window.__env ile inject edilir.
// Örnek (index.html'de <script> içinde):
//   window.__env = { SUPABASE_URL: '...', SUPABASE_ANON_KEY: '...' }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = window.__env?.SUPABASE_URL
const SUPABASE_ANON_KEY = window.__env?.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Supabase yapılandırması eksik. index.html içinde window.__env tanımlandığından emin olun.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
