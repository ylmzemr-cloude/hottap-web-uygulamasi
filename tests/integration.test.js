/**
 * @file integration.test.js
 * @description Entegrasyon testleri — demo limit, hesap akışı
 * Bu testler Supabase bağlantısı olmadan mock nesnelerle çalışır.
 */

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = '') {
  results.push({ name, pass: !!condition, detail });
  if (condition) passed++;
  else failed++;
}

// ─── Demo limit simülasyonu ───────────────────────────────────────────────────

const DEMO_LIMIT = 5;

function createMockDemoUser() {
  return { id: 'demo-test-001', onay_durumu: 'demo', demo_haklari: DEMO_LIMIT };
}

function mockSaveCalculation(user, haklar) {
  if (haklar <= 0) {
    return { success: false, error: 'DEMO_LIMIT_REACHED' };
  }
  return { success: true, remainingHak: haklar - 1 };
}

const demoUser = createMockDemoUser();
let kalan = demoUser.demo_haklari;

for (let i = 1; i <= DEMO_LIMIT; i++) {
  const result = mockSaveCalculation(demoUser, kalan);
  assert(`Demo hesap ${i}/${DEMO_LIMIT} başarılı`, result.success === true);
  assert(`Hesap ${i} sonrası kalan hak = ${DEMO_LIMIT - i}`, result.remainingHak === DEMO_LIMIT - i);
  kalan = result.remainingHak;
}

// 6. hesap reddedilmeli
const result6 = mockSaveCalculation(demoUser, kalan);
assert('6. hesap engellendi (success=false)', result6.success === false);
assert('Hata kodu DEMO_LIMIT_REACHED', result6.error === 'DEMO_LIMIT_REACHED');

// ─── Hesap akışı simülasyonu ──────────────────────────────────────────────────

// calculateC1 → calculateC zinciri tutarlı mı?
import { calculateC1, calculateC } from '../js/formulas.js';

const chain1 = calculateC1(323.85, 312.67, 298.45);
const chain2 = calculateC(chain1.result, 6.35);

assert('C1 hesabı sonuç üretiyor', typeof chain1.result === 'number');
assert('C1 adım listesi var', chain1.steps.length > 0);
assert('C = C1 + Ref1', Math.abs(chain2.result - (chain1.result + 6.35)) < 0.001);

// ─── Steps bütünlüğü ──────────────────────────────────────────────────────────

import { calculateMaxTravel, calculateStoppleOlcusu } from '../js/formulas.js';

const maxTravSteps = calculateMaxTravel(317.5, 203.2, 323.85, 6.35);
assert('MaxTravel adım listesi boş değil', maxTravSteps.steps.length >= 2);
assert('MaxTravel sonuç > 0', maxTravSteps.result > 0);

const stoppleSteps = calculateStoppleOlcusu(254, 203.2, 274.1);
assert('Stopple adım listesi boş değil', stoppleSteps.steps.length >= 1);
assert('Stopple sonuç = D+B+E', Math.abs(stoppleSteps.result - (254 + 203.2 + 274.1)) < 0.001);

// ─── Rapor ────────────────────────────────────────────────────────────────────

export function runIntegrationTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== ENTEGRASYON TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.detail ? ` — ${r.detail}` : '';
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
