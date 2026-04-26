# Yardım İçerikleri — Düzenleme Dosyası

Bu dosyada her giriş alanının yardım içeriği yer alır.
Açıklamaları doğrudan buradan düzenle. Fotoğrafları `images/help/` klasörüne
aşağıdaki isimlerle kaydet. Hazır olunca "güncelle" de, uygulama otomatik güncellensin.

**Fotoğraf formatı:** PNG veya JPEG — boyut farklı olsa bile otomatik 800×600'e dönüştürülür.

---

## Adım 1 — Proje Bilgileri

### Proje No
- **Fotoğraf dosyası:** `proje_no.png`
- **Başlık:** Proje No — İş Emri Numarası
- **Açıklama:** Operasyona ait iş emri veya proje numarası. Kayıt ve PDF'te görünür, arama yaparken bu numaraya göre filtreleme yapılabilir.
- **Birim:** —
- **Not:** Zorunlu alan. Örnek: PRJ-001, IE-2024-042

---

### Operasyon Tarihi
- **Fotoğraf dosyası:** `operasyon_tarihi.png`
- **Başlık:** Operasyon Tarihi
- **Açıklama:** HotTap veya Stopple operasyonunun sahada gerçekleştirildiği tarih.
- **Birim:** —
- **Not:** Zorunlu alan. Gün/Ay/Yıl formatında girilir.

---

## Adım 2 — Operasyon Giriş Alanları

### Pipe OD
- **Fotoğraf dosyası:** `pipe_od.png`
- **Başlık:** Pipe OD — Boru Dış Çapı
- **Açıklama:** Operasyon yapılacak borunun nominal (katalog) dış çapı. Tablodan seçilir; seçim yapıldığında Pipe ID ve et kalınlığı otomatik dolar.
- **Birim:** inç (nominal)
- **Not:** Sadece tabloda kayıtlı çaplar seçilebilir.

---

### Cutter OD
- **Fotoğraf dosyası:** `cutter_od.png`
- **Başlık:** Cutter OD — Cutter Nominal Çapı
- **Açıklama:** Delme işleminde kullanılan cutter'ın nominal çapı. Tablodan seçilir; seçimden sonra gerçek (actual) cutter çapı otomatik dolar. Cutter OD, Pipe OD'yi geçemez.
- **Birim:** inç (nominal)
- **Not:** Stopple operasyonunda Cutter OD = Pipe OD zorunludur.

---

### Cutter Et Kalınlığı
- **Fotoğraf dosyası:** `cutter_et.png`
- **Başlık:** Cutter Et Kalınlığı
- **Açıklama:** Cutter gövdesinin et (duvar) kalınlığı. Bu değer SADECE mm cinsinden girilir.
- **Birim:** mm (sabit)
- **Not:** İnç seçeneği yoktur — her zaman mm giriniz.

---

### A — Pilot Ucundan Adaptör Yüzeyine
- **Fotoğraf dosyası:** `olcu_A.png`
- **Başlık:** A — Pilot Ucundan Adaptör Yüzeyine
- **Açıklama:** Pilot drill ucundan tapping machine adaptörünün yüzeyine kadar olan mesafe.
- **Birim:** mm veya inç
- **Not:** Pozitif değer girilir.

---

### B — Adaptör Yüzeyinden Vana Alt Yüzeyine
- **Fotoğraf dosyası:** `olcu_B.png`
- **Başlık:** B — Adaptör Yüzeyinden Vana Alt Yüzeyine
- **Açıklama:** Tapping machine adaptörünün yüzeyinden boru üzerindeki vanın alt yüzeyine kadar olan mesafe.
- **Birim:** mm veya inç
- **Not:** Pozitif değer girilir.

---

### Ref1 — Pilot Ucundan Cutter Kesme Yüzeyine
- **Fotoğraf dosyası:** `olcu_Ref1.png`
- **Başlık:** Ref1 — Pilot Ucundan Cutter Kesme Yüzeyine
- **Açıklama:** Pilot drill ucundan cutter kesme yüzeyine kadar olan referans mesafe. Makine tipine göre negatif olabilir.
- **Birim:** mm veya inç
- **Not:** Negatif değer alabilir — eksi işaretiyle giriniz.

---

### D — Stopple Referans Ölçüsü
- **Fotoğraf dosyası:** `olcu_D.png`
- **Başlık:** D — Stopple Referans Ölçüsü
- **Açıklama:** Stopple operasyonunda tapping machine adaptörünün yüzeyinden stopple mekanizmasına kadar olan referans mesafe.
- **Birim:** mm veya inç
- **Not:** Pozitif değer girilir.

---

### Ref2 — Stopple Teker Referansı
- **Fotoğraf dosyası:** `olcu_Ref2.png`
- **Başlık:** Ref2 — Stopple Teker Referansı
- **Açıklama:** Teker (wheel) konumu için kullanılan referans ölçüsü. Makine tipine göre negatif olabilir.
- **Birim:** mm veya inç
- **Not:** Negatif değer alabilir — eksi işaretiyle giriniz.

