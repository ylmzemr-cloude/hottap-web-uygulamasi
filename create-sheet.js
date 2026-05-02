// Google Sheets test tablosu oluşturucu
// Çalıştır: node create-sheet.js
const { execSync } = require('child_process');

function gws(subcmd, body = null, params = null) {
  const env = { ...process.env };
  let cmd = `gws ${subcmd}`;
  if (body)   { env._GWS_BODY   = JSON.stringify(body);   cmd += ' --json "$_GWS_BODY"';   }
  if (params) { env._GWS_PARAMS = JSON.stringify(params); cmd += ' --params "$_GWS_PARAMS"'; }
  const out = execSync(cmd, { encoding: 'utf8', env, shell: '/usr/bin/bash' });
  return JSON.parse(out);
}

// Drive thumbnail URL (aynı hesapta görüntülenince çalışır)
function img(fileId) {
  return `=IMAGE("https://drive.google.com/thumbnail?id=${fileId}&sz=w400",2)`;
}

// ── VERİ ──────────────────────────────────────────────────────────────────────
// [sayfa, alan, fileId, ne_yapiyor]
const ROWS = [
  ['Giriş Sayfası',            'Tam Sayfa',                      '1dhXrHMLMbU2zTq7v1cU5-gtI_8IU-FFX', 'Uygulamaya giriş ve kayıt ekranının genel görünümü'],
  ['Giriş Sayfası',            'Giriş Formu',                    '142AOB9lCl3faDGAglU2ytgVnOXtCO1vC', 'E-posta ve şifre ile giriş yapma formu'],
  ['Giriş Sayfası',            'Kayıt Formu',                    '17pY5LUc7ZkXCTYJ0bT5Wq5wisjx9Hswp', 'Yeni kullanıcı kayıt formu (ad-soyad, e-posta, telefon, şifre)'],
  ['Yeni Hesaplama – Adım 1',  'Tam Sayfa',                      '12Qo8a5_-6eKRAGJuqThNKIto3VCnYBTB', 'Hesaplama başlangıç ekranı: proje bilgileri ve operasyon seçimi'],
  ['Yeni Hesaplama – Adım 1',  'Proje Bilgileri Alanı',          '1_pYvgKoucZZydVRKwbpAJIXBGFx02HPX', 'Proje numarası (metin) ve operasyon tarihi (tarih seçici) girişi'],
  ['Yeni Hesaplama – Adım 1',  'Operasyon Seçimi',               '1KqKRB-vHcMCSfW4_da8WtdeIlAKBJAVh', 'HotTap, Stopple, Tapalama, Tapa Geri Alma; birden fazla seçilebilir'],
  ['Yeni Hesaplama – Adım 2',  'Tam Sayfa',                      '1EWRslV0y7haKUaSwaJF3BYywtF8BLwoF', 'Seçilen her operasyon için ayrı veri giriş kartları'],
  ['Yeni Hesaplama – Adım 2',  'HotTap Kartı',                   '1iEaekFGjWQ3Cbr0s_5aGbBexSWjfZENB', 'Boru seçimi, cutter seçimi, duvar kalınlığı, Ref1, A, B ölçü girişleri; mm/inch toggle'],
  ['Yeni Hesaplama – Adım 2',  'Stopple Kartı',                  '1lh3niNIZW66JWtRcLS3XcUPDjUfyGUgh', 'Bağlı HotTap seçimi ve Ref2, D, B, E ölçü girişleri'],
  ['Yeni Hesaplama – Adım 2',  'Tapalama Kartı',                 '1TZhxa8o2_uFkpw8Wo8_g9ESnHJRvNAmL', 'Bağlı HotTap seçimi ve G, H, Y/F ölçü girişleri'],
  ['Yeni Hesaplama – Adım 2',  'Tapa Geri Alma Kartı',           '19KMDh2bXz5m6BT2GsXprRrSFtvAP8TUX', 'Cutter ve HotTap seçimi, M, N, Spring travel ölçü girişleri'],
  ['Yeni Hesaplama – Adım 3',  'Tam Sayfa',                      '1YT-gx7rDVg0xx3K8BQUu7kT4AdaXrc4n', 'Hesaplama sonuçları; her operasyon için ayrı sekme + özet'],
  ['Yeni Hesaplama – Adım 3',  'Sonuç Sekmeleri (genel)',        '1DMVJO8X6s0PxaMrAEp0BZRlSfPuEkqx4', 'HotTap, Stopple, Tapalama, Geri Alma ve Özet sekmeleri arası geçiş'],
  ['Yeni Hesaplama – Adım 3',  'HotTap Sonuç Sekmesi',           '1M-w_hjMKcHNfcyr4UK3LpmdgFRDXlI9b', 'HotTap hesaplama sonuçları: giriş tablosu + hesaplanmış değerler + formüller'],
  ['Yeni Hesaplama – Adım 3',  'Stopple Sonuç Sekmesi',          '1VxHNYHopsfCJfNGLBAVHEWaogf-sllVc', 'Stopple hesaplama sonuçları tablosu'],
  ['Yeni Hesaplama – Adım 3',  'Tapalama Sonuç Sekmesi',         '1K0C62BJgakQGL_4t1ayuIsqYtSO6PyJZ', 'Tapalama hesaplama sonuçları tablosu'],
  ['Yeni Hesaplama – Adım 3',  'Geri Alma Sonuç Sekmesi',        '1wglU2nJo9XkAjAUsA5f1dU9QrzL_YTS6', 'Tapa geri alma hesaplama sonuçları tablosu'],
  ['Yeni Hesaplama – Adım 3',  'Özet Sekmesi',                   '1uPa0HfCJNc__nACmGTkJMGzdGO__98zq', 'Tüm seçili operasyonların özet tablosu (yan yana karşılaştırma)'],
  ['Yeni Hesaplama – Adım 3',  'Kaydet & PDF İndir Butonu',      '1I2ehNHW4FHj_JU9DkOv5b6MRFU32N6fn', 'Hesaplamayı Supabase\'e kaydet ve PDF raporu oluşturup indir'],
  ['Geçmiş',                   'Tam Sayfa',                      '1qN8JnaLFTXn6C6i4MusvRQdr24iD9bzm', 'Daha önce kaydedilmiş tüm hesaplamaların listesi'],
  ['Geçmiş',                   'Hesaplama Listesi',              '1NfeJDiuQfJ8MVtMbJihWh-gFLxzKD55E', 'Her kayıt için: tarih, proje no, PDF İndir ve Revize Et butonları'],
  ['Operasyon Süresi',         'Tam Sayfa',                      '1DuG1_deitYRm4QTlpi0LvZp8ZYy3Qpec', 'T-203 ve 1200 makine tipleri için RPM ve feed rate\'e göre süre hesaplayıcı'],
  ['Yönetici Mesajı',          'Tam Sayfa',                      '14FT9aWjDhp6sJJFh_25BR5yU6vHb8Snh', 'Kullanıcının admina mesaj gönderme ekranı'],
  ['Yönetici Mesajı',          'Mesaj Yazma Alanı',              '1sr2XpN8_kHOfz6o3wR7HlSSAZ091Z6CS', 'Serbest metin alanı ve Gönder butonu'],
  ['Admin: Bekleyen',          'Tam Sayfa',                      '1BcpzELrsx-l6c0Kr1NNMdwybrRR2ktSy', 'Admin onayı bekleyen yeni kayıt başvurularının listesi'],
  ['Admin: Bekleyen',          'Başvuru Listesi',                '1xDHfJy5p0Mnf_-tjkC1R_Rho8mlE5slE', 'Her başvuru için kullanıcı bilgileri, Onayla ve Reddet butonları'],
  ['Admin: Kullanıcılar',      'Tam Sayfa',                      '1RYJvWWT2MOtGjsCyA9PBqfhCJ88lWeHr', 'Tüm kayıtlı kullanıcılar; demo hesap yenileme ve tam hesaba yükseltme'],
  ['Admin: Hesaplamalar',      'Tam Sayfa',                      '1xGn7eY4GuxbGGKZeQv7wP8VU9BOEGsNm', 'Sistemdeki tüm kullanıcıların hesaplamaları; PDF indirme seçeneği'],
  ['Admin: Tablolar',          'Tam Sayfa',                      '1N9ZvynAgsG3hbD3-JOlqAoh_va8FKt_f', 'Boru, cutter ve yay tablo verilerini düzenleme ekranı (sekme bazlı)'],
  ['Admin: Görünürlük',        'Tam Sayfa',                      '1omQ6-CwAu4QPLCh3KhARB2pG3-97kkgI', 'Kullanıcılara hangi sonuç alanlarının gösterileceğini belirleme paneli'],
  ['Admin: Görünürlük',        'Görünürlük Paneli',              '1r6sY5QOrUR15TeReCYQ9xjT5bt6ygtQR', '4 sütun: Ekran-Özet, Ekran-Sonuç, PDF-Giriş, PDF-Sonuç — her alan için toggle'],
];

