# ByMEY HotTap Ölçüm Kartı

İGDAŞ HotTap operatörleri için saha hesaplama uygulaması.
HotTap, Stopple ve Tapalama operasyonları için ölçüm hesaplamalarını yapar.

## Hızlı Başlangıç (Kullanıcı)

1. Tarayıcıda uygulamayı aç
2. Hesabın yoksa **Kayıt Ol**'a tıkla
3. Yönetici onayını bekle (mail gelir)
4. Giriş yap ve hesaplamaya başla

Detaylı kullanım: [docs/user-guide.md](docs/user-guide.md)

## Kurulum (Geliştirici)

**Gereksinimler:**
- Supabase hesabı (ücretsiz)
- Resend hesabı (ücretsiz tier yeterli)
- GitHub hesabı (GitHub Pages için)

**Adımlar:**

```bash
# 1. Repoyu klonla
git clone https://github.com/kullanici/hottap-web-uygulamasi.git

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env dosyasını düzenle: SUPABASE_URL, SUPABASE_ANON_KEY, RESEND_API_KEY

# 3. Supabase'de veritabanını oluştur
# Supabase SQL Editor'da schema.sql içeriğini çalıştır

# 4. Edge Function deploy et
supabase functions deploy send-email

# 5. GitHub Pages aktif et
# Repo Settings → Pages → Branch: main / root
```

Admin hesabı kurulumu: [docs/admin-guide.md](docs/admin-guide.md)

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | Vanilla HTML + JavaScript + CSS |
| Hosting | GitHub Pages (ücretsiz) |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Mail | Resend API |
| PDF | html2pdf.js |
| Offline | PWA / Service Worker |

## Proje Yapısı

```
├── index.html          — Giriş/kayıt ekranı
├── app.html            — Ana uygulama (SPA)
├── js/
│   ├── formulas.js     — Tüm hesaplama formülleri (buradan güncelle)
│   ├── calculator.js   — Hesap yürütücüsü
│   ├── units.js        — Birim çevrim fonksiyonları
│   ├── validation.js   — Form doğrulama kuralları
│   ├── ui.js           — Arayüz mantığı
│   ├── pdf.js          — PDF oluşturma
│   ├── offline.js      — Offline/sync yönetimi
│   ├── tables.js       — Boru/cutter/yay tablo verileri
│   ├── auth.js         — Kimlik doğrulama
│   └── supabase.js     — Supabase istemcisi
├── css/
│   ├── main.css        — Ana tasarım
│   └── print.css       — Baskı stilleri
├── edge-functions/
│   └── send-email.ts   — Mail gönderme (Resend)
├── tests/              — Test dosyaları
├── docs/               — Kılavuzlar
├── schema.sql          — Veritabanı şeması
└── service-worker.js   — PWA offline desteği
```

## Formül Güncelleme

Hesaplama formülleri `js/formulas.js` dosyasında.
Değiştirmek için: [docs/formula-guide.md](docs/formula-guide.md)

## İletişim

M. Emre Yılmaz — ylmz.emr@gmail.com
