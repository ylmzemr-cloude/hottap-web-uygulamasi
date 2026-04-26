# Formül Güncelleme Kılavuzu

Tüm hesaplama formülleri `js/formulas.js` dosyasında tutulur.
Bu dosyayı doğrudan düzenleyebilirsiniz — başka bir dosyaya dokunmanıza gerek yok.

---

## Mevcut Formüller

| Formül | Kullanım | Dosyadaki İsim |
|---|---|---|
| Cutter ID | Cutter OD − (2 × et kalınlığı) | `cutterID` |
| C1 | (Pipe OD/2) − √[(Pipe ID/2)² − (Cutter OD/2)²] | `c1` |
| C | C1 + Ref1 | `c` |
| E | Pipe OD − (1 × duvar kalınlığı) | `e` |
| Coupon Free | (Pipe OD/2) − √[(Pipe ID/2)² − (Cutter ID/2)²] | `couponFree` |
| Pilot Temas | A + B | `pilotTemas` |
| Max Tapping | (Pipe OD/2) + Ref1 + 0.125" | `maxTapping` |
| Max Travel | (A+B) + (Pipe OD/2) + Ref1 + 0.125" | `maxTravel` |
| Stopple Ölçüsü | D + B + E | `stoppleOlcusu` |
| Teker Boru Merkezi | Ref2 + B + (Pipe OD/2) | `tekerBoruMerkezi` |
| Teker Temas Mesafesi | E + B + Ref2 | `tekerTemasMesafesi` |
| Tapalama | G + H + Y (veya F) | `tapalama` |
| Delme Süresi | KKM / (TS × 0.125) | `delmeSuresi` |
| Geri Alma Toplam | Tapalama + M + N | `geriAlmaToplam` |

---

## Formül Nasıl Değiştirilir?

1. `js/formulas.js` dosyasını bir metin editörde (Notepad++, VS Code) aç
2. Değiştirmek istediğin formülü bul — her formülün üstünde açıklama satırı var
3. Formülü güncelle
4. Dosyayı kaydet
5. Uygulamayı tarayıcıda yenile (Ctrl+F5)

### Örnek: C1 formülünü değiştirmek

Şu an:
```javascript
c1: (pipeOdMm, pipeIdMm, cutterOdActualMm) => {
  return (pipeOdMm / 2) - Math.sqrt(
    Math.pow(pipeIdMm / 2, 2) - Math.pow(cutterOdActualMm / 2, 2)
  );
},
```

Yeni formül yazılırsa aynı yapı korunmalı — sadece matematiksel ifade değişir.

---

## Önemli Kurallar

- Tüm değerler **mm** cinsindendir (cutter et kalınlığı ve KKM hariç)
- Ref1 ve Ref2 **negatif olabilir** — bunu koruyun
- Sonuçlar `parseFloat(x.toFixed(10))` ile yuvarlanır — bu floating point hatalarını önler
- **TDW** kelimesini hiçbir yerde kullanmayın

---

## Değişiklik Sonrası Test

Formül değiştirdikten sonra mutlaka kontrol edin:

1. Bilinen doğru değerlerle hesap yapın
2. `tests/formulas.test.js` içindeki test değerleri referans alınabilir
3. Sonuç yanlışsa **Ctrl+Z** ile geri alın

**Referans değer (12" boru, 12" cutter):**
- Pipe OD: 323.85 mm, Pipe ID: 312.67 mm, Cutter OD: 298.45 mm
- Beklenen C1 ≈ 115.315 mm

---

## Yardım

Formül değişikliğinde sorun yaşarsanız: ylmz.emr@gmail.com
