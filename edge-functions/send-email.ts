// Supabase Edge Function — send-email
// Resend API ile mail gönderir. RESEND_API_KEY bu fonksiyonun ortam değişkeninde tutulur,
// asla client koduna sızmaz.
//
// Deploy: supabase functions deploy send-email
// Ortam değişkeni: supabase secrets set RESEND_API_KEY=re_xxxx

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'ylmz.emr@gmail.com'
// FROM_EMAIL: Resend'de doğrulanmış bir domain adresi olmalı.
// Henüz domain yoksa Resend'in test adresini kullanın: onboarding@resend.dev
const FROM_EMAIL = 'noreply@bymey.com'

type EmailTip =
  | 'yeni_kayit'
  | 'yeni_hesaplama'
  | 'onay_bildirimi'
  | 'red_bildirimi'
  | 'yonetici_mesaj'

interface EmailRequest {
  tip: EmailTip
  kullanici?: Record<string, string>
  hesaplama?: Record<string, unknown>
  mesaj?: string
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY ortam değişkeni tanımlanmamış.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })

  if (!response.ok) {
    const hata = await response.text()
    throw new Error(`Resend API hatası (${response.status}): ${hata}`)
  }
}

function formatTarih(isoString: string): string {
  return new Date(isoString).toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

serve(async (req: Request) => {
  // CORS kontrolü (Supabase Edge Functions gerektirir)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  let body: EmailRequest
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Geçersiz JSON gövdesi.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { tip, kullanici, hesaplama, mesaj } = body

  try {
    switch (tip) {

      // 1. Yeni kullanıcı kaydı → admin'e bildirim
      case 'yeni_kayit': {
        const tarih = kullanici?.kayit_zamani ? formatTarih(kullanici.kayit_zamani) : '-'
        await sendEmail(
          ADMIN_EMAIL,
          `Yeni kullanıcı kaydı: ${kullanici?.ad_soyad ?? ''}`,
          `
            <h2 style="color:#1e40af;">Yeni Kullanıcı Kaydı</h2>
            <table style="border-collapse:collapse;width:100%;max-width:500px;">
              <tr><td style="padding:6px 0;font-weight:bold;">Ad Soyad:</td><td>${kullanici?.ad_soyad ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Email:</td><td>${kullanici?.email ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Telefon:</td><td>${kullanici?.telefon ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Kayıt Tarihi/Saati:</td><td>${tarih}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Cihaz/Tarayıcı:</td><td style="font-size:12px;color:#64748b;">${kullanici?.tarayici ?? '-'}</td></tr>
            </table>
            <hr style="margin:16px 0;">
            <p>Onaylamak veya reddetmek için admin paneline giriş yapın.</p>
          `
        )
        break
      }

      // 2. Yeni hesaplama kaydı → admin'e bildirim
      case 'yeni_hesaplama': {
        const kayitZamani = hesaplama?.sistem_kayit_zamani
          ? formatTarih(String(hesaplama.sistem_kayit_zamani))
          : '-'
        await sendEmail(
          ADMIN_EMAIL,
          `Yeni hesaplama: ${hesaplama?.proje_no ?? '-'} — ${hesaplama?.kullanici_adi ?? ''}`,
          `
            <h2 style="color:#1e40af;">Yeni Hesaplama Kaydedildi</h2>
            <table style="border-collapse:collapse;width:100%;max-width:500px;">
              <tr><td style="padding:6px 0;font-weight:bold;">Proje No:</td><td>${hesaplama?.proje_no ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Kullanıcı:</td><td>${hesaplama?.kullanici_adi ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Operasyon Tarihi:</td><td>${hesaplama?.operasyon_tarihi ?? '-'}</td></tr>
              <tr><td style="padding:6px 0;font-weight:bold;">Kayıt Zamanı:</td><td>${kayitZamani}</td></tr>
            </table>
            <hr style="margin:16px 0;">
            <p>Detaylar ve PDF için admin panelini kontrol edin.</p>
          `
        )
        break
      }

      // 3. Kullanıcı onaylandı → kullanıcıya bildirim
      case 'onay_bildirimi': {
        await sendEmail(
          kullanici?.email ?? '',
          'ByMEY HotTap — Hesabınız onaylandı',
          `
            <h2 style="color:#16a34a;">Hesabınız Onaylandı</h2>
            <p>Sayın ${kullanici?.ad_soyad ?? 'Kullanıcı'},</p>
            <p>
              ByMEY HotTap Ölçüm Kartı hesabınız onaylanmıştır.
              Artık sisteme giriş yapabilirsiniz.
            </p>
            <p>Sorularınız için: <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p>
            <hr style="margin:16px 0;">
            <p style="color:#64748b;font-size:12px;">ByMEY HotTap Ölçüm Kartı — İGDAŞ</p>
          `
        )
        break
      }

      // 4. Kullanıcı reddedildi → kullanıcıya bildirim
      case 'red_bildirimi': {
        await sendEmail(
          kullanici?.email ?? '',
          'ByMEY HotTap — Hesap başvurusu hakkında',
          `
            <h2 style="color:#dc2626;">Hesap Başvurusu</h2>
            <p>Sayın ${kullanici?.ad_soyad ?? 'Kullanıcı'},</p>
            <p>
              ByMEY HotTap Ölçüm Kartı hesap başvurunuz şu an için uygun bulunamamıştır.
            </p>
            <p>
              Daha fazla bilgi için lütfen yöneticinizle iletişime geçin:
              <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>
            </p>
            <hr style="margin:16px 0;">
            <p style="color:#64748b;font-size:12px;">ByMEY HotTap Ölçüm Kartı — İGDAŞ</p>
          `
        )
        break
      }

      // 5. Kullanıcı → yöneticiye mesaj
      case 'yonetici_mesaj': {
        await sendEmail(
          ADMIN_EMAIL,
          `${kullanici?.ad_soyad ?? 'Kullanıcı'} — Uygulama Mesajı`,
          `
            <h2 style="color:#1e40af;">Kullanıcı Mesajı</h2>
            <p><b>Gönderen:</b> ${kullanici?.ad_soyad ?? '-'} (${kullanici?.email ?? '-'})</p>
            <hr style="margin:16px 0;">
            <p style="white-space:pre-line;">${mesaj ?? ''}</p>
          `
        )
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: `Geçersiz tip: ${tip}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const mesajHata = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return new Response(
      JSON.stringify({ error: mesajHata }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