---

### G — Tapalama Referans Ölçüsü 1
- **Fotoğraf dosyası:** `olcu_G.png`
- **Başlık:** G — Tapalama Referans Ölçüsü 1
- **Açıklama:** Tamamlama (tapalama) operasyonunda ilk referans mesafe.
- **Birim:** mm veya inç
- **Not:** Pozitif değer girilir.

---

### H — Tapalama Referans Ölçüsü 2
- **Fotoğraf dosyası:** `olcu_H.png`
- **Başlık:** H — Tapalama Referans Ölçüsü 2
- **Açıklama:** Tamamlama (tapalama) operasyonunda ikinci referans mesafe.
- **Birim:** mm veya inç
- **Not:** Pozitif değer girilir.

---

### Y — Yay Baskısı
- **Fotoğraf dosyası:** `olcu_Y.png`
- **Başlık:** Y — Yay Baskısı (Spring Travel)
- **Açıklama:** Cutter mekanizmasındaki yayın serbest seyahat mesafesi. 12 inç ve altı cutter için tablodan otomatik gelir.
- **Birim:** mm (tablodan otomatik)
- **Not:** 12 inç üzeri cutter için bu değer yoktur; bunun yerine F girilir.

---

### F — Tapalama Ek Ölçüsü
- **Fotoğraf dosyası:** `olcu_F.png`
- **Başlık:** F — Tapalama Ek Ölçüsü (12 inç üzeri)
- **Açıklama:** 12 inç üzeri cutter boyutlarında yay baskısı yerine kullanılan ek ölçü. Kullanıcı tarafından girilir.
- **Birim:** mm veya inç
- **Not:** Sadece 12 inç üzeri cutter için görünür.

---

### KKM — Kalan Kesim Mesafesi
- **Fotoğraf dosyası:** `olcu_KKM.png`
- **Başlık:** KKM — Kalan Kesim Mesafesi
- **Açıklama:** Delme sırasında anlık olarak ölçülen kalan kesim mesafesi. Bu alan SADECE inç cinsinden girilir.
- **Birim:** inç (sabit)
- **Not:** Delme süresi hesabı opsiyoneldir.

---

### TS — Tur Sayısı
- **Fotoğraf dosyası:** `olcu_TS.png`
- **Başlık:** TS — Tur Sayısı
- **Açıklama:** Delme makinasının şu anki konumundaki sayım (tur adedi). KKM ile birlikte kalan tur sayısını hesaplamak için kullanılır.
- **Birim:** tur (adet)
- **Not:** Delme süresi hesabı opsiyoneldir.

---

### M — Vana Üstünden Tapa Tutucu Alt Yüzüne
- **Fotoğraf dosyası:** `olcu_M.png`
- **Başlık:** M — Vana Üstünden Tapa Tutucu Alt Yüzüne
- **Açıklama:** Geri alma operasyonunda vanın üst yüzeyinden tapa tutucunun alt yüzeyine (tam geri çekilmiş konumda) olan mesafe.
- **Birim:** mm veya inç
- **Not:** Geri alma hesabı opsiyoneldir.

---

### N — Vana Üstünden Tamamlama Tapası Yuvasına
- **Fotoğraf dosyası:** `olcu_N.png`
- **Başlık:** N — Vana Üstünden Tamamlama Tapası Yuvasına
- **Açıklama:** Geri alma operasyonunda vanın üst yüzeyinden tamamlama tapasının yuvasının alt yüzeyine olan mesafe.
- **Birim:** mm veya inç
- **Not:** Geri alma hesabı opsiyoneldir.

---

## Fotoğraf Dosya Listesi (özet)

Aşağıdaki isimlerde fotoğrafları `images/help/` klasörüne at:

| Dosya Adı | Alan |
|-----------|------|
| `proje_no.png` | Proje No |
| `operasyon_tarihi.png` | Operasyon Tarihi |
| `pipe_od.png` | Pipe OD |
| `cutter_od.png` | Cutter OD |
| `cutter_et.png` | Cutter Et Kalınlığı |
| `olcu_A.png` | A ölçüsü |
| `olcu_B.png` | B ölçüsü |
| `olcu_Ref1.png` | Ref1 ölçüsü |
| `olcu_D.png` | D ölçüsü |
| `olcu_Ref2.png` | Ref2 ölçüsü |
| `olcu_G.png` | G ölçüsü |
| `olcu_H.png` | H ölçüsü |
| `olcu_Y.png` | Y — Yay Baskısı |
| `olcu_F.png` | F — Ek Ölçü |
| `olcu_KKM.png` | KKM |
| `olcu_TS.png` | TS — Tur Sayısı |
| `olcu_M.png` | M ölçüsü |
| `olcu_N.png` | N ölçüsü |
