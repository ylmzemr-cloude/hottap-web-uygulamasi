/**
 * @file validation.test.js
 * @description Validasyon kuralları testleri
 */

import { rules, validateOperation } from '../js/validation.js';

let passed = 0;
let failed = 0;
const results = [];

function assertErr(name, result, expectedMsg) {
  const ok = result !== null && (expectedMsg ? result.includes(expectedMsg) : true);
  results.push({ name, expected: expectedMsg || 'hata', got: result, pass: ok });
  if (ok) passed++;
  else failed++;
}

function assertPass(name, result) {
  const ok = result === null;
  results.push({ name, expected: null, got: result, pass: ok });
  if (ok) passed++;
  else failed++;
}

function assertBool(name, got, expected) {
  const ok = got === expected;
  results.push({ name, expected, got, pass: ok });
  if (ok) passed++;
  else failed++;
}

// ─── required ─────────────────────────────────────────────────────────────────

assertErr('required("")',        rules.required(''),        'zorunludur');
assertErr('required(null)',      rules.required(null),      'zorunludur');
assertErr('required(undefined)', rules.required(undefined), 'zorunludur');
assertPass('required("abc")',    rules.required('abc'));
assertPass('required(0)',        rules.required(0));
assertPass('required("0")',      rules.required('0'));

// ─── positive ─────────────────────────────────────────────────────────────────

assertErr('positive(-1)',   rules.positive(-1));
assertErr('positive(0)',    rules.positive(0));
assertErr('positive(NaN)', rules.positive(NaN));
assertPass('positive(1)',   rules.positive(1));
assertPass('positive(0.001)', rules.positive(0.001));

// ─── cutterNotLargerThanPipe ──────────────────────────────────────────────────

assertErr('cutter(16) > pipe(12) → hata',  rules.cutterNotLargerThanPipe(16, 12));
assertPass('cutter(12) = pipe(12) → geçer', rules.cutterNotLargerThanPipe(12, 12));
assertPass('cutter(8) < pipe(12) → geçer', rules.cutterNotLargerThanPipe(8, 12));
assertPass('cutter(0.5) < pipe(4) → geçer', rules.cutterNotLargerThanPipe(0.5, 4));

// ─── numberAllowNegative ──────────────────────────────────────────────────────

assertPass('negatif Ref1(-5.5) → geçer',  rules.numberAllowNegative(-5.5));
assertPass('sıfır Ref1(0) → geçer',       rules.numberAllowNegative(0));
assertPass('pozitif Ref1(6.35) → geçer',  rules.numberAllowNegative(6.35));
assertErr('NaN → hata',                   rules.numberAllowNegative(NaN));
assertErr('string → hata',               rules.numberAllowNegative('abc'));

// ─── existsInTable ────────────────────────────────────────────────────────────

const mockTable = [{ nominal: 4 }, { nominal: 6 }, { nominal: 8 }, { nominal: 12 }];
assertPass('existsInTable(8) → geçer',       rules.existsInTable(8, mockTable));
assertPass('existsInTable(4) → geçer',       rules.existsInTable(4, mockTable));
assertErr('existsInTable(10) → tabloda yok', rules.existsInTable(10, mockTable));
assertErr('existsInTable(16) → tabloda yok', rules.existsInTable(16, mockTable));

// ─── validateOperation — hottap ───────────────────────────────────────────────

const validHottap = { pipeOd: '12', cutterOd: '8', cutterWallMm: '12.7', A: '317.5', B: '203.2', ref1: '6.35' };
const { valid: ht1 } = validateOperation('hottap', validHottap);
assertBool('Geçerli HotTap girişi → valid=true', ht1, true);

const missingPipe = { cutterOd: '8', cutterWallMm: '12.7', A: '317.5', B: '203.2', ref1: '6.35' };
const { valid: ht2, errors: ht2e } = validateOperation('hottap', missingPipe);
assertBool('Eksik pipeOd → valid=false', ht2, false);
assertBool('Eksik pipeOd → hata nesnesi var', 'pipeOd' in ht2e, true);

const bigCutter = { pipeOd: '8', cutterOd: '12', cutterWallMm: '12.7', A: '317.5', B: '203.2', ref1: '6.35' };
const { valid: ht3 } = validateOperation('hottap', bigCutter);
assertBool('Cutter > Pipe → valid=false', ht3, false);

// Negatif Ref1 geçerli olmalı
const negRef1 = { pipeOd: '12', cutterOd: '8', cutterWallMm: '12.7', A: '317.5', B: '203.2', ref1: '-5' };
const { valid: ht4 } = validateOperation('hottap', negRef1);
assertBool('Negatif Ref1 → valid=true', ht4, true);

// ─── validateOperation — stopple ─────────────────────────────────────────────

const validStopple = { D: '254', ref2: '6.35' };
const { valid: st1 } = validateOperation('stopple', validStopple);
assertBool('Geçerli Stopple girişi → valid=true', st1, true);

const missingD = { ref2: '6.35' };
const { valid: st2 } = validateOperation('stopple', missingD);
assertBool('Eksik D → valid=false', st2, false);

// ─── validateOperation — tapalama ────────────────────────────────────────────

const validTap = { G: '152.4', H: '101.6', cutterOdNominalInch: 8 };
const { valid: tp1 } = validateOperation('tapalama', validTap);
assertBool('Geçerli Tapalama → valid=true', tp1, true);

const missingG = { H: '101.6' };
const { valid: tp2 } = validateOperation('tapalama', missingG);
assertBool('Eksik G → valid=false', tp2, false);

// ─── Rapor ────────────────────────────────────────────────────────────────────

export function runValidationTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== VALİDASYON TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.pass ? '' : ` (beklenen: ${r.expected}, gelen: ${r.got})`;
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
