import { test, expect } from '@playwright/test';

const LOGIN_URL   = 'https://ylmzemr-cloude.github.io/hottap-web-uygulamasi/';
const ADMIN_EMAIL = 'ylmz.emr@gmail.com';
const ADMIN_PASS  = 'Ey75967596';

const TEST_USER = {
  name:     'Test Kullanici VIS',
  email:    'testvis.bymey2026@gmail.com',
  phone:    '05001234567',
  password: 'TestVis2026',
};

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

async function login(page, email, password) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#loginForm', { timeout: 15000 });
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', password);
  await page.press('#loginPassword', 'Enter');
  await page.waitForURL('**/app.html', { timeout: 30000 });
  await page.waitForSelector('.nav-btn', { timeout: 15000 });
  await page.waitForTimeout(800);
}

async function goToStep2(page) {
  await page.click('[data-view="new-calc"]');
  await page.waitForSelector('#step-project', { state: 'visible' });
  await page.waitForTimeout(300);
  await page.fill('#projeNo', 'VIS-TEST');
  await page.fill('#operasyonTarihi', '2026-05-03');
  const hottap = page.locator('#op-hottap');
  if (!(await hottap.isChecked())) await hottap.check();
  await page.click('#btnStep1Next');
  await page.waitForSelector('#step-data', { state: 'visible' });
  await page.waitForTimeout(600);
}

async function setVisibility(page, key, visible) {
  await page.click('[data-view="admin-visibility"]');
  await page.waitForSelector('#visibilityForm', { state: 'visible' });
  await page.waitForTimeout(400);
  const cb = page.locator(`#visibilityForm input[data-op="hottap"][data-section="summary"][data-key="${key}"]`);
  if (visible && !(await cb.isChecked())) await cb.check();
  if (!visible && (await cb.isChecked())) await cb.uncheck();
  await page.click('#btnSaveVisibility');
  await page.waitForSelector('#visibilitySaveMsg', { state: 'visible' });
  await page.waitForTimeout(600);
}

// ─── beforeAll: Test kullanıcısı oluştur ve onayla ───────────────────────────

test.beforeAll(async ({ browser }) => {
  // Kayıt dene — zaten varsa hata görmezden gelinir
  const regPage = await browser.newPage();
  await regPage.goto(LOGIN_URL);
  await regPage.waitForSelector('#loginForm');
  await regPage.locator('#loginPanel .switch-link button').click();
  await regPage.waitForSelector('#registerPanel', { state: 'visible' });
  await regPage.fill('#regName', TEST_USER.name);
  await regPage.fill('#regEmail', TEST_USER.email);
  await regPage.fill('#regPhone', TEST_USER.phone);
  await regPage.fill('#regPassword', TEST_USER.password);
  await regPage.click('#registerBtn');
  await regPage.waitForTimeout(2500);
  await regPage.close();

  // Admin: bekleyen listesinde test kullanıcısı varsa tam kullanıcı onayla
  const adminPage = await browser.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASS);
  await adminPage.click('[data-view="admin-pending"]');
  await adminPage.waitForSelector('#pendingList');
  await adminPage.waitForTimeout(1000);

  const pendingCard = adminPage.locator('#pendingList .card', { hasText: TEST_USER.email });
  if (await pendingCard.count() > 0) {
    await pendingCard.locator('[data-type="tam_kullanici"]').click();
    await adminPage.waitForTimeout(1000);
  }
  await adminPage.close();
});

// ─── Test 1: cutterWall kapatılınca kullanıcı görmez, admin görür ────────────

test('cutterWall kapatılınca: kullanıcı görmez, admin görür', async ({ browser }) => {
  // Admin visibility'i kapat
  const adminPage = await browser.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASS);
  await setVisibility(adminPage, 'cutterWall', false);

  // Admin Step 2'de cutterWall'ı hâlâ görmeli
  await goToStep2(adminPage);
  const adminField = adminPage.locator('.op-card[data-op-type="hottap"] label[for^="cutterWall"]').locator('..');
  await expect(adminField).toBeVisible();
  await adminPage.close();

  // Kullanıcı Step 2'de cutterWall'ı görmemeli
  const userPage = await browser.newPage();
  await login(userPage, TEST_USER.email, TEST_USER.password);
  await goToStep2(userPage);
  const userField = userPage.locator('.op-card[data-op-type="hottap"] label[for^="cutterWall"]').locator('..');
  await expect(userField).toBeHidden();
  await userPage.close();
});

// ─── Test 2: cutterWall açılınca kullanıcı da görür ─────────────────────────

test('cutterWall açılınca: kullanıcı da görür', async ({ browser }) => {
  const adminPage = await browser.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASS);
  await setVisibility(adminPage, 'cutterWall', true);
  await adminPage.close();

  const userPage = await browser.newPage();
  await login(userPage, TEST_USER.email, TEST_USER.password);
  await goToStep2(userPage);
  const userField = userPage.locator('.op-card[data-op-type="hottap"] label[for^="cutterWall"]').locator('..');
  await expect(userField).toBeVisible();
  await userPage.close();
});

// ─── Test 3: A alanı kapatılınca kullanıcı görmez ────────────────────────────

test('A alanı kapatılınca: kullanıcı görmez', async ({ browser }) => {
  const adminPage = await browser.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASS);
  await setVisibility(adminPage, 'a', false);
  await adminPage.close();

  const userPage = await browser.newPage();
  await login(userPage, TEST_USER.email, TEST_USER.password);
  await goToStep2(userPage);
  const userField = userPage.locator('.op-card[data-op-type="hottap"] label[for^="fieldA-"]').locator('..');
  await expect(userField).toBeHidden();
  await userPage.close();
});

// ─── afterAll: Tüm alanları eski haline getir ────────────────────────────────

test.afterAll(async ({ browser }) => {
  const adminPage = await browser.newPage();
  await login(adminPage, ADMIN_EMAIL, ADMIN_PASS);
  await adminPage.click('[data-view="admin-visibility"]');
  await adminPage.waitForSelector('#visibilityForm', { state: 'visible' });
  await adminPage.waitForTimeout(400);

  const checkboxes = adminPage.locator('#visibilityForm input[data-op="hottap"][data-section="summary"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const cb = checkboxes.nth(i);
    if (!(await cb.isChecked())) await cb.check();
  }
  await adminPage.click('#btnSaveVisibility');
  await adminPage.waitForTimeout(600);
  await adminPage.close();
});
