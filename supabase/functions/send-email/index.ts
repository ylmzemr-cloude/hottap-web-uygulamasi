// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "ylmz.emr@gmail.com";
const FROM_EMAIL = "onboarding@resend.dev";

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY tanimlanmamis.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: to, subject: subject, html: html }),
  });
  if (!res.ok) throw new Error("Resend hatasi: " + (await res.text()));
}

function formatTarih(iso) {
  return new Date(iso).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
}

function escHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ylmzemr-cloude.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.json();
  const tip = body.tip;
  const kullanici = body.kullanici;
  const hesaplama = body.hesaplama;
  const mesaj = body.mesaj;

  try {
    console.log("send-email called, tip:", tip, "RESEND_API_KEY set:", !!RESEND_API_KEY);
    if (tip === "yeni_kayit") {
      const tarih = kullanici && kullanici.kayit_zamani ? formatTarih(kullanici.kayit_zamani) : "-";
      const html = "<h2>Yeni Kullanici Kaydi</h2>"
        + "<p><b>Ad Soyad:</b> " + escHtml(kullanici.ad_soyad) + "</p>"
        + "<p><b>Email:</b> " + escHtml(kullanici.email) + "</p>"
        + "<p><b>Telefon:</b> " + escHtml(kullanici.telefon) + "</p>"
        + "<p><b>Kayit:</b> " + tarih + "</p>"
        + "<p><b>Tarayici:</b> " + escHtml(kullanici.tarayici) + "</p>"
        + "<p><a href='https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/app.html' style='background:#186F65;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;margin-top:8px;'>Admin Paneline Git</a></p>";
      await sendEmail(ADMIN_EMAIL, "Yeni kullanici kaydi: " + escHtml(kullanici.ad_soyad), html);

    } else if (tip === "yeni_hesaplama") {
      const html = "<h2>Yeni Hesaplama</h2>"
        + "<p><b>Proje No:</b> " + escHtml(hesaplama.proje_no) + "</p>"
        + "<p><b>Kullanici:</b> " + escHtml(hesaplama.kullanici_adi) + "</p>"
        + "<p><b>Tarih:</b> " + escHtml(hesaplama.operasyon_tarihi) + "</p>";
      await sendEmail(ADMIN_EMAIL, "Yeni hesaplama: " + escHtml(hesaplama.proje_no) + " - " + escHtml(hesaplama.kullanici_adi), html);

    } else if (tip === "onay_bildirimi") {
      const html = "<h2>Hesabiniz Onaylandi</h2>"
        + "<p>Sayin " + escHtml(kullanici.ad_soyad) + ", hesabiniz aktif. Giris yapabilirsiniz.</p>"
        + "<p>Iletisim: " + escHtml(ADMIN_EMAIL) + "</p>";
      await sendEmail(kullanici.email, "ByMEY HotTap - Hesabiniz onaylandi", html);

    } else if (tip === "red_bildirimi") {
      const html = "<h2>Hesap Basvurusu</h2>"
        + "<p>Sayin " + escHtml(kullanici.ad_soyad) + ", basvurunuz uygun bulunamamistir.</p>"
        + "<p>Bilgi icin: " + escHtml(ADMIN_EMAIL) + "</p>";
      await sendEmail(kullanici.email, "ByMEY HotTap - Hesap basvurusu", html);

    } else if (tip === "yeni_revize") {
      const html = "<h2>Hesaplama Revize Edildi</h2>"
        + "<p><b>Proje No:</b> " + escHtml(hesaplama.proje_no) + "</p>"
        + "<p><b>Kullanici:</b> " + escHtml(hesaplama.kullanici_adi) + "</p>"
        + "<p><b>Tarih:</b> " + escHtml(hesaplama.operasyon_tarihi) + "</p>"
        + "<p><b>Revize No:</b> " + escHtml(hesaplama.revize_no) + "</p>"
        + (hesaplama.revize_aciklama ? "<p><b>Aciklama:</b> " + escHtml(hesaplama.revize_aciklama) + "</p>" : "");
      await sendEmail(ADMIN_EMAIL, "Revize R" + escHtml(hesaplama.revize_no) + ": " + escHtml(hesaplama.proje_no) + " - " + escHtml(hesaplama.kullanici_adi), html);

    } else if (tip === "yonetici_mesaj") {
      const html = "<h2>Kullanici Mesaji</h2>"
        + "<p><b>Gonderen:</b> " + escHtml(kullanici.ad_soyad) + " (" + escHtml(kullanici.email) + ")</p>"
        + "<p>" + escHtml(mesaj) + "</p>";
      await sendEmail(ADMIN_EMAIL, escHtml(kullanici.ad_soyad) + " - Uygulama Mesaji", html);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-email error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
