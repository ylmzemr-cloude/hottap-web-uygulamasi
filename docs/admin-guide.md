# ByMEY HotTap — Admin Kılavuzu

## Admin Paneline Erişim

Admin hesabıyla giriş yaptığında uygulama üstünde şu sekmeler görünür:

| Sekme | İçerik |
|---|---|
| 📥 Bekleyen Onaylar | Yeni kayıt başvuruları |
| 👥 Kullanıcılar | Tüm kullanıcı listesi ve yönetimi |
| 📊 Hesaplamalar | Tüm hesaplama kayıtları |
| ⚙ Tablolar | Boru/cutter/yay veri tabloları |

---

## Kullanıcı Onaylama

1. **📥 Bekleyen Onaylar** sekmesine tıkla
2. Başvuruyu incele (ad, soyad, sicil, telefon görürsün)
3. Uygun butona bas:
   - **Tam Kullanıcı Onayla** → Sınırsız hesaplama hakkı
   - **Demo Onayla** → 5 hesaplama hakkıyla kısıtlı erişim
   - **Reddet** → Başvuru reddedilir, kullanıcıya bildirim gider

---

## Demo Hak Yönetimi

**👥 Kullanıcılar** sekmesinde:

- Demo kullanıcıyı bul
- Aksiyon butonları:
  - **↑ Tam** → Tam kullanıcıya yükselt
  - **↺ Demo** → Demo hakkını 5'e yenile
  - **⏸ Durdur** → Hesabı askıya al
  - **✕ Sil** → Hesabı sil (kayıtlar korunur)

**Filtreleme:** Tümü / Aktif / Demo / Beklemede / Pasif / Silindi

---

## Hesaplama Geçmişi

**📊 Hesaplamalar** sekmesi:

- Tüm kullanıcıların hesaplama kayıtları görünür
- Canlı arama: proje no, kullanıcı adı, tarihe göre filtrele
- **📍** ikonu → Google Maps'te hesaplamanın yapıldığı konumu aç
- **⬇ PDF** → İlgili hesaplamanın PDF'ini indir

> Konum bilgisi sadece admin görür, kullanıcıya gösterilmez.

---

## Tablo Güncelleme

**⚙ Tablolar** sekmesi üç veri tablosunu yönetir:

1. **Boru tablosu** — nominal çap, OD, ID, duvar kalınlığı
2. **Cutter tablosu** — nominal çap, OD, et kalınlığı
3. **Yay tablosu** — yay verileri

**CSV ile güncelleme:**

1. Mevcut tabloyu **⬇ CSV İndir** ile indir
2. Excel veya Google Sheets'te düzenle
3. CSV olarak kaydet
4. **CSV Yükle** ile geri yükle (mevcut verilerin üzerine yazar)

---

## Mail Sistemi

Şu durumlarda sana otomatik mail gelir:

| Durum | Mail İçeriği |
|---|---|
| Yeni kullanıcı kaydı | Kullanıcı bilgileri (ad, sicil, telefon) |
| Yeni hesaplama kaydı | Özet + PDF eki |
| Kullanıcı mesajı | Mesaj içeriği |

---

## İlk Kurulum (Bir Kez Yapılır)

1. Supabase'de proje oluştur → URL ve anon key al
2. `schema.sql` dosyasını Supabase SQL Editor'da çalıştır
3. `.env.example`'ı `.env` olarak kopyala, değerleri doldur
4. GitHub repo oluştur, GitHub Pages'i aktif et
5. `supabase functions deploy send-email` ile Edge Function deploy et
6. Resend'de domain doğrula veya test adresi kullan
7. Supabase Auth UI'den admin hesabı oluştur + SQL ile `is_admin=true` yap

Detaylı adımlar için: ylmz.emr@gmail.com
