const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi';
const APP_URL = BASE_URL + '/app.html';
const EMAIL = 'ylmz.emr@gmail.com';
const PASSWORD = process.argv[2];
const OUT_DIR = path.join(__dirname, '..', 'screenshots');

if (!PASSWORD) {
  console.error('Kullanim: node scripts/screenshots.js <sifre>');
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const VIEWPORT = { width: 390, height: 844 };

async function ss(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT_DIR, name + '.png'), fullPage: true });
  console.log('✓', name);
}

async function login(page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
  await page.fill('#loginEmail', EMAIL);
  await page.fill('#loginPassword', PASSWORD);
  await page.click('#loginBtn');
  await page.waitForURL('**/app.html', { timeout: 10000 });
  await page.waitForTimeout(1500);
}

async function goToStep2(page, op) {
  await login(page);
  await page.fill('#projeNo', 'PRJ-TEST');
  await page.fill('#operasyonTarihi', '2026-04-26');
  await page.click(`[data-op="${op}"][data-action="inc"]`);
  await page.click('#btnStep1Next');
  await page.waitForSelector('#operationCards .op-card', { timeout: 10000 });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  // 1. Giriş ekranı
  await page.goto(BASE_URL);
  await ss(page, '01-giris-ekrani');

  // 2. Kayıt ekranı
  await page.click('text=Kayıt Ol');
  await ss(page, '02-kayit-ekrani');

  // --- Giriş yap ---
  await login(page);

  // 3. Ana ekran — Adım 1 (operasyon seçimi)
  await ss(page, '03-adim1-operasyon-secimi');

  // 4. HotTap formu — Adım 2
  await goToStep2(page, 'hottap');
  await ss(page, '04-adim2-hottap-formu');

  // 5. Stopple formu
  await goToStep2(page, 'stopple');
  await ss(page, '05-adim2-stopple-formu');

  // 6. Tapalama formu
  await goToStep2(page, 'tapalama');
  await ss(page, '06-adim2-tapalama-formu');

  // 7. Yardım kartı
  await goToStep2(page, 'hottap');
  await page.waitForSelector('.help-btn', { timeout: 10000 });
  await page.locator('.help-btn').first().click();
  await page.waitForTimeout(800);
  await ss(page, '07-yardim-karti');

  // 8. Geçmiş sekmesi
  await login(page);
  await page.click('[data-view="history"]');
  await page.waitForTimeout(800);
  await ss(page, '08-gecmis-sekmesi');

  // 9. Yönetici Mesaj
  await page.click('[data-view="message"]');
  await page.waitForTimeout(800);
  await ss(page, '09-yonetici-mesaj');

  // 10. Admin — Bekleyen Onaylar
  await page.click('[data-view="admin-pending"]');
  await page.waitForTimeout(800);
  await ss(page, '10-admin-bekleyen');

  // 11. Admin — Kullanıcılar
  await page.click('[data-view="admin-users"]');
  await page.waitForTimeout(800);
  await ss(page, '11-admin-kullanicilar');

  // 12. Admin — Hesaplamalar
  await page.click('[data-view="admin-calcs"]');
  await page.waitForTimeout(800);
  await ss(page, '12-admin-hesaplamalar');

  // 13. Admin — Tablolar
  await page.click('[data-view="admin-tables"]');
  await page.waitForTimeout(800);
  await ss(page, '13-admin-tablolar');

  await browser.close();
  console.log('\nTüm ekran görüntüleri:', OUT_DIR);
})();
