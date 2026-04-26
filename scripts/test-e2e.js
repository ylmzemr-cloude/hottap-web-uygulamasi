/**
 * E2E Test — ByMEY HotTap Ölçüm Kartı
 *
 * Kullanım (PowerShell):
 *   $env:ADMIN_PASS = "şifreniz"
 *   node scripts/test-e2e.js
 */

const { chromium } = require('playwright');

// ── AYARLAR ─────────────────────────────────────────────────────────────────
const APP_URL        = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/';
const ADMIN_EMAIL    = 'ylmz.emr@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || '';

const TS         = Date.now();
const TEST_EMAIL = `test_${TS}@testmail.invalid`;
const TEST_PASS  = 'Test1234!';
const TEST_NAME  = 'Test Kullanıcı';
const TEST_PHONE = '05001234567';
// ────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function ok(name)       { passed++; results.push({ name, status: 'GEÇTI' }); console.log(`✓ ${name}`); }
function fail(name, e)  { failed++; results.push({ name, status: 'BAŞARISIZ', err: String(e).split('\n')[0] }); console.log(`✗ ${name}\n  → ${String(e).split('\n')[0]}`); }

async function waitForToast(page, text, timeout = 8000) {
  await page.waitForFunction(
    (txt) => [...document.querySelectorAll('.toast')].some(t => t.textContent.includes(txt)),
    text,
    { timeout }
  );
}

// Uygulama tam başlayana kadar bekle (headerUserName dolunca)
async function waitForAppReady(page, timeout = 15000) {
  await page.waitForFunction(
    () => document.getElementById('headerUserName')?.textContent?.trim().length > 0,
    { timeout }
  );
}

async function loginAs(page, email, password) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.click('#loginBtn');
  await page.waitForURL(/app\.html/, { timeout: 15000 });
  await waitForAppReady(page); // Uygulama tamamen hazır olana kadar bekle
}

// ── TESTLER ─────────────────────────────────────────────────────────────────

