# AGENTS.md — Ortak Ajan Kuralları

> Bu dosya tüm ajanlar tarafından okunur.
> Her ajan kendi özel dosyasını (`agents/*.md`) ayrıca okur.
> Buradaki kurallar kesindir, ajan özel dosyalarıyla çelişirse bu dosya önceliklidir.

**Proje:** ByMEY HotTap Ölçüm Kartı
**Versiyon:** 1.0
**Tarih:** 25 Nisan 2026

---

## İçindekiler

1. [Ajan Sistemi Genel Bakış](#1-ajan-sistemi-genel-bakış)
2. [İletişim ve Koordinasyon Kuralları](#2-iletişim-ve-koordinasyon-kuralları)
3. [Dosya Sahipliği ve Sınırlar](#3-dosya-sahipliği-ve-sınırlar)
4. [Kod Yazım Standartları](#4-kod-yazım-standartları)
5. [Kritik Teknik Kararlar](#5-kritik-teknik-kararlar)
6. [Güvenlik Kuralları](#6-güvenlik-kuralları)
7. [Hata Yönetimi ve Raporlama](#7-hata-yönetimi-ve-raporlama)
8. [Test Zorunlulukları](#8-test-zorunlulukları)
9. [Değişiklik Kayıt Formatı](#9-değişiklik-kayıt-formatı)
10. [Proje Referans Verileri](#10-proje-referans-verileri)

---

## 1. Ajan Sistemi Genel Bakış

### Ajan Listesi

| Ajan | Dosya | Birincil Sorumluluk |
|---|---|---|
| **Ana Ajan** | — | Koordinasyon, görev dağıtımı, kullanıcı iletişimi |
| **Backend Ajan** | `agents/backend.md` | Supabase, Auth, Edge Functions, Mail |
| **Hesaplama Ajan** | `agents/calculator.md` | Formüller, birim çevrimi, validasyon |
| **UI/UX Ajan** | `agents/ui.md` | Arayüz, tasarım, PWA, offline UI |
| **Test Ajan** | `agents/test.md` | Test, edge case, bug raporu |
| **Dokümantasyon Ajan** | `agents/docs.md` | README, kılavuzlar, kod yorumları |

### Ana Ajan'ın Rolü
- Kullanıcıyla (M. Emre Yılmaz) doğrudan konuşur
- Görevleri alt ajanlara dağıtır
- Alt ajanlardan gelen raporları toplar, kullanıcıya özetler
- Çakışma veya çelişki durumunda karar verir
- Hiçbir dosyayı doğrudan yazmaz — sadece koordine eder

---

## 2. İletişim ve Koordinasyon Kuralları

### Görev Alma Kuralı
Her ajan göreve başlamadan önce şunu doğrular:
1. `PROJE.md` okundu mu?
2. `AGENTS.md` okundu mu?
3. Kendi `agents/*.md` dosyası okundu mu?
4. Görev tanımı net mi? Net değilse → Ana Ajan'a sor, varsayım yapma.

### Çakışma Kuralı
Bir ajan, başka ajanın sorumluluk alanına giren bir şey yapmak zorunda kalırsa:
```
1. Dur
2. Ana Ajan'a bildir:
   "Bu görev [UI/UX Ajan] sorumluluk alanına giriyor.
    Devam etmemi mi, yoksa [UI/UX Ajan]'a devredilsin mi?"
3. Ana Ajan kararını bekle
4. İzin gelince devam et
```

### Bloklayıcı Kural
Bir ajan takıldığında veya ilerleyemediğinde:
```
1. Durumu ve nedenini Ana Ajan'a bildir
2. Geçici çözüm (workaround) öner
3. Ana Ajan onaylamadan geçici çözümü uygulama
```

### Rapor Formatı
Her ajan tamamladığı görevi şu formatta raporlar:
```
GÖREV RAPORU
Ajan: [Ajan adı]
Görev: [Ne yapıldı]
Durum: ✓ Tamamlandı / ⚠ Kısmi / ✗ Başarısız
Dosyalar: [Hangi dosyalar değişti]
Test: [Test edildi mi?]
Not: [Varsa önemli bilgi]
```

---

## 3. Dosya Sahipliği ve Sınırlar

### Kesin Kurallar
- Her ajan **sadece kendi sorumluluk alanındaki** dosyaları yazar/düzenler
- Başka ajanın dosyasına müdahale → Ana Ajan'a sor
- Ortak dosyalar (`AGENTS.md`, `PROJE.md`) → hiçbir ajan değiştiremez, sadece Ana Ajan onayıyla

### Dosya Sahiplik Haritası

| Dosya/Klasör | Sahibi | Diğerleri |
|---|---|---|
| `js/formulas.js` | Hesaplama | Okuyabilir, yazamaz |
| `js/units.js` | Hesaplama | Okuyabilir, yazamaz |
| `js/validation.js` | Hesaplama | Okuyabilir, yazamaz |
| `js/calculator.js` | Hesaplama | Okuyabilir, yazamaz |
| `js/auth.js` | Backend | Okuyabilir, yazamaz |
| `js/supabase.js` | Backend | Okuyabilir, yazamaz |
| `edge-functions/*` | Backend | Okuyabilir, yazamaz |
| `schema.sql` | Backend | Okuyabilir, yazamaz |
| `*.html` | UI/UX | Okuyabilir, yazamaz |
| `css/*` | UI/UX | Okuyabilir, yazamaz |
| `js/ui.js` | UI/UX | Okuyabilir, yazamaz |
| `js/offline.js` | UI/UX | Okuyabilir, yazamaz |
| `js/pdf.js` | UI/UX | Okuyabilir, yazamaz |
| `manifest.json` | UI/UX | Okuyabilir, yazamaz |
| `service-worker.js` | UI/UX | Okuyabilir, yazamaz |
| `public/images/help/*` | UI/UX | Okuyabilir, yazamaz |
| `data/help-texts.json` | UI/UX | Okuyabilir, yazamaz |
| `tests/*` | Test | Okuyabilir, yazamaz |
| `README.md` | Dokümantasyon | Okuyabilir, yazamaz |
| `CHANGELOG.md` | Dokümantasyon | Okuyabilir, yazamaz |
| `PROJE.md` | ❌ Kimse | Sadece referans — değiştirilemez |
| `AGENTS.md` | ❌ Kimse | Sadece referans — değiştirilemez |
| `agents/*.md` | ❌ Kimse | Sadece referans — değiştirilemez |

---

## 4. Kod Yazım Standartları

Bu standartlar tüm ajanlar için geçerlidir. İstisna yoktur.

### Dil Kuralı
```
Arayüz metinleri    → TÜRKÇE
Kod (değişken, fonksiyon, class, yorum) → İNGİLİZCE
Hata mesajları (kullanıcıya) → TÜRKÇE
Hata mesajları (console/log) → İNGİLİZCE
```

### Değişken İsimlendirme
```javascript
// Değişkenler: camelCase
const pipeOdInch = 12;
const cutterWallMm = 5.0;

// Sabitler: SCREAMING_SNAKE_CASE
const INCH_TO_MM = 25.4;
const MAX_DEMO_CALCULATIONS = 5;

// Fonksiyonlar: camelCase, eylem ile başla
function calculateC1(pipeOD, pipeID, cutterOD) { ... }
function validateInputs(formData) { ... }
function fetchPipeData(odValue) { ... }

// CSS sınıfları: kebab-case
.result-card { }
.input-field--error { }
.btn--primary { }

// Supabase tablo/sütun: snake_case
pipe_od_inch
cutter_actual_mm
```

### Sayı Hassasiyeti
```javascript
// Tüm sonuçlar 3 ondalık basamak
result.toFixed(3)

// Floating point hatalarını önle
parseFloat(value.toFixed(10))

// YANLIŞ:
const result = 0.1 + 0.2;  // 0.30000000000000004

// DOĞRU:
const result = parseFloat((0.1 + 0.2).toFixed(10));
```

### Yorum Yazma
```javascript
// Kısa açıklama için tek satır
const c1 = calculateC1(...); // Temas hesaplaması

/**
 * Fonksiyon açıklaması için JSDoc
 * @param {number} pipeOD - Pipe outer diameter in mm
 * @param {number} pipeID - Pipe inner diameter in mm
 * @param {number} cutterOD - Cutter actual OD in mm
 * @returns {number} C1 value in mm
 */
function calculateC1(pipeOD, pipeID, cutterOD) { ... }
```

### Dosya Başlığı
Her dosyanın başında:
```javascript
/**
 * @file formulas.js
 * @description All calculation formulas for HotTap operations
 * @owner Calculator Agent
 * @lastModified 2026-04-25
 */
```

---

## 5. Kritik Teknik Kararlar

Bu kararlar değiştirilemez. Ajan kendi görüşü farklı olsa bile uymak zorundadır.
Değişiklik için → Ana Ajan'a rapor et → Kullanıcı onayı gerekli.

### PDF Kütüphanesi
```
KULLANILACAK: html2pdf.js
KULLANILMAYACAK: jsPDF
SEBEP: jsPDF Türkçe karakterleri (ğ, ş, ı, İ, ö, ü, ç) bozuyor
```

### Birim Sistemi
```
Tüm iç hesaplamalar: MM
Kullanıcı mm girdiyse: direkt kullan
Kullanıcı inç girdiyse: × 25.4 → mm'ye çevir
Sonuç gösterimi: mm önce, inç parantezde
```

### İstisnalar
```
Cutter Et Kalınlığı → SADECE mm (kullanıcı girişi)
KKM → SADECE inç (kullanıcı girişi)
```

### Formül Dosyası
```
TÜM formüller js/formulas.js içinde tutulur
Başka dosyaya formül yazılmaz
Formüller export edilir, calculator.js import eder
```

### Güvenlik
```
API key'ler asla kod içinde yazmak yasaktır
.env dosyasına, GitHub Secrets'a veya Edge Function'a
```

### Offline Önceliği
```
Kayıt işlemi önce Local Storage'a yazılır
Sonra Supabase'e gönderilir (online ise)
```

### Cutter/Boru Kuralı
```
Cutter OD > Pipe OD → seçim engellenir, hata mesajı gösterilir
Bu kural hiçbir durumda bypass edilemez
```

---

## 6. Güvenlik Kuralları

Tüm ajanlar bu kurallara uymak zorundadır.

### Kesin Yasaklar
```
✗ API key kod içinde
✗ Kullanıcı şifresi log'da veya console'da
✗ Konum verisi kullanıcıya gösterilmesi
✗ Demo kullanıcının 5 hakkını aşması
✗ RLS olmadan Supabase sorgusu
✗ Input validasyonu atlamak
```

### Zorunluluklar
```
✓ Her input: client + server tarafında validate et
✓ XSS: kullanıcı girdilerini escape et
✓ Supabase: her tablo için RLS politikası
✓ Hassas veriler: asla console.log'da
✓ .env: her zaman .gitignore'da
```

### Konum Verisi Özel Kuralı
```
GPS koordinatları:
  - Sessizce alınır (kullanıcıya bildirim yok)
  - Sadece admin görebilir (RLS ile korunur)
  - Uygulama içinde hiçbir yerde kullanıcıya gösterilmez
  - PDF'e dahil edilmez
```

---

## 7. Hata Yönetimi ve Raporlama

### Kullanıcıya Gösterilen Hatalar (Türkçe)
```javascript
// Hata mesajları şablonu:
const errorMessages = {
  MISSING_FIELD: "Bu alan zorunludur.",
  CUTTER_TOO_LARGE: "Cutter çapı boru çapından büyük olamaz.",
  PIPE_NOT_IN_TABLE: "Bu çap için gerekli veriler tabloda bulunamadı. Lütfen yöneticinizle iletişime geçin.",
  DEMO_LIMIT: "Demo hesaplama limitiniz dolmuştur. Tam erişim için yöneticinizle iletişime geçiniz.",
  NETWORK_ERROR: "Bağlantı hatası. Verileriniz kaydedildi, internet bağlantısı sağlandığında iletilecek.",
  SAVE_ERROR: "Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.",
  IMAGE_LIMIT: "Her operasyon için en fazla 5 resim ekleyebilirsiniz.",
};
```

### Geliştirici Hataları (İngilizce, sadece console)
```javascript
console.error('[Calculator] C1 calculation failed:', error);
console.warn('[Offline] Sync queue full, dropping oldest item');
console.log('[Auth] User session refreshed');
```

### Hata Sınıflandırması
| Seviye | Açıklama | Kullanıcıya |
|---|---|---|
| FATAL | Uygulama çalışamıyor | "Bir hata oluştu, lütfen sayfayı yenileyin" |
| ERROR | İşlem tamamlanamadı | Spesifik Türkçe mesaj |
| WARNING | İşlem tamamlandı ama dikkat | Sarı uyarı banner |
| INFO | Bilgilendirme | Toast mesaj |

---

## 8. Test Zorunlulukları

Her ajan, yazdığı kodu teslim etmeden önce şunu doğrular:

### Hesaplama Ajan için
```
✓ C1 formülü bilinen değerlerle test edildi
✓ Negatif Ref1/Ref2 değerleri test edildi
✓ Birim çevrimi (mm↔inç) test edildi
✓ Sıfır veya boş değer edge case test edildi
```

### Backend Ajan için
```
✓ RLS politikaları test edildi (kullanıcı başkasının kaydını göremez)
✓ Demo kullanıcı 5 hak sınırı test edildi
✓ Mail gönderimi test edildi
✓ Offline → online sync test edildi
```

### UI/UX Ajan için
```
✓ Mobil (375px) ekranda test edildi
✓ Desktop (1440px) ekranda test edildi
✓ Tüm formlar keyboard ile doldurulabilir
✓ (?) popup tüm alanlarda çalışıyor
✓ Offline göstergesi çalışıyor
```

### Test Raporlama
Test tamamlanınca Test Ajan'a bildir:
```
TEST BİLDİRİMİ
Ajan: [Ajan adı]
Test edilen: [Fonksiyon/özellik]
Sonuç: ✓ Geçti / ✗ Başarısız
Notlar: [Varsa]
```

---

## 9. Değişiklik Kayıt Formatı

Her değişiklik `CHANGELOG.md`'ye eklenir (Dokümantasyon Ajan sorumlu):

```markdown
## [v1.0.1] — 2026-04-25

### Eklendi
- GPS konum sessiz alma özelliği (Backend Ajan)
- Demo kullanıcı hak sayacı göstergesi (UI/UX Ajan)

### Değiştirildi
- C1 formülü hassasiyet iyileştirmesi (Hesaplama Ajan)

### Düzeltildi
- Offline modda boş sayfa hatası (UI/UX Ajan)

### Güvenlik
- RLS politikası güncellendi (Backend Ajan)
```

---

## 10. Proje Referans Verileri

Tüm ajanların bilmesi gereken sabit değerler:

### Admin Bilgileri
```
Ad: M. Emre Yılmaz
Email: ylmz.emr@gmail.com
Rol: admin
```

### Sabitler
```javascript
const INCH_TO_MM = 25.4;
const MM_TO_INCH = 1 / 25.4;
const TURN_ADVANCE_INCH = 0.125;   // Tur başına ilerleme (1/8")
const MAX_DEMO_CALCULATIONS = 5;   // Demo kullanıcı hesap hakkı
const MAX_IMAGES_PER_OPERATION = 5; // Operasyon başına max resim
const DECIMAL_PLACES = 3;          // Sonuç gösterimi ondalık basamak
```

### Kullanıcı Türleri
```javascript
const USER_ROLES = {
  ADMIN: 'admin',
  FULL: 'tam_kullanici',
  DEMO: 'demo'
};

const USER_STATUS = {
  PENDING: 'beklemede',
  APPROVED: 'onaylandi',
  REJECTED: 'reddedildi',
  DELETED: 'silindi',
  PASSIVE: 'pasif'
};
```

### Operasyon Tipleri
```javascript
const OPERATION_TYPES = {
  HOTTAP: 'hottap',
  STOPPLE: 'stopple',
  TAPALAMA: 'tapalama'
};
```

### Sync Durumları
```javascript
const SYNC_STATUS = {
  SYNCED: 'synced',
  PENDING: 'pending',
  ERROR: 'error'
};
```

### Temel Kurallar (Koda Yansıması)
```javascript
// Kural 1: Cutter boru çapını geçemez
if (cutterOD > pipeOD) throw new Error('CUTTER_TOO_LARGE');

// Kural 2: Stopple sadece çapa çap
if (operationType === 'stopple' && cutterOD !== pipeOD) {
  throw new Error('STOPPLE_REQUIRES_SIZE_ON_SIZE');
}

// Kural 3: Demo sınırı
if (user.rol === 'demo' && user.demo_kalan_hak <= 0) {
  throw new Error('DEMO_LIMIT_REACHED');
}
```

---

**Bu dosya değiştirilemez.**
**Değişiklik talebi → Ana Ajan → Kullanıcı onayı**

**Doküman Versiyonu:** 1.0
**Tarih:** 25 Nisan 2026
