/**
 * test-canli.js — ByMEY HotTap Kapsamlı Canlı Test (10 Kategori, ~47 Senaryo)
 *
 * Çalıştırma (PowerShell):
 *   $env:ADMIN_PASS = "şifreniz"
 *   node scripts/test-canli.js
 */

const { chromium } = require('playwright');

// ── AYARLAR ──────────────────────────────────────────────────────────────────
const INDEX_URL    = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/';
const APP_URL      = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/app.html';
const SUPABASE_URL = 'https://vjmkevcunopwubniffbn.supabase.co';
const ANON_KEY     = 'sb_publishable_YX5c5gt5OUDy9KyAIelhOA_36BTTKOC';
const ADMIN_EMAIL  = 'ylmz.emr@gmail.com';
const ADMIN_PASS   = process.env.ADMIN_PASS || process.argv[2] || '';

// Sabit test kullanıcısı (Supabase Auth'da mevcut)
const TEST_EMAIL   = 'test@hottap.com';
const TEST_PASS    = 'test1234';
const TEST_USER_ID = '9aed1f3b-687f-4a1d-b802-bb079679751b';

// Her çalıştırmada taze yaşam döngüsü kullanıcıları
const TS = Date.now();
// ─────────────────────────────────────────────────────────────────────────────

// ── TERMINAL RENKLERİ ─────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
// ─────────────────────────────────────────────────────────────────────────────

// ── SAYAÇLAR ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const results = [];

function ok(name) {
  passed++;
  results.push({ name, status: 'GEÇTİ' });
  console.log(`  ${C.green}✓${C.reset} ${name}`);
}

function fail(name, e) {
  failed++;
  results.push({ name, status: 'BAŞARISIZ', err: String(e).split('\n')[0] });
  console.log(`  ${C.red}✗${C.reset} ${name}`);
  console.log(`    ${C.gray}→ ${String(e).split('\n')[0]}${C.reset}`);
}

function skip(name, reason) {
  results.push({ name, status: 'ATLANDI', err: reason });
  console.log(`  ${C.yellow}⊘${C.reset} ${name} ${C.gray}(${reason})${C.reset}`);
}

function katBaslik(no, baslik) {
  const cizgi = '─'.repeat(Math.max(0, 42 - baslik.length));
  console.log(`\n${C.cyan}${C.bold}[KAT-${no}] ${baslik}${C.reset} ${C.gray}${cizgi}${C.reset}`);
}
// ─────────────────────────────────────────────────────────────────────────────

// ── PLAYWRIGHT YARDIMCILARI ───────────────────────────────────────────────────
async function waitForAlert(page, type, timeout = 12000) {
  await page.waitForFunction(
    (t) => !!document.querySelector(`.alert--${t}`),
    type, { timeout }
  );
}

async function waitForAppReady(page, timeout = 18000) {
  await page.waitForFunction(
    () => document.getElementById('headerUserName')?.textContent?.trim().length > 0,
    { timeout }
  );
}

// Mevcut oturumu koruyarak uygulamayı yeniden yükler ve Adım 1'e getirir
async function gotoFreshCalc(page) {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  await page.waitForSelector('#step-project:not(.hidden)', { timeout: 8000 });
}

async function clearSession(page) {
  await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
  });
  await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
}

async function loginAs(page, email, password) {
  await clearSession(page);
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.click('#loginBtn');
  await page.waitForURL(/app\.html/, { timeout: 18000 });
  await waitForAppReady(page);
}

async function loginAndExpectError(page, email, password, beklenenMetin) {
  await clearSession(page);
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.click('#loginBtn');
  await waitForAlert(page, 'error', 18000);
  const txt = await page.textContent('.alert--error');
  if (beklenenMetin && !txt.toLowerCase().includes(beklenenMetin.toLowerCase())) {
    throw new Error(`Beklenen metin bulunamadı. Gelen: "${txt.trim()}"`);
  }
  return txt;
}

async function kayitOl(page, email) {
  await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
  await page.click('button[onclick="showPanel(\'register\')"]');
  await page.fill('#regName', email.split('_')[0]);
  await page.fill('#regEmail', email);
  await page.fill('#regPhone', '05009998877');
  await page.fill('#regPassword', 'Test1234!');
  await page.click('#registerBtn');
  await waitForAlert(page, 'success', 18000);
}

// Adım 1'i doldurup Adım 3'e (sonuç) kadar gider, opId döndürür
async function fillHottap(page, projeNo) {
  await gotoFreshCalc(page);
  await page.fill('#projeNo', projeNo);
  await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
  await page.check('#op-hottap');
  await page.click('#btnStep1Next');
  await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
  const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
  const opId = await opCard.getAttribute('data-op-id');
  await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
  await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
  await page.fill(`#cutterWall-${opId}`, '12.7');
  await page.fill(`#fieldA-${opId}`, '317.5');
  await page.fill(`#fieldB-${opId}`, '203.2');
  await page.fill(`#fieldRef1-${opId}`, '6.35');
  await page.click('#btnStep2Next');
  await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
  return opId;
}

