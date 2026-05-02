// Çalıştırma: set SCREENSHOT_EMAIL=... && set SCREENSHOT_PASSWORD=... && node playwright-screenshots.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const EMAIL        = process.env.SCREENSHOT_EMAIL;
const PASSWORD     = process.env.SCREENSHOT_PASSWORD;
const DRIVE_FOLDER = '1Cnr0s6rcpgeBBU73BXmnxwiPGZzBMQi8';
const OUTPUT_DIR   = path.join(__dirname, 'screenshots');
const APP_URL      = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/';

async function shot(page, prefix, name, selector = null) {
  const filename = `${prefix}__${name}.png`;
  const file = path.join(OUTPUT_DIR, filename);
  try {
    if (selector) {
      const el = await page.$(selector);
      if (el) {
        await el.screenshot({ path: file });
      } else {
        console.log(`  ⚠  element yok: ${selector}`);
        return null;
      }
    } else {
      await page.screenshot({ path: file, fullPage: true });
    }
    console.log(`  ✓  ${filename}`);
    return file;
  } catch (e) {
    console.log(`  ✗  ${filename} — ${e.message}`);
    return null;
  }
}

async function run() {
  if (!EMAIL || !PASSWORD) {
    console.error('\n❌  SCREENSHOT_EMAIL ve SCREENSHOT_PASSWORD env değişkenleri eksik.');
    console.error('    Örnek:');
    console.error('      set SCREENSHOT_EMAIL=ornek@mail.com');
    console.error('      set SCREENSHOT_PASSWORD=sifreniz');
    console.error('      node playwright-screenshots.js\n');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });  // iPhone 14

  // ── 01: GİRİŞ SAYFASI ─────────────────────────────────────────────────────
  console.log('\n📸  01 — Giriş Sayfası');
  await page.goto(APP_URL);
  await page.waitForSelector('#loginForm');
  await page.waitForTimeout(800);

  await shot(page, '01-giris', 'tam-sayfa');
  await shot(page, '01-giris', 'giris-formu', '#loginPanel');

  // Kayıt paneline geç
  const kayitLink = await page.$('#loginPanel .switch-link button');
  if (kayitLink) {
    await kayitLink.click();
    await page.waitForTimeout(500);
    await shot(page, '01-giris', 'kayit-formu', '#registerPanel');
    const girisLink = await page.$('#registerPanel .switch-link button');
    if (girisLink) await girisLink.click();
    await page.waitForTimeout(300);
  }

  // ── GİRİŞ YAP ─────────────────────────────────────────────────────────────
  console.log('\n🔐  Giriş yapılıyor...');
  await page.fill('#loginEmail', EMAIL);
  await page.fill('#loginPassword', PASSWORD);
  await page.press('#loginPassword', 'Enter');
  await page.waitForURL('**/app.html', { timeout: 30000 });
  await page.waitForSelector('.nav-btn');
  await page.waitForTimeout(1500);

  // ── 02: YENİ HESAPLAMA — ADIM 1 ──────────────────────────────────────────
  console.log('\n📸  02 — Yeni Hesaplama: Adım 1');
  await page.click('[data-view="new-calc"]');
  await page.waitForSelector('#step-project', { state: 'visible' });
  await page.waitForTimeout(600);

  await shot(page, '02-yeni-hesap-adim1', 'tam-sayfa');
  await shot(page, '02-yeni-hesap-adim1', 'proje-bilgileri', '#step-project');

  // Doldur
  await page.fill('#projeNo', 'TEST-001');
  await page.fill('#operasyonTarihi', '2025-01-15');
  await page.check('#op-hottap');
  await page.check('#op-stopple');
  await page.check('#op-tapalama');
  await page.check('#op-geri-alma');
  await page.waitForTimeout(400);
  await shot(page, '02-yeni-hesap-adim1', 'operasyon-secimi-dolu');

  await page.click('#btnStep1Next');
  await page.waitForSelector('#step-data', { state: 'visible' });
  await page.waitForTimeout(800);

  // ── 03: YENİ HESAPLAMA — ADIM 2 ──────────────────────────────────────────
  console.log('\n📸  03 — Yeni Hesaplama: Adım 2 (Veri Girişi)');
  await shot(page, '03-yeni-hesap-adim2', 'tam-sayfa');
  await shot(page, '03-yeni-hesap-adim2', 'kart-hottap',   '.op-card[data-op-type="hottap"]');
  await shot(page, '03-yeni-hesap-adim2', 'kart-stopple',  '.op-card[data-op-type="stopple"]');
  await shot(page, '03-yeni-hesap-adim2', 'kart-tapalama', '.op-card[data-op-type="tapalama"]');
  await shot(page, '03-yeni-hesap-adim2', 'kart-geri-alma','.op-card[data-op-type="geri-alma"]');

  // Test verisi doldur (her sayısal input'a 100)
  const numInputs = await page.$$('#step-data input[type="number"]');
  for (const inp of numInputs) await inp.fill('100').catch(() => {});

  await page.click('#btnStep2Next');
  await page.waitForSelector('#step-results', { state: 'visible' });
  await page.waitForTimeout(1200);

  // ── 04: YENİ HESAPLAMA — ADIM 3 ──────────────────────────────────────────
  console.log('\n📸  04 — Yeni Hesaplama: Adım 3 (Sonuçlar)');
  await shot(page, '04-yeni-hesap-adim3', 'tam-sayfa');
  await shot(page, '04-yeni-hesap-adim3', 'sonuc-sekmeler', '#resultTabs');

  // Her sonuç sekmesini tıkla (her seferinde DOM'dan taze al)
  const tabCount = await page.$$eval('#resultTabs .tab-btn, #resultTabs [role="tab"], #resultTabs button', els => els.length);
  for (let i = 0; i < tabCount; i++) {
    const btns = await page.$$('#resultTabs .tab-btn, #resultTabs [role="tab"], #resultTabs button');
    if (!btns[i]) break;
    const label = (await btns[i].innerText().catch(() => `sekme${i+1}`))
                    .trim().replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s-]/g, '').replace(/\s+/g, '-').toLowerCase().slice(0, 20);
    await btns[i].click();
    await page.waitForTimeout(500);
    await shot(page, '04-yeni-hesap-adim3', `sekme-${i+1}-${label || i+1}`);
  }

  await shot(page, '04-yeni-hesap-adim3', 'kaydet-pdf-butonu', '#btnSaveCalc');

  // ── 05: GEÇMİŞ ───────────────────────────────────────────────────────────
  console.log('\n📸  05 — Geçmiş');
  await page.click('[data-view="history"]');
  await page.waitForTimeout(1000);
  await shot(page, '05-gecmis', 'tam-sayfa');
  await shot(page, '05-gecmis', 'liste', '#historyList');

  // ── 06: OP. SÜRESİ ───────────────────────────────────────────────────────
  console.log('\n📸  06 — Operasyon Süresi');
  await page.click('[data-view="op-sure"]');
  await page.waitForTimeout(600);
  await shot(page, '06-op-suresi', 'tam-sayfa');

  // ── 07: YÖNETİCİ MESAJI ──────────────────────────────────────────────────
  console.log('\n📸  07 — Yönetici Mesajı');
  await page.click('[data-view="message"]');
  await page.waitForTimeout(500);
  await shot(page, '07-mesaj', 'tam-sayfa');
  await shot(page, '07-mesaj', 'mesaj-alani', '#messageText');

  // ── 08-12: ADMİN PANELLERİ ───────────────────────────────────────────────
  const adminBtn = await page.$('[data-view="admin-pending"]:not(.hidden)');
  if (adminBtn) {
    console.log('\n📸  08 — Admin: Bekleyen Başvurular');
    await page.click('[data-view="admin-pending"]');
    await page.waitForTimeout(800);
    await shot(page, '08-admin-bekleyen', 'tam-sayfa');
    await shot(page, '08-admin-bekleyen', 'liste', '#pendingList');

    console.log('\n📸  09 — Admin: Kullanıcılar');
    await page.click('[data-view="admin-users"]');
    await page.waitForTimeout(800);
    await shot(page, '09-admin-kullanicilar', 'tam-sayfa');

    console.log('\n📸  10 — Admin: Hesaplamalar');
    await page.click('[data-view="admin-calcs"]');
    await page.waitForTimeout(800);
    await shot(page, '10-admin-hesaplamalar', 'tam-sayfa');

    console.log('\n📸  11 — Admin: Tablolar');
    await page.click('[data-view="admin-tables"]');
    await page.waitForTimeout(800);
    await shot(page, '11-admin-tablolar', 'tam-sayfa');

    console.log('\n📸  12 — Admin: Görünürlük');
    await page.click('[data-view="admin-visibility"]');
    await page.waitForTimeout(800);
    await shot(page, '12-admin-gorunum', 'tam-sayfa');
    await shot(page, '12-admin-gorunum', 'panel', '#visibilityForm');
  } else {
    console.log('\nℹ  Admin panelleri bu hesapta görünmüyor.');
    console.log('   Admin hesabıyla tekrar çalıştırınca 08-12 klasörleri dolacak.');
  }

  await browser.close();

  // ── GOOGLE DRIVE YÜKLEME ──────────────────────────────────────────────────
  console.log('\n☁️   Google Drive\'a yükleniyor...');
  let yuklendi = 0;
  let hata     = 0;

  for (const file of fs.readdirSync(OUTPUT_DIR)) {
    if (!file.endsWith('.png')) continue;
    const full = path.join(OUTPUT_DIR, file);
    try {
      execSync(`gws drive +upload "${full}" --parent ${DRIVE_FOLDER}`, { stdio: 'pipe' });
      console.log(`  ↑  ${file}`);
      yuklendi++;
    } catch (e) {
      console.log(`  ✗  ${file}`);
      hata++;
    }
  }

  console.log(`\n✅  Bitti! ${yuklendi} resim Drive'a yüklendi.${hata ? ` (${hata} hata)` : ''}`);
  console.log(`    Yerel klasör: ${OUTPUT_DIR}`);
}

run().catch(err => {
  console.error('\n❌  Beklenmeyen hata:', err.message);
  process.exit(1);
});
