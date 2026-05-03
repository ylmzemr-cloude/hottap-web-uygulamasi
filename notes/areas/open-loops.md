# Açık Döngüler — HotTap Web Uygulaması

Son güncelleme: 2026-05-03

## Bekleyen İşler

- [ ] **Test Tablosu Geri Bildirimleri** — Kullanıcı Google Sheets tablosunu dolduracak; notlara göre kod değişiklikleri uygulanacak
  - Tablo: https://docs.google.com/spreadsheets/d/1mwpdfmDgoCxywh2FkmPyA7JueV8OZ8C7O0PfIsfKT48

- [ ] **Operasyon Süresi Sekmesi** (`data-view="op-sure"`)
  - Nav butonu `app.html`'e eklendi ✅
  - Henüz yapılmadı: View div (HTML) + `setupOpSure()` fonksiyonu (`js/ui.js`)
  - Formül: `Süre = KKM / (RPM × FeedRate)` dakika

- [ ] **NotebookLM Yardım Metinleri** — `data/help-texts.json` güncellenmesi gerekiyor
  - Notebook: `b3b070c4-1482-4580-b661-149a34b5af1f`

- [ ] **THREAD-O-RING** — Sonraki versiyona ertelendi (J ve K değerleri bilinmiyor)

## Tamamlananlar

- ✅ Görünüm ayarı veri giriş formuna yansıtıldı (2026-05-03)
- ✅ Playwright E2E altyapısı + 3 test (2026-05-03)
- ✅ cutterWall otodoldurma: Cutter OD seçince et kalınlığı tabloddan gelir (2026-05-03)
- ✅ Kapsamlı canlı test sistemi: 46/47 geçiyor (2026-05-02)
- ✅ Google Sheets test tablosu + Playwright screenshots (2026-05-02)