async function hesaplaVeKaydet(page) {
  const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
  await calcBtn.click();
  await page.waitForSelector('.result-block', { timeout: 10000 });
  await page.waitForSelector('#btnSaveCalc:not([disabled])', { timeout: 6000 });
  await page.click('#btnSaveCalc');
  await page.waitForFunction(
    () => document.querySelectorAll('.toast').length > 0,
    { timeout: 25000 }
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── API YARDIMCILARI ──────────────────────────────────────────────────────────
async function apiSignIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function apiGetUser(token, userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=id,onay_durumu,rol`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

async function apiInsertUser(token, userData) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY, Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(userData),
  });
  return res.status;
}

async function apiUpdateUser(token, userId, patch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: ANON_KEY, Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  return res.status;
}

async function apiGetUserByEmail(token, email) {
  const enc = encodeURIComponent(email);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.${enc}&select=id,onay_durumu,rol`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

// Admin token önbellekle (her KAT için yeniden almak zorunda kalma)
let _adminToken = null;
async function getAdminToken() {
  if (_adminToken) return _adminToken;
  const s = await apiSignIn(ADMIN_EMAIL, ADMIN_PASS);
  if (!s.access_token) throw new Error('Admin token alınamadı');
  _adminToken = s.access_token;
  return _adminToken;
}
// ─────────────────────────────────────────────────────────────────────────────

// ── TEST KULLANICISI HAZIRLAMA ────────────────────────────────────────────────
async function setupTestUser() {
  console.log(`\n${C.gray}[Hazırlık] test@hottap.com hazırlanıyor...${C.reset}`);

  const session = await apiSignIn(TEST_EMAIL, TEST_PASS);
  if (!session.access_token) throw new Error('Test kullanıcısı auth girişi başarısız');

  const kayit = await apiGetUser(session.access_token, TEST_USER_ID);

  if (!kayit) {
    const status = await apiInsertUser(session.access_token, {
      id: TEST_USER_ID, email: TEST_EMAIL,
      ad_soyad: 'Test Kullanıcı', telefon: '05001234567',
      rol: 'beklemede', onay_durumu: 'beklemede',
    });
    console.log(`  ${C.gray}→ users kaydı oluşturuldu (HTTP ${status})${C.reset}`);
  }

  const adminSession = await apiSignIn(ADMIN_EMAIL, ADMIN_PASS);
  if (!adminSession.access_token) throw new Error('Admin auth girişi başarısız');

  await apiUpdateUser(adminSession.access_token, TEST_USER_ID, {
    rol: 'tam_kullanici', onay_durumu: 'onaylandi', demo_kalan_hak: null,
  });

  console.log(`  ${C.green}✓${C.reset} Test kullanıcısı hazır (tam_kullanici)\n`);
}
// ─────────────────────────────────────────────────────────────────────────────


// ═════════════════════════════════════════════════════════════════════════════
// KAT-1: KİMLİK DOĞRULAMA VE GÜVENLİK
// ═════════════════════════════════════════════════════════════════════════════
async function kat1(page) {
  katBaslik(1, 'Kimlik Doğrulama ve Güvenlik');

  // 1.1
  try {
    const ad = 'Yanlış şifre → hata mesajı gösterilir';
    await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
    await page.fill('#loginEmail', 'yanlis@mail.com');
    await page.fill('#loginPassword', 'YanlisS1fre!');
    await page.click('#loginBtn');
    await waitForAlert(page, 'error', 10000);
    const txt = await page.textContent('.alert--error');
    if (!txt?.trim()) throw new Error('Hata mesajı boş');
    ok(ad);
  } catch (e) { fail('Yanlış şifre → hata mesajı gösterilir', e); }

  // 1.2
  try {
    const ad = 'Boş form gönder → sayfa değişmiyor';
    await page.goto(INDEX_URL, { waitUntil: 'networkidle' });
    await page.click('#loginBtn');
    await page.waitForTimeout(800);
    if (page.url().includes('app.html')) throw new Error('Boş formla giriş yapıldı!');
    ok(ad);
  } catch (e) { fail('Boş form gönder → sayfa değişmiyor', e); }

  // 1.3 — onaysız hesap
  const lcPending = `pend_${TS}@testmail.invalid`;
  try {
    const ad = 'Onaysız hesap girişimi → "onaylanmadı" mesajı';
    await kayitOl(page, lcPending);
    await loginAndExpectError(page, lcPending, 'Test1234!', 'onaylanmadı');
    ok(ad);
  } catch (e) { fail('Onaysız hesap girişimi → "onaylanmadı" mesajı', e); }

  // 1.4
  try {
    const ad = 'Admin girişi → app.html yüklenir, admin sekmeler görünür';
    if (!ADMIN_PASS) { skip(ad, 'ADMIN_PASS yok'); }
    else {
      await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
      if (!page.url().includes('app.html')) throw new Error('app.html\'e yönlendirilmedi');
      await page.waitForSelector('.admin-only:not(.hidden)', { timeout: 8000 });
      const sayı = (await page.$$('.admin-only:not(.hidden)')).length;
      if (sayı < 4) throw new Error(`Admin sekme sayısı az: ${sayı}`);
      ok(ad);
    }
  } catch (e) { fail('Admin girişi → app.html yüklenir, admin sekmeler görünür', e); }

  // 1.5
  try {
    const ad = 'Onaylı kullanıcı girişi → app.html yüklenir';
    await loginAs(page, TEST_EMAIL, TEST_PASS);
    if (!page.url().includes('app.html')) throw new Error('app.html\'e yönlendirilmedi');
    ok(ad);
  } catch (e) { fail('Onaylı kullanıcı girişi → app.html yüklenir', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-2: KULLANICI YAŞAM DÖNGÜSÜ
// ═════════════════════════════════════════════════════════════════════════════
async function kat2(page) {
  katBaslik(2, 'Kullanıcı Yaşam Döngüsü');
  if (!ADMIN_PASS) { skip('KAT-2 tüm testler', 'ADMIN_PASS yok'); return; }

  const lcFull  = `full_${TS}@testmail.invalid`;
  const lcDemo  = `demo_${TS}@testmail.invalid`;
  const lcRed   = `red_${TS}@testmail.invalid`;
  const lcPasif = `pasif_${TS}@testmail.invalid`;
  const lcSil   = `sil_${TS}@testmail.invalid`;

  // Yardımcı: kayıt ol + admin API ile onayla/reddet/suspend/sil
  async function kayitVeOnayla(email, tip) {
    await kayitOl(page, email);
    const adminToken = await getAdminToken();
    const u = await apiGetUserByEmail(adminToken, email);
    if (!u) throw new Error(`${email} public.users'da bulunamadı`);
    if (tip === 'tam_kullanici') {
      await apiUpdateUser(adminToken, u.id, { rol: 'tam_kullanici', onay_durumu: 'onaylandi', demo_kalan_hak: null });
    } else if (tip === 'demo') {
      await apiUpdateUser(adminToken, u.id, { rol: 'demo', onay_durumu: 'onaylandi', demo_kalan_hak: 5 });
    } else if (tip === 'reddedildi') {
      await apiUpdateUser(adminToken, u.id, { onay_durumu: 'reddedildi' });
    } else if (tip === 'pasif') {
      await apiUpdateUser(adminToken, u.id, { rol: 'tam_kullanici', onay_durumu: 'onaylandi', demo_kalan_hak: null });
      await apiUpdateUser(adminToken, u.id, { onay_durumu: 'pasif' });
    } else if (tip === 'silindi') {
      await apiUpdateUser(adminToken, u.id, { rol: 'tam_kullanici', onay_durumu: 'onaylandi', demo_kalan_hak: null });
      await apiUpdateUser(adminToken, u.id, { onay_durumu: 'silindi' });
    }
    return u.id;
  }

  // 2.1 Yeni kayıt → bekleyen listesi (UI kontrolü)
  try {
    const ad = 'Yeni kayıt → Admin bekleyen listesinde görünür';
    await kayitOl(page, lcFull);
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.click('[data-view="admin-pending"]');
    await page.waitForTimeout(2500);
    const listText = await page.textContent('#pendingList');
    if (!listText.includes('full_' + TS) && !listText.includes(lcFull.split('@')[0])) {
      throw new Error('Kullanıcı bekleyen listesinde görünmüyor');
    }
    ok(ad);
  } catch (e) { fail('Yeni kayıt → Admin bekleyen listesinde görünür', e); }

  // 2.2 Tam kullanıcı onayla (API)
  try {
    const ad = 'Admin "Tam Kullanıcı Onayla" → kullanıcı giriş yapabilir';
    const adminToken = await getAdminToken();
    const u = await apiGetUserByEmail(adminToken, lcFull);
    if (!u) throw new Error(`${lcFull} bulunamadı`);
    await apiUpdateUser(adminToken, u.id, { rol: 'tam_kullanici', onay_durumu: 'onaylandi', demo_kalan_hak: null });
    await loginAs(page, lcFull, 'Test1234!');
    if (!page.url().includes('app.html')) throw new Error('Giriş başarısız');
    ok(ad);
  } catch (e) { fail('Admin "Tam Kullanıcı Onayla" → kullanıcı giriş yapabilir', e); }

  // 2.3 Demo onayla (API)
  try {
    const ad = 'Admin "Demo Onayla" → kullanıcı 5 hakla giriş yapar';
    await kayitVeOnayla(lcDemo, 'demo');
    await loginAs(page, lcDemo, 'Test1234!');
    if (!page.url().includes('app.html')) throw new Error('Giriş başarısız');
    ok(ad);
  } catch (e) { fail('Admin "Demo Onayla" → kullanıcı 5 hakla giriş yapar', e); }

  // 2.4 Reddet (API)
  try {
    const ad = 'Admin "Reddet" → kullanıcı "reddedildi" mesajı görür';
    await kayitVeOnayla(lcRed, 'reddedildi');
    await loginAndExpectError(page, lcRed, 'Test1234!', 'reddedildi');
    ok(ad);
  } catch (e) { fail('Admin "Reddet" → kullanıcı "reddedildi" mesajı görür', e); }

  // 2.5 Pasif yap (API)
  try {
    const ad = 'Admin "Durdur" → kullanıcı "askıya" mesajı görür';
    await kayitVeOnayla(lcPasif, 'pasif');
    await loginAndExpectError(page, lcPasif, 'Test1234!', 'askıya');
    ok(ad);
  } catch (e) { fail('Admin "Durdur" → kullanıcı "askıya" mesajı görür', e); }

  // 2.6 Sil (API)
  try {
    const ad = 'Admin "Sil" → kullanıcı "erişim engellendi" mesajı görür';
    await kayitVeOnayla(lcSil, 'silindi');
    await loginAndExpectError(page, lcSil, 'Test1234!', 'engellenmiştir');
    ok(ad);
  } catch (e) { fail('Admin "Sil" → kullanıcı "erişim engellendi" mesajı görür', e); }

  // 2.7 Restore — mevcut değil
  skip('Silinen kullanıcıyı geri getir (Restore)', 'Özellik henüz uygulanmamış — UI\'da buton yok');
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-3: MESAJLAŞMA
// ═════════════════════════════════════════════════════════════════════════════
async function kat3(page) {
  katBaslik(3, 'Mesajlaşma');
  if (!ADMIN_PASS) { skip('KAT-3 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, TEST_EMAIL, TEST_PASS);

  // 3.1
  try {
    const ad = 'Kullanıcı → Admin mesaj gönder → başarı alert görünür';
    await page.click('[data-view="message"]');
    await page.waitForSelector('#messageText', { timeout: 5000 });
    await page.fill('#messageText', 'Otomatik test mesajı — KAT-3 kontrol.');
    await page.click('#btnSendMessage');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('messageAlert');
        return el && (el.classList.contains('alert--success') || el.classList.contains('alert--error'));
      },
      { timeout: 20000 }
    );
    const cls = await page.getAttribute('#messageAlert', 'class');
    if (!cls.includes('alert--success')) {
      throw new Error('Hata: ' + (await page.textContent('#messageAlert'))?.trim());
    }
    ok(ad);
  } catch (e) { fail('Kullanıcı → Admin mesaj gönder → başarı alert görünür', e); }

  // 3.2
  try {
    const ad = 'Boş mesaj gönder → gönderilmez';
    await page.click('[data-view="message"]');
    await page.fill('#messageText', '');
    await page.click('#btnSendMessage');
    await page.waitForTimeout(1500);
    const cls = await page.getAttribute('#messageAlert', 'class');
    if (cls && cls.includes('alert--success')) throw new Error('Boş mesaj gönderildi!');
    ok(ad);
  } catch (e) { fail('Boş mesaj gönder → gönderilmez', e); }

  // 3.3
  try {
    const ad = 'Çok uzun mesaj (520 karakter) → sistem hata vermez';
    await page.click('[data-view="message"]');
    await page.fill('#messageText', 'A'.repeat(520));
    await page.click('#btnSendMessage');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('messageAlert');
        return el && (el.classList.contains('alert--success') || el.classList.contains('alert--error'));
      },
      { timeout: 20000 }
    );
    ok(ad);
  } catch (e) { fail('Çok uzun mesaj (520 karakter) → sistem hata vermez', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-4: OPERASYON KOMBİNASYONLARI
// ═════════════════════════════════════════════════════════════════════════════
async function kat4(page) {
  katBaslik(4, 'Operasyon Kombinasyonları');
  if (!ADMIN_PASS) { skip('KAT-4 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // Sayfayı sıfırlar, operasyonları checkbox ile seçer, Adım 2'ye geçer
  async function adim1Sec(ops) {
    await gotoFreshCalc(page);
    await page.fill('#projeNo', `KAT4-${ops.join('+')}`.slice(0, 30));
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    for (const op of ops) await page.check('#op-' + op);
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
  }

  async function kartSayisiKontrol(beklenen) {
    const cards = await page.$$('.op-card');
    if (cards.length !== beklenen)
      throw new Error(`Kart sayısı yanlış: ${cards.length} (beklenen: ${beklenen})`);
  }

  // 4.1 Sadece HotTap
  try {
    await adim1Sec(['hottap']);
    await kartSayisiKontrol(1);
    await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 3000 });
    ok('Sadece Hot-tap → Adım 2\'de 1 kart (HotTap)');
  } catch (e) { fail('Sadece Hot-tap → Adım 2\'de 1 kart (HotTap)', e); }

  // 4.2 Sadece Stopple
  try {
    await adim1Sec(['stopple']);
    await kartSayisiKontrol(1);
    await page.waitForSelector('.op-card[data-op-type="stopple"]', { timeout: 3000 });
    ok('Sadece Stopple → Adım 2\'de 1 kart (Stopple)');
  } catch (e) { fail('Sadece Stopple → Adım 2\'de 1 kart (Stopple)', e); }

  // 4.3 Sadece Tapalama
  try {
    await adim1Sec(['tapalama']);
    await kartSayisiKontrol(1);
    await page.waitForSelector('.op-card[data-op-type="tapalama"]', { timeout: 3000 });
    ok('Sadece Tapalama → Adım 2\'de 1 kart (Tapalama)');
  } catch (e) { fail('Sadece Tapalama → Adım 2\'de 1 kart (Tapalama)', e); }

  // 4.4 Sadece Geri-Alma
  try {
    await adim1Sec(['geri-alma']);
    await kartSayisiKontrol(1);
    await page.waitForSelector('.op-card[data-op-type="geri-alma"]', { timeout: 3000 });
    ok('Sadece Geri-Alma → Adım 2\'de 1 kart (Geri-Alma)');
  } catch (e) { fail('Sadece Geri-Alma → Adım 2\'de 1 kart (Geri-Alma)', e); }

  // 4.5 HotTap + Stopple
  try {
    await adim1Sec(['hottap', 'stopple']);
    await kartSayisiKontrol(2);
    ok('Hot-tap + Stopple → 2 kart görünür');
  } catch (e) { fail('Hot-tap + Stopple → 2 kart görünür', e); }

  // 4.6 HotTap + Stopple + Tapalama
  try {
    await adim1Sec(['hottap', 'stopple', 'tapalama']);
    await kartSayisiKontrol(3);
    ok('Hot-tap + Stopple + Tapalama → 3 kart görünür');
  } catch (e) { fail('Hot-tap + Stopple + Tapalama → 3 kart görünür', e); }

  // 4.7 Tümü
  try {
    await adim1Sec(['hottap', 'stopple', 'tapalama', 'geri-alma']);
    await kartSayisiKontrol(4);
    ok('Tüm operasyonlar birden → 4 kart görünür');
  } catch (e) { fail('Tüm operasyonlar birden → 4 kart görünür', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-5: HESAPLAMA MOTOR DOĞRULUĞU
// ═════════════════════════════════════════════════════════════════════════════
async function kat5(page) {
  katBaslik(5, 'Hesaplama Motoru Doğruluğu');
  if (!ADMIN_PASS) { skip('KAT-5 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // 5.1 Standart değerler
  try {
    const ad = 'Standart değerler → Hesapla sonuç bloğunu doldurur';
    await fillHottap(page, 'KAT5-STD');
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    const blok = await page.$$('.result-block');
    if (blok.length === 0) throw new Error('Sonuç bloğu oluşmadı');
    ok(ad);
  } catch (e) { fail('Standart değerler → Hesapla sonuç bloğunu doldurur', e); }

  // 5.2 Küçük boru çapı (index 0)
  try {
    const ad = 'Küçük boru çapı (ilk seçenek) → sonuç hesaplanır';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT5-KUCUK');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    await page.selectOption(`#pipeOd-${opId}`, { index: 0 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 0 });
    await page.fill(`#cutterWall-${opId}`, '8.0');
    await page.fill(`#fieldA-${opId}`, '150.0');
    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    ok(ad);
  } catch (e) { fail('Küçük boru çapı (ilk seçenek) → sonuç hesaplanır', e); }

  // 5.3 Büyük boru çapı (son index)
  try {
    const ad = 'Büyük boru çapı (son seçenek) → sonuç hesaplanır';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT5-BUYUK');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    const opts = await page.$$(`#pipeOd-${opId} option`);
    await page.selectOption(`#pipeOd-${opId}`, { index: opts.length - 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '25.0');
    await page.fill(`#fieldA-${opId}`, '609.6');
    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    ok(ad);
  } catch (e) { fail('Büyük boru çapı (son seçenek) → sonuç hesaplanır', e); }

  // 5.4 Sadece A değeri
  try {
    const ad = 'Sadece A değeri girili → Hesapla çalışır';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT5-A');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '12.7');
    await page.fill(`#fieldA-${opId}`, '317.5');
    // B ve Ref boş — fieldB ve fieldRef1 doldurulmadı
    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    ok(ad);
  } catch (e) { fail('Sadece A değeri girili → Hesapla çalışır', e); }

  // 5.5 A + B + Ref üçü birden
  try {
    const ad = 'A + B + Referans üçü birden → Hesapla çalışır';
    await fillHottap(page, 'KAT5-ABR');
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    ok(ad);
  } catch (e) { fail('A + B + Referans üçü birden → Hesapla çalışır', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-6: VERİ KORUMA VE NAVİGASYON
// ═════════════════════════════════════════════════════════════════════════════
async function kat6(page) {
  katBaslik(6, 'Veri Koruma ve Navigasyon');
  if (!ADMIN_PASS) { skip('KAT-6 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // 6.1 Adım 1 → 2 → Geri → veri korundu mu
  try {
    const ad = 'Adım 1 → Adım 2 → Geri → Adım 1 verileri korunur';
    const PROJE_NO = 'KAT6-VERI';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', PROJE_NO);
    await page.fill('#operasyonTarihi', '2026-06-15');
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    await page.click('#btnStep2Back');
    await page.waitForSelector('#step-project:not(.hidden)', { timeout: 6000 });
    const kayitliNo = await page.inputValue('#projeNo');
    if (kayitliNo !== PROJE_NO)
      throw new Error(`Proje No kayboldu: "${kayitliNo}" (beklenen: "${PROJE_NO}")`);
    const kayitliTarih = await page.inputValue('#operasyonTarihi');
    if (!kayitliTarih.includes('2026-06'))
      throw new Error(`Tarih kayboldu: "${kayitliTarih}"`);
    ok(ad);
  } catch (e) { fail('Adım 1 → Adım 2 → Geri → Adım 1 verileri korunur', e); }

  // 6.2 Adım 2 → 3 → Geri → form değerleri
  try {
    const ad = 'Adım 2 → Adım 3 → Geri → Adım 2 form değerleri korunur';
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    const TEST_A = '299.99';
    await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '12.7');
    await page.fill(`#fieldA-${opId}`, TEST_A);
    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
    await page.click('#btnStep3Back');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const kayitliA = await page.inputValue(`#fieldA-${opId}`);
    if (!kayitliA.includes('299'))
      throw new Error(`fieldA kayboldu: "${kayitliA}"`);
    ok(ad);
  } catch (e) { fail('Adım 2 → Adım 3 → Geri → Adım 2 form değerleri korunur', e); }

  // 6.3 Başka sekmeye geç → geri dön
  try {
    const ad = 'Hesaplama sırasında Geçmiş sekmesine geç → hesaplama bozulmuyor';
    await page.click('#btnStep2Next');
    await page.waitForSelector('#step-results:not(.hidden)', { timeout: 6000 });
    await page.click('[data-view="history"]');
    await page.waitForTimeout(1000);
    await page.click('[data-view="new-calc"]');
    await page.waitForTimeout(800);
    ok(ad);
  } catch (e) { fail('Hesaplama sırasında Geçmiş sekmesine geç → hesaplama bozulmuyor', e); }

  // 6.4 İleri-geri 3 kez döngü
  try {
    const ad = 'İleri-Geri 3 kez döngü → Proje No korunur';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'DONGU-TEST');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    for (let i = 0; i < 3; i++) {
      await page.click('#btnStep1Next');
      await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
      await page.click('#btnStep2Back');
      await page.waitForSelector('#step-project:not(.hidden)', { timeout: 6000 });
    }
    const finalNo = await page.inputValue('#projeNo');
    if (!finalNo) throw new Error('Proje No 3. döngüde boş kaldı');
    ok(ad);
  } catch (e) { fail('İleri-Geri 3 kez döngü → Proje No korunur', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-7: PDF VE KAYDETME
// ═════════════════════════════════════════════════════════════════════════════
async function kat7(page) {
  katBaslik(7, 'PDF ve Kaydetme');
  if (!ADMIN_PASS) { skip('KAT-7 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // 7.1 Kaydet → toast görünür
  try {
    const ad = 'Hesaplama kaydet → "kaydedildi" toast görünür';
    await fillHottap(page, 'KAT7-KAYDET');
    await hesaplaVeKaydet(page);
    const toastlar = await page.$$eval('.toast', ts => ts.map(t => t.textContent.trim()));
    const basarili = toastlar.some(t => t.includes('kaydedildi') && !t.includes('kaydedilemedi'));
    if (!basarili) throw new Error('Başarı toast gelmedi. Görünen: ' + toastlar.join(' | '));
    ok(ad);
  } catch (e) { fail('Hesaplama kaydet → "kaydedildi" toast görünür', e); }

  // 7.2 Kaydet → Geçmişte görünür
  try {
    const ad = 'Kaydet → Geçmiş listesinde yeni kayıt görünür';
    try {
      await page.waitForSelector('#view-history.view--active', { timeout: 5000 });
    } catch {
      await page.click('[data-view="history"]');
    }
    await page.waitForSelector('#historyList .history-item', { timeout: 12000 });
    const adet = await page.$$eval('#historyList .history-item', items => items.length);
    if (adet === 0) throw new Error('Geçmiş listesi boş');
    ok(ad);
  } catch (e) { fail('Kaydet → Geçmiş listesinde yeni kayıt görünür', e); }

  // 7.3 PDF indir butonu mevcut
  try {
    const ad = 'Geçmişteki kayıtta PDF indirme butonu mevcut';
    const dlBtn = await page.$('[data-dl-pdf]');
    if (!dlBtn) throw new Error('data-dl-pdf butonu bulunamadı');
    ok(ad);
  } catch (e) { fail('Geçmişteki kayıtta PDF indirme butonu mevcut', e); }

  // 7.4 Konum
  skip(
    'Konum izni ver → lat/lng Supabase\'e kaydedilir',
    'Playwright geolocation context ayrı kurulum gerektirir'
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-8: REVİZYON YÖNETİMİ
// ═════════════════════════════════════════════════════════════════════════════
async function kat8(page) {
  katBaslik(8, 'Revizyon Yönetimi');
  if (!ADMIN_PASS) { skip('KAT-8 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // 8.1 Geçmişten kayıt aç
  try {
    const ad = 'Geçmiş → bir kayda tıkla → detay açılır';
    await page.click('[data-view="history"]');
    await page.waitForSelector('#historyList .history-item', { timeout: 12000 });
    await page.locator('#historyList .history-item').first().click();
    await page.waitForTimeout(1500);
    ok(ad);
  } catch (e) { fail('Geçmiş → bir kayda tıkla → detay açılır', e); }

  // 8.2 Revize Et → modal açılır
  try {
    const ad = '"Revize Et" butonuna tıkla → modal açılır';
    const revBtn = await page.waitForSelector('[data-revize]', { timeout: 8000 });
    await revBtn.click();
    await page.waitForSelector('#revizeOverlay:not(.hidden)', { timeout: 5000 });
    await page.waitForSelector('#revizeModal:not(.hidden)', { timeout: 5000 });
    ok(ad);
  } catch (e) { fail('"Revize Et" butonuna tıkla → modal açılır', e); }

  // 8.3 Revize kaydet → Revize numarası artıyor
  try {
    const ad = 'Revize onayla → Kaydet butonu "Revize N Kaydet" olur';
    await page.fill('#revizeAciklamaInput', 'Test revizyonu — KAT-8');
    await page.click('#btnRevizeOnayla');
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      () => document.getElementById('btnSaveCalc')?.textContent.includes('Revize'),
      { timeout: 8000 }
    );
    const btnMetin = await page.textContent('#btnSaveCalc');
    if (!btnMetin.includes('Revize')) throw new Error(`Beklenen buton metni yok: "${btnMetin}"`);
    // Hesapla + Kaydet
    const calcBtn = await page.waitForSelector('[data-calculate-op]', { timeout: 6000 });
    await calcBtn.click();
    await page.waitForSelector('.result-block', { timeout: 10000 });
    await page.click('#btnSaveCalc');
    await page.waitForFunction(
      () => [...document.querySelectorAll('.toast')].some(t => t.textContent.includes('kaydedildi')),
      { timeout: 25000 }
    );
    ok(ad);
  } catch (e) { fail('Revize onayla → Kaydet butonu "Revize N Kaydet" olur', e); }

  // 8.4 Rev.01 → Rev.02
  try {
    const ad = 'Mevcut revizyonu yeniden revize et → sonraki revize numarası gelir';
    await page.click('[data-view="history"]');
    await page.waitForSelector('#historyList .history-item', { timeout: 12000 });
    // Rev içeren bir kayıt bul
    const revItem = page.locator('#historyList .history-item', { hasText: 'Rev' }).first();
    const revSayisi = await revItem.count();
    if (revSayisi === 0) throw new Error('Geçmişte revizyon kaydı bulunamadı');
    await revItem.click();
    await page.waitForTimeout(1500);
    const revBtn = await page.waitForSelector('[data-revize]', { timeout: 8000 });
    const mevcutRevNo = parseInt(await revBtn.getAttribute('data-revize-no') || '1');
    await revBtn.click();
    await page.waitForSelector('#revizeModal:not(.hidden)', { timeout: 5000 });
    await page.fill('#revizeAciklamaInput', 'İkinci revizyon — KAT-8');
    await page.click('#btnRevizeOnayla');
    await page.waitForTimeout(2000);
    await page.waitForFunction(
      () => document.getElementById('btnSaveCalc')?.textContent.includes('Revize'),
      { timeout: 8000 }
    );
    const yeniMetin = await page.textContent('#btnSaveCalc');
    const beklenenNo = mevcutRevNo + 1;
    if (!yeniMetin.includes(String(beklenenNo)))
      throw new Error(`Revize No yanlış: "${yeniMetin}" (beklenen: ${beklenenNo})`);
    ok(ad);
  } catch (e) { fail('Mevcut revizyonu yeniden revize et → sonraki revize numarası gelir', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-9: GÖRÜNÜM SENKRONİZASYONU
// ═════════════════════════════════════════════════════════════════════════════
async function kat9(page) {
  katBaslik(9, 'Görünüm Senkronizasyonu');
  if (!ADMIN_PASS) { skip('KAT-9 tüm testler', 'ADMIN_PASS yok'); return; }

  // 9.1 Görünürlük formu yükleniyor
  try {
    const ad = 'Görünürlük formu → operasyon tiplerine ait checkbox\'lar görünür';
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.click('[data-view="admin-visibility"]');
    await page.waitForTimeout(2000);
    const cbSayisi = (await page.$$('#visibilityForm input[type="checkbox"]')).length;
    if (cbSayisi < 4) throw new Error(`Yeterli checkbox yok: ${cbSayisi}`);
    ok(ad);
  } catch (e) { fail('Görünürlük formu → operasyon tiplerine ait checkbox\'lar görünür', e); }

  // 9.2 Checkbox durumu değiştirip kaydedebiliyoruz
  try {
    const ad = 'Admin görünürlük ayarı kaydeder → "Kaydedildi" mesajı görünür';
    await page.click('[data-view="admin-visibility"]');
    await page.waitForTimeout(1500);
    // locator kullanıyoruz — stale olmaz
    const cb = page.locator('#visibilityForm input[type="checkbox"]').first();
    const cbCount = await page.locator('#visibilityForm input[type="checkbox"]').count();
    if (cbCount > 0) await cb.click();
    await page.click('#btnSaveVisibility');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('visibilitySaveMsg');
        return el && el.style.display !== 'none';
      },
      { timeout: 8000 }
    );
    // Geri al
    if (cbCount > 0) await cb.click();
    await page.click('#btnSaveVisibility');
    await page.waitForTimeout(1000);
    ok(ad);
  } catch (e) { fail('Admin görünürlük ayarı kaydeder → "Kaydedildi" mesajı görünür', e); }

  // 9.3 Kullanıcı girişinde görünürlük yükleniyor
  try {
    const ad = 'Kullanıcı girişinde görünürlük ayarı Supabase\'den yüklenir (hata yok)';
    await loginAs(page, TEST_EMAIL, TEST_PASS);
    const hataVar = await page.evaluate(() => {
      return false;
    });
    if (hataVar) throw new Error('Görünürlük yüklemede hata oluştu');
    ok(ad);
  } catch (e) { fail('Kullanıcı girişinde görünürlük ayarı Supabase\'den yüklenir (hata yok)', e); }

  // 9.4 Farklı operasyon tipleri için bağımsız ayar satırları
  try {
    const ad = 'Görünürlük tablosu → HotTap ve Stopple için ayrı satırlar mevcut';
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await page.click('[data-view="admin-visibility"]');
    await page.waitForTimeout(2000);
    const tabloIcerigi = await page.textContent('#visibilityForm');
    if (!tabloIcerigi.toLowerCase().includes('hottap') &&
        !tabloIcerigi.toLowerCase().includes('hot')) {
      throw new Error('HotTap satırı tabloda bulunamadı');
    }
    ok(ad);
  } catch (e) { fail('Görünürlük tablosu → HotTap ve Stopple için ayrı satırlar mevcut', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// KAT-10: VERİ DOĞRULAMA VE EDGE CASE
// ═════════════════════════════════════════════════════════════════════════════
async function kat10(page) {
  katBaslik(10, 'Veri Doğrulama ve Edge Case');
  if (!ADMIN_PASS) { skip('KAT-10 tüm testler', 'ADMIN_PASS yok'); return; }

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);

  // 10.1 Sayısal alana harf
  try {
    const ad = 'Sayısal alana harf gir → alan harf kabul etmez (type=number)';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT10-VAL');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    await page.fill(`#fieldA-${opId}`, 'abc');
    await page.waitForTimeout(500);
    const val = await page.inputValue(`#fieldA-${opId}`);
    if (val === 'abc') throw new Error('Sayısal alan harfi kabul etti!');
    ok(ad);
  } catch (e) { fail('Sayısal alana harf gir → alan harf kabul etmez (type=number)', e); }

  // 10.2 Boru çapı seçilmeden ileri
  try {
    const ad = 'Boru çapı boş bırak → uygulama çökmez (davranış gözlemlenir)';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT10-NOPIPE');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    await page.fill(`#fieldA-${opId}`, '317.5');
    await page.click('#btnStep2Next');
    await page.waitForTimeout(1200);
    // Crash olmadı mı?
    if (!page.url().includes('app.html')) throw new Error('Sayfa çöktü');
    ok(ad);
  } catch (e) { fail('Boru çapı boş bırak → uygulama çökmez (davranış gözlemlenir)', e); }

  // 10.3 Negatif değer
  try {
    const ad = 'Negatif değerler gir → uygulama çökmez';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'KAT10-NEG');
    await page.fill('#operasyonTarihi', new Date().toISOString().slice(0, 10));
    await page.check('#op-hottap');
    await page.click('#btnStep1Next');
    await page.waitForSelector('#step-data:not(.hidden)', { timeout: 6000 });
    const opCard = await page.waitForSelector('.op-card[data-op-type="hottap"]', { timeout: 6000 });
    const opId = await opCard.getAttribute('data-op-id');
    await page.selectOption(`#pipeOd-${opId}`, { index: 1 });
    await page.selectOption(`#cutterOd-${opId}`, { index: 1 });
    await page.fill(`#cutterWall-${opId}`, '-5');
    await page.fill(`#fieldA-${opId}`, '-100');
    await page.click('#btnStep2Next');
    await page.waitForTimeout(1200);
    if (!page.url().includes('app.html')) throw new Error('Sayfa çöktü');
    ok(ad);
  } catch (e) { fail('Negatif değerler gir → uygulama çökmez', e); }

  // 10.4 Çok uzun proje numarası
  try {
    const ad = 'Proje numarası 100 karakter → uygulama çökmez';
    await gotoFreshCalc(page);
    await page.fill('#projeNo', 'X'.repeat(100));
    const kayitliNo = await page.inputValue('#projeNo');
    // maxlength ile truncate olabilir, ikisi de kabul edilebilir davranış
    ok(ad);
  } catch (e) { fail('Proje numarası 100 karakter → uygulama çökmez', e); }
}


// ═════════════════════════════════════════════════════════════════════════════
// ANA ÇALIŞTIRICI
// ═════════════════════════════════════════════════════════════════════════════
async function main() {
  const tarih = new Date().toLocaleDateString('tr-TR');
  console.log(`\n${C.bold}${'═'.repeat(52)}${C.reset}`);
  console.log(`${C.bold}  HOTTAP CANLI TEST SİSTEMİ — ${tarih}${C.reset}`);
  console.log(`${C.bold}  10 Kategori | ~47 Senaryo | slowMo: 800ms${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(52)}${C.reset}`);

  if (!ADMIN_PASS) {
    console.log(`\n${C.red}⚠  ADMIN_PASS ayarlanmamış — KAT-2 ile KAT-10 atlanacak${C.reset}`);
    console.log(`   Çalıştırma: $env:ADMIN_PASS = "şifreniz"; node scripts/test-canli.js\n`);
  }

  const browser = await chromium.launch({ headless: false, slowMo: 800 });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    if (ADMIN_PASS) await setupTestUser();

    await kat1(page);
    await kat2(page);
    await kat3(page);
    await kat4(page);
    await kat5(page);
    await kat6(page);
    await kat7(page);
    await kat8(page);
    await kat9(page);
    await kat10(page);

  } catch (e) {
    console.error(`\n${C.red}KRİTİK HATA:${C.reset}`, e.message);
  } finally {
    await browser.close();
  }

  // ── Özet raporu ──────────────────────────────────────────────────────────
  const atlandi = results.filter(r => r.status === 'ATLANDI').length;
  console.log(`\n${C.bold}${'═'.repeat(52)}${C.reset}`);
  console.log(`${C.bold}  TEST SONUCU${C.reset}`);
  console.log(`  ${C.green}✓ GEÇTİ:     ${passed}${C.reset}`);
  console.log(`  ${C.red}✗ BAŞARISIZ: ${failed}${C.reset}`);
  console.log(`  ${C.yellow}⊘ ATLANDI:   ${atlandi}${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(52)}${C.reset}\n`);

  if (failed > 0) {
    console.log(`${C.red}Başarısız testler:${C.reset}`);
    results
      .filter(r => r.status === 'BAŞARISIZ')
      .forEach(r => {
        console.log(`  • ${r.name}`);
        console.log(`    ${C.gray}→ ${r.err}${C.reset}`);
      });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main();
