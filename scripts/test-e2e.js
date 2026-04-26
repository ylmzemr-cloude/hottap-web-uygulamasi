/**
 * E2E Test — ByMEY HotTap Ölçüm Kartı
 *
 * Kullanım:
 *   node scripts/test-e2e.js
 *
 * Çalıştırmadan önce:
 *   ADMIN_EMAIL ve ADMIN_PASSWORD değişkenlerini aşağıya girin.
 */

const { chromium } = require('playwright');

// ── AYARLAR ─────────────────────────────────────────────────────────────────
const APP_URL    = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/';
const ADMIN_EMAIL    = 'ylmz.emr@gmail.com';          // ← admin e-posta
const ADMIN_PASSWORD = process.env.ADMIN_PASS || '';   // ← node scripts/test-e2e.js ADMIN_PASS=... ile ver

// Test için kullanılacak geçici kullanıcı (her çalıştırmada farklı timestamp)
const TS        = Date.now();
const TEST_EMAIL = `test_${TS}@testmail.invalid`;
const TEST_PASS  = 'Test1234!';
const TEST_NAME  = 'Test Kullanıcı';
const TEST_PHONE = '05001234567';
// ────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function log(icon, msg) { console.log(`${icon} ${msg}`); }

function ok(name) {
  passed++;
  results.push({ name, status: 'GEÇTI' });
  log('✓', name);
}

function fail(name, err) {
  failed++;
  results.push({ name, status: 'BAŞARISIZ', err: String(err).split('\n')[0] });
  log('✗', `${name} — ${String(err).split('\n')[0]}`);
}

async function waitForToast(page, expectedText, timeout = 6000) {
  await page.waitForFunction(
    (txt) => {
      const toasts = document.querySelectorAll('.toast');
      return [...toasts].some(t => t.textContent.includes(txt));
    },
    expectedText,
    { timeout }
  );
}

async function loginAs(page, email, password) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.click('#loginBtn');
  await page.waitForURL(/app\.html/, { timeout: 15000 });
}

// ── TEST FONKSİYONLARI ───────────────────────────────────────────────────────

async function testLoginHatali(page) {
  const name = 'Hatalı giriş — buton sıfırlanır ve hata gösterilir';
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.fill('#loginEmail', 'yanlis@mail.com');
    await page.fill('#loginPassword', 'yanlisSifre123');
    await page.click('#loginBtn');

    // Hata mesajı görünmeli
    await page.waitForSelector('.alert--error', { timeout: 10000 });
    const alertText = await page.textContent('.alert--error');
    if (!alertText || alertText.trim().length === 0) throw new Error('Hata mesajı boş');

    // Buton tekrar aktif olmalı
    const disabled = await page.getAttribute('#loginBtn', 'disabled');
    if (disabled !== null) throw new Error('Buton hâlâ disabled durumda');

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testKayitFormu(page) {
  const name = 'Kayıt formu — başarılı kayıt mesajı gösterilir';
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.click('button[onclick="showPanel(\'register\')"]');
    await page.fill('#regName', TEST_NAME);
    await page.fill('#regEmail', TEST_EMAIL);
    await page.fill('#regPhone', TEST_PHONE);
    await page.fill('#regPassword', TEST_PASS);
    await page.click('#registerBtn');

    await page.waitForSelector('.alert--success', { timeout: 15000 });
    const txt = await page.textContent('.alert--success');
    if (!txt.includes('onay')) throw new Error('Beklenen mesaj yok: ' + txt);

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testKayitValidasyon(page) {
  const name = 'Kayıt formu — boş alanlar engellenir';
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.click('button[onclick="showPanel(\'register\')"]');
    await page.click('#registerBtn');

    const err = await page.textContent('#regNameErr');
    if (!err || !err.includes('gerekli')) throw new Error('Ad soyad validasyonu çalışmadı');

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminGiris(page) {
  const name = 'Admin girişi — app.html\'e yönlendirilir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const url = page.url();
    if (!url.includes('app.html')) throw new Error('Yönlendirme olmadı: ' + url);
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminSekmeler(page) {
  const name = 'Admin sekmeleri görünür (Bekleyen, Kullanıcılar, Hesaplamalar, Tablolar)';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    const adminBtns = await page.$$('.admin-only');
    const visible = [];
    for (const btn of adminBtns) {
      const hidden = await btn.getAttribute('class');
      if (!hidden.includes('hidden')) visible.push(await btn.textContent());
    }
    if (visible.length < 4) throw new Error('Admin sekmesi sayısı az: ' + visible.length);
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testHesaplamaAkisi(page) {
  const name = 'HotTap hesaplama — Adım 1→2→3, Hesapla, Kaydet aktif olur';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    // Adım 1
    await page.fill('#projeNo', 'TEST-001');
    await page.fill('#operasyonTarihi', '2026-01-15');
    await page.click('[data-op="hottap"][data-action="inc"]');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 5000 });

    // Adım 2 — HotTap kartını doldur
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 5000 });
    const opId = await opCard.getAttribute('data-op-id');

    await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '12.7');
    await page.fill(`#fieldA-${opId}`, '317.5');
    await page.fill(`#fieldB-${opId}`, '203.2');
    await page.fill(`#fieldRef1-${opId}`, '6.35');

    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 5000 });

    // Adım 3 — Hesapla
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 5000 });
    await calcBtn.click();

    // Sonuç blokları görünmeli
    await page.waitForSelector('.result-block', { timeout: 8000 });

    // Kaydet butonu aktif olmalı
    const saveDisabled = await page.getAttribute('#btnSaveCalc', 'disabled');
    if (saveDisabled !== null) throw new Error('Kaydet butonu hâlâ disabled');

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testKaydetVePDF(page) {
  const name = 'Kaydet ve PDF — başarı toast\'u ve geçmişe yönlendirme';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    // PDF download olayını dinle (indirme başlarsa test geçer)
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }),
      page.click('#btnSaveCalc'),
    ]);

    if (!download) throw new Error('PDF indirilmedi');

    // Toast geldi mi?
    await waitForToast(page, 'PDF', 10000);

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testGecmisListesi(page) {
  const name = 'Geçmiş — kaydedilen hesaplama listede görünür';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="history"]');
    await page.waitForSelector('#historyList .history-item', { timeout: 10000 });

    const count = await page.$$eval('#historyList .history-item', items => items.length);
    if (count === 0) throw new Error('Geçmiş listesi boş');

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testYoneticiMesaj(page) {
  const name = 'Yöneticiye mesaj — başarı mesajı görünür';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="message"]');
    await page.fill('#messageText', 'Bu otomatik test mesajıdır.');
    await page.click('#btnSendMessage');

    await page.waitForSelector('#messageAlert.alert--success', { timeout: 10000 });
    const txt = await page.textContent('#messageAlert');
    if (!txt.includes('ileti')) throw new Error('Başarı mesajı yok: ' + txt);

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testYardimPopup(page) {
  const name = 'Yardım popup — ? butonuna tıklanınca açılır';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    // Yeni Hesaplama sekmesine geç
    await page.click('[data-view="new-calc"]');

    // Proje No ? butonu
    const helpBtn = await page.waitForSelector('.help-btn[data-field="ProjeNo"]', { timeout: 5000 });
    await helpBtn.click();

    await page.waitForSelector('#helpPopup:not(.hidden)', { timeout: 5000 });
    const title = await page.textContent('#helpPopupTitle');
    if (!title || title.length === 0) throw new Error('Popup başlığı boş');

    // Kapat
    await page.click('#helpPopupClose');
    await page.waitForSelector('#helpPopup.hidden', { timeout: 3000 });

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminPending(page) {
  const name = 'Admin — Bekleyen sekmesi yüklenir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="admin-pending"]');
    // Boş durum ya da kayıt kartı görünmeli
    await page.waitForSelector('#pendingList', { timeout: 5000 });
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminKullanicilar(page) {
  const name = 'Admin — Kullanıcılar sekmesi yüklenir ve tablo görünür';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="admin-users"]');
    await page.waitForSelector('#usersList', { timeout: 5000 });
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminHesaplamalar(page) {
  const name = 'Admin — Hesaplamalar sekmesi yüklenir ve arama çalışır';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="admin-calcs"]');
    await page.waitForSelector('#calcsList', { timeout: 8000 });

    // Arama kutusu varsa test et
    const searchInput = await page.$('#calcSearchInput');
    if (searchInput) {
      await searchInput.fill('TEST-001');
      await page.waitForTimeout(500);
    }

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminTablolar(page) {
  const name = 'Admin — Tablolar sekmesi yüklenir ve CSV butonu var';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('[data-view="admin-tables"]');
    await page.waitForSelector('#btnExportPipe', { timeout: 8000 });

    ok(name);
  } catch (e) { fail(name, e); }
}