async function main() {
  // 1. Spreadsheet oluştur
  console.log('📊  Spreadsheet oluşturuluyor...');
  const created = gws(
    ['sheets', 'spreadsheets', 'create'],
    { properties: { title: 'HotTap - Uygulama Test Tablosu' } }
  );
  const sheetId  = created.spreadsheetId;
  const sheetGid = created.sheets[0].properties.sheetId;
  console.log(`    ID: ${sheetId}`);

  // 2. Başlık satırı + veri satırları
  console.log('📝  Veriler yazılıyor...');
  const header = [['#', 'Sayfa', 'Alan / Bileşen', 'Ekran Resmi', 'Ne Yapıyor', 'Durum', 'Notlar']];
  const dataRows = ROWS.map((r, i) => [i + 1, r[0], r[1], img(r[2]), r[3], '', '']);
  const allRows = [...header, ...dataRows];

  gws(
    ['sheets', 'spreadsheets', 'values', 'batchUpdate'],
    { valueInputOption: 'USER_ENTERED', data: [{ range: 'A1', values: allRows }] },
    { spreadsheetId: sheetId }
  );

  // 3. Biçimlendirme
  console.log('🎨  Biçimlendirme uygulanıyor...');
  const rowCount = allRows.length;

  const formatBody = {
    requests: [
      // Başlık satırı: koyu mavi arkaplan, beyaz yazı, kalın
      {
        repeatCell: {
          range: { sheetId: sheetGid, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.13, green: 0.27, blue: 0.53 },
              textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 11 },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
        }
      },
      // Veri satırları: dikey ortalama, kelime kaydırma
      {
        repeatCell: {
          range: { sheetId: sheetGid, startRowIndex: 1, endRowIndex: rowCount },
          cell: {
            userEnteredFormat: {
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'WRAP',
            }
          },
          fields: 'userEnteredFormat(verticalAlignment,wrapStrategy)',
        }
      },
      // Ekran Resmi sütunu (D): yatay ortalama
      {
        repeatCell: {
          range: { sheetId: sheetGid, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: 3, endColumnIndex: 4 },
          cell: { userEnteredFormat: { horizontalAlignment: 'CENTER' } },
          fields: 'userEnteredFormat(horizontalAlignment)',
        }
      },
      // Durum sütunu (F): açık yeşil arkaplan
      {
        repeatCell: {
          range: { sheetId: sheetGid, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: 5, endColumnIndex: 6 },
          cell: { userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.98, blue: 0.9 } } },
          fields: 'userEnteredFormat(backgroundColor)',
        }
      },
      // Notlar sütunu (G): açık sarı arkaplan
      {
        repeatCell: {
          range: { sheetId: sheetGid, startRowIndex: 1, endRowIndex: rowCount, startColumnIndex: 6, endColumnIndex: 7 },
          cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 0.98, blue: 0.88 } } },
          fields: 'userEnteredFormat(backgroundColor)',
        }
      },
      // Başlık satırı yüksekliği
      {
        updateDimensionProperties: {
          range: { sheetId: sheetGid, dimension: 'ROWS', startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 40 },
          fields: 'pixelSize',
        }
      },
      // Veri satırları yüksekliği (resimler için)
      {
        updateDimensionProperties: {
          range: { sheetId: sheetGid, dimension: 'ROWS', startIndex: 1, endIndex: rowCount },
          properties: { pixelSize: 220 },
          fields: 'pixelSize',
        }
      },
      // Kolon genişlikleri: A(#), B(Sayfa), C(Alan), D(Resim), E(Açıklama), F(Durum), G(Notlar)
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 40  }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 220 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 3, endIndex: 4 }, properties: { pixelSize: 360 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 4, endIndex: 5 }, properties: { pixelSize: 320 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 5, endIndex: 6 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },
      { updateDimensionProperties: { range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: 6, endIndex: 7 }, properties: { pixelSize: 250 }, fields: 'pixelSize' } },
      // Başlık satırını dondur
      {
        updateSheetProperties: {
          properties: { sheetId: sheetGid, gridProperties: { frozenRowCount: 1 } },
          fields: 'gridProperties.frozenRowCount',
        }
      },
    ]
  };

  gws(
    ['sheets', 'spreadsheets', 'batchUpdate'],
    formatBody,
    { spreadsheetId: sheetId }
  );

  console.log('\n✅  Tablo hazır!');
  console.log(`    https://docs.google.com/spreadsheets/d/${sheetId}`);
}

main().catch(err => {
  console.error('❌  Hata:', err.message);
  process.exit(1);
});
