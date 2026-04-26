# Değişiklik Geçmişi

## [v1.0.0] — 2026-04-26

İlk kararlı sürüm. Tüm fazlar tamamlandı.

### Eklendi

**Backend (Faz 1)**
- Supabase şema: `profiles`, `calculations`, `pipe_data`, `cutter_data`, `spring_data` tabloları
- RLS politikaları: kullanıcı kendi verisini, admin hepsini görür
- 11 auth fonksiyonu: kayıt, giriş, çıkış, şifre sıfırlama, profil güncelleme
- Edge Function: 5 farklı mail tetikleyicisi (Resend entegrasyonu)

**Giriş/Kayıt UI (Faz 2)**
- Login + kayıt ekranı (`index.html`)
- Responsive, mobile-first tasarım

**Hesaplama Motoru (Faz 3)**
- 14 formül: C1, C, E, CouponFree, PilotTemas, MaxTapping, MaxTravel, StoppleÖlçüsü, TekerBoruMerkezi, TekerTemasMesafesi, Tapalama, DelmeSüresi, GeriAlma, CutterID
- Birim çevrim: inç↔mm, 10 ondalık floating point koruması
- Validasyon kuralları: zorunlu alan, pozitif sayı, cutter boyut kontrolü, tablo varlık kontrolü

**Ana Uygulama UI (Faz 4)**
- Tam SPA yapısı: proje bilgileri → veri girişi → hesaplama → kayıt akışı
- 4 operasyon türü: HotTap, Stopple, Tapalama, KKM/GeriAlma
- (?) yardım ikonları + modal açıklamalar
- Demo rozeti, kalan hak göstergesi

**PDF & Kayıt (Faz 5)**
- html2pdf.js ile Türkçe karakter destekli PDF
- Fotoğraf ekleme (max 5 adet, base64 inline)
- Supabase'e kayıt + admin mail bildirimi

**Offline / PWA (Faz 6)**
- Service Worker: uygulama dosyaları cache-first, API network-first
- Pending kuyruk: internet yokken LocalStorage'a yaz, gelince senkronize et
- Bağlantı durum göstergesi (📡 Çevrimdışı / 🟢 Çevrimiçi)

**Admin Paneli (Faz 7)**
- Bekleyen başvurular: Tam / Demo / Reddet aksiyonları
- Kullanıcı listesi: filtre (Tümü/Aktif/Demo/Beklemede/Pasif/Silindi), aksiyon butonları
- Hesaplama geçmişi: canlı arama, 📍 konum linki, PDF indirme
- Tablo yönetimi: CSV export/import (boru, cutter, yay)

**Test (Faz 9)**
- `tests/formulas.test.js` — 14 formül, bilinen değerlerle karşılaştırma
- `tests/units.test.js` — inç↔mm çevrim + round-trip tutarlılık
- `tests/validation.test.js` — kural testleri + validateOperation akışı
- `tests/integration.test.js` — demo limit simülasyonu, hesap zinciri
- `tests/offline.test.js` — offline kayıt, sync, cache erişimi
- `tests/run-tests.js` — tek komutla tüm testleri çalıştır

**Dokümantasyon (Faz 10)**
- `docs/user-guide.md` — kullanıcı kılavuzu
- `docs/admin-guide.md` — admin kılavuzu
- `docs/formula-guide.md` — formül güncelleme rehberi
- `README.md` — proje tanımı ve kurulum
- `CHANGELOG.md` — bu dosya