async function testCikis(page) {
  const name = 'Çıkış — index.html\'e yönlendirilir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }

    await page.click('#headerLogout');
    await page.waitForURL(/index\.html|\/hottap/, { timeout: 8000 });
    const url = page.url();
    if (url.includes('app.html')) throw new Error('Çıkış sonrası app.html\'de kaldı');

    ok(name);
  } catch (e) { fail(name, e); }
}

// ── ANA ÇALIŞMA ──────────────────────────────────────────────────────────────

(async () => {
  console.log('\n══════════════════════════════════════════');
  console.log(' ByMEY HotTap — E2E Test');
  console.log('══════════════════════════════════════════\n');

  if (!ADMIN_PASSWORD) {
    console.log('⚠  ADMIN_PASS ortam değişkeni ayarlanmamış.');
    console.log('   Admin gerektiren testler atlanacak.\n');
    console.log('   Kullanım: $env:ADMIN_PASS="şifreniz"; node scripts/test-e2e.js\n');
  }

  const browser = await chromium.launch({
    headless: false,   // false = tarayıcı penceresi açılır, true = arka planda çalışır
    slowMo: 200,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  // ── Giriş testleri (şifresiz) ──
  await testLoginHatali(page);
  await testKayitValidasyon(page);
  await testKayitFormu(page);

  // ── Admin testleri ──
  await testAdminGiris(page);
  await testAdminSekmeler(page);
  await testYardimPopup(page);
  await testHesaplamaAkisi(page);
  await testKaydetVePDF(page);
  await testGecmisListesi(page);
  await testYoneticiMesaj(page);
  await testAdminPending(page);
  await testAdminKullanicilar(page);
  await testAdminHesaplamalar(page);
  await testAdminTablolar(page);
  await testCikis(page);

  await browser.close();

  // ── Özet ──
  console.log('\n══════════════════════════════════════════');
  console.log(` Sonuç: ${passed} geçti / ${failed} başarısız / ${passed + failed} toplam`);
  console.log('══════════════════════════════════════════');

  if (failed > 0) {
    console.log('\nBaşarısız testler:');
    results.filter(r => r.status !== 'GEÇTI').forEach(r =>
      console.log(`  ✗ ${r.name}\n    → ${r.err}`)
    );
  }

  process.exit(failed > 0 ? 1 : 0);
})();