async function testLoginHatali(page) {
  const name = 'Hatalı giriş — buton sıfırlanır ve hata gösterilir';
  try {
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.fill('#loginEmail', 'yanlis@mail.com');
    await page.fill('#loginPassword', 'yanlisSifre123');
    await page.click('#loginBtn');
    await page.waitForSelector('.alert--error', { timeout: 10000 });
    const alertText = await page.textContent('.alert--error');
    if (!alertText?.trim()) throw new Error('Hata mesajı boş');
    const disabled = await page.getAttribute('#loginBtn', 'disabled');
    if (disabled !== null) throw new Error('Buton hâlâ disabled durumda');
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
    if (!err?.includes('gerekli')) throw new Error('Ad soyad validasyonu çalışmadı');
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

async function testAdminGiris(page) {
  const name = 'Admin girişi — app.html\'e yönlendirilir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    if (!page.url().includes('app.html')) throw new Error('Yönlendirme olmadı: ' + page.url());
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminSekmeler(page) {
  const name = 'Admin sekmeleri görünür (Bekleyen, Kullanıcılar, Hesaplamalar, Tablolar)';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    // Admin butonların gizliliği kaldırılana kadar bekle
    await page.waitForSelector('.admin-only:not(.hidden)', { timeout: 10000 });
    const adminBtns = await page.$$('.admin-only:not(.hidden)');
    if (adminBtns.length < 4) throw new Error(`Admin sekmesi sayısı az: ${adminBtns.length}`);
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testYardimPopup(page) {
  const name = 'Yardım popup — ? butonuna tıklanınca açılır';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    // Yeni Hesaplama sekmesinde olduğumuzdan emin ol
    await page.click('[data-view="new-calc"]');
    // help-texts.json yüklenene kadar bekle (openHelp veriyi bulamazsa popup açılmaz)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('.help-btn[data-field="ProjeNo"]');
        return btn !== null;
      },
      { timeout: 10000 }
    );
    // help-texts.json'un yüklenmesi için küçük bekleme
    await page.waitForTimeout(1500);
    await page.click('.help-btn[data-field="ProjeNo"]');
    await page.waitForSelector('#helpPopup:not(.hidden)', { timeout: 8000 });
    const title = await page.textContent('#helpPopupTitle');
    if (!title?.trim()) throw new Error('Popup başlığı boş');
    await page.click('#helpPopupClose');
    await page.waitForSelector('#helpPopup.hidden', { timeout: 3000 });
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testHesaplamaAkisi(page) {
  const name = 'HotTap hesaplama — Adım 1→2→3, Hesapla, Kaydet aktif olur';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    // Yeni hesaplama sekmesine geç, Adım 1'de olduğumuzdan emin ol
    await page.click('[data-view="new-calc"]');
    await page.waitForSelector('#step-project:not(.hidden)', { timeout: 5000 });

    await page.fill('#projeNo', 'TEST-001');
    await page.fill('#operasyonTarihi', '2026-01-15');
    await page.click('[data-op="hottap"][data-action="inc"]');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 5000 });

    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 5000 });
    const opId   = await opCard.getAttribute('data-op-id');

    await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '12.7');
    await page.fill(`#fieldA-${opId}`, '317.5');
    await page.fill(`#fieldB-${opId}`, '203.2');
    await page.fill(`#fieldRef1-${opId}`, '6.35');

    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 5000 });

    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 5000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 8000 });

    const saveDisabled = await page.getAttribute('#btnSaveCalc', 'disabled');
    if (saveDisabled !== null) throw new Error('Kaydet butonu hâlâ disabled');
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testKaydetVePDF(page) {
  const name = 'Kaydet ve PDF — başarı toast\'u görünür';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    // Kaydet butonunun aktif olduğundan emin ol
    await page.waitForSelector('#btnSaveCalc:not([disabled])', { timeout: 5000 });
    await page.click('#btnSaveCalc');
    // Toast bekle — blob URL indirmeleri Playwright download event'i tetiklemeyebilir
    await waitForToast(page, 'kaydedildi', 20000);
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testGecmisListesi(page) {
  const name = 'Geçmiş — kaydedilen hesaplama listede görünür';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    // Kaydet sonrası uygulama 2 saniyede geçmişe geçer; yoksa manuel git
    try {
      await page.waitForSelector('#view-history.view--active', { timeout: 5000 });
    } catch {
      await page.click('[data-view="history"]');
    }
    await page.waitForSelector('#historyList .history-item', { timeout: 12000 });
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

async function testAdminPending(page) {
  const name = 'Admin — Bekleyen sekmesi yüklenir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await page.click('[data-view="admin-pending"]');
    await page.waitForSelector('#pendingList', { timeout: 8000 });
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminKullanicilar(page) {
  const name = 'Admin — Kullanıcılar sekmesi ve filtreler çalışır';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await page.click('[data-view="admin-users"]');
    await page.waitForSelector('#usersList', { timeout: 8000 });
    await page.waitForSelector('.admin-table', { timeout: 8000 });
    // Filtre tıklaması
    await page.click('[data-user-filter="aktif"]');
    await page.waitForTimeout(500);
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminHesaplamalar(page) {
  const name = 'Admin — Hesaplamalar sekmesi ve arama çalışır';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await page.click('[data-view="admin-calcs"]');
    await page.waitForSelector('#calcsList', { timeout: 10000 });
    const searchInput = await page.$('#calcSearchInput');
    if (searchInput) {
      await searchInput.fill('TEST-001');
      await page.waitForTimeout(500);
    }
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testAdminTablolar(page) {
  const name = 'Admin — Tablolar sekmesi ve CSV butonları var';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await page.click('[data-view="admin-tables"]');
    await page.waitForSelector('#btnExportPipe', { timeout: 8000 });
    await page.waitForSelector('#btnExportCutter', { timeout: 3000 });
    await page.waitForSelector('#btnExportSpring', { timeout: 3000 });
    ok(name);
  } catch (e) { fail(name, e); }
}

async function testCikis(page) {
  const name = 'Çıkış — index.html\'e yönlendirilir';
  try {
    if (!ADMIN_PASSWORD) { fail(name, 'ADMIN_PASS env değişkeni ayarlanmamış'); return; }
    await page.click('#headerLogout');
    // **/index.html ile sadece index.html'e yönlendirmeyi bekle (app.html'de çakışma engellendi)
    await page.waitForURL('**/index.html', { timeout: 10000 });
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
    headless: false,
    slowMo: 150,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  await testLoginHatali(page);
  await testKayitValidasyon(page);
  await testKayitFormu(page);
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
