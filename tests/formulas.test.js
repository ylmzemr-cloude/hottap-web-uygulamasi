/**
 * @file formulas.test.js
 * @description Formül testleri — bilinen doğru değerlerle karşılaştırma
 */

import { formulas, calculateC1, calculateC, calculateE, calculateCouponFree,
         calculatePilotTemas, calculateMaxTapping, calculateMaxTravel,
         calculateStoppleOlcusu, calculateTekerBoruMerkezi,
         calculateTekerTemasMesafesi, calculateTapalama,
         calculateDelmeSuresi, calculateGeriAlmaToplam } from '../js/formulas.js';
import { inchToMm } from '../js/units.js';

// ─── Test altyapısı ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function assert(name, got, expected, tolerance = 0.001) {
  const ok = Math.abs(got - expected) <= tolerance;
  results.push({ name, expected, got, pass: ok });
  if (ok) passed++;
  else failed++;
}

function assertExact(name, got, expected) {
  const ok = got === expected;
  results.push({ name, expected, got, pass: ok });
  if (ok) passed++;
  else failed++;
}

// ─── Test Case 1: 12" boru, 12" cutter (SHORTSTOPP) ─────────────────────────

const TC1 = {
  pipeOdMm:         323.85,
  pipeIdMm:         312.67,
  cutterOdActualMm: 298.45,
  cutterWallMm:      12.70,
  ref1Mm:             6.35,
  ref2Mm:             6.35,
  aMm:              317.50,
  bMm:              203.20,
  dMm:              254.00,
  gMm:              152.40,
  hMm:              101.60,
  yMm:               50.80,
  mMm:               25.40,
  nMm:               12.70,
};

// Cutter ID = 298.45 - (2 × 12.70) = 273.05
assert('cutterID', formulas.cutterID(TC1.cutterOdActualMm, TC1.cutterWallMm), 273.05);

// C1
const { result: c1Result } = calculateC1(TC1.pipeOdMm, TC1.pipeIdMm, TC1.cutterOdActualMm);
assert('C1 hesaplaması', c1Result, 34.344, 0.01);

// C = C1 + Ref1
const { result: cResult } = calculateC(c1Result, TC1.ref1Mm);
assert('C = C1 + Ref1', cResult, c1Result + TC1.ref1Mm, 0.001);

// Pilot Temas = A + B = 317.50 + 203.20 = 520.70
const { result: ptResult } = calculatePilotTemas(TC1.aMm, TC1.bMm);
assert('Pilot Temas', ptResult, 520.70);

// Max Tapping = (Pipe OD / 2) + Ref1 + 0.125"
const { result: mtapResult } = calculateMaxTapping(TC1.pipeOdMm, TC1.ref1Mm);
const expectedMaxTap = (TC1.pipeOdMm / 2) + TC1.ref1Mm + inchToMm(0.125);
assert('Max Tapping', mtapResult, expectedMaxTap, 0.001);

// Max Travel = (A+B) + (Pipe OD/2) + Ref1 + 0.125"
const { result: mtravResult } = calculateMaxTravel(TC1.aMm, TC1.bMm, TC1.pipeOdMm, TC1.ref1Mm);
const expectedMaxTrav = TC1.aMm + TC1.bMm + (TC1.pipeOdMm / 2) + TC1.ref1Mm + inchToMm(0.125);
assert('Max Travel', mtravResult, expectedMaxTrav, 0.001);

// E = Pipe OD - Pipe Wall
const pipeWallMm = (TC1.pipeOdMm - TC1.pipeIdMm) / 2;
const { result: eResult } = calculateE(TC1.pipeOdMm, pipeWallMm);
assert('E hesaplaması', eResult, TC1.pipeOdMm - pipeWallMm, 0.001);

// Stopple Ölçüsü = D + B + E
const { result: stoppleResult } = calculateStoppleOlcusu(TC1.dMm, TC1.bMm, eResult);
assert('Stopple Ölçüsü', stoppleResult, TC1.dMm + TC1.bMm + eResult, 0.001);

// Teker Boru Merkezi = Ref2 + B + (Pipe OD / 2)
const { result: tbmResult } = calculateTekerBoruMerkezi(TC1.ref2Mm, TC1.bMm, TC1.pipeOdMm);
assert('Teker Boru Merkezi', tbmResult, TC1.ref2Mm + TC1.bMm + (TC1.pipeOdMm / 2), 0.001);

// Teker Temas Mesafesi = E + B + Ref2
const { result: ttmResult } = calculateTekerTemasMesafesi(eResult, TC1.bMm, TC1.ref2Mm);
assert('Teker Temas Mesafesi', ttmResult, eResult + TC1.bMm + TC1.ref2Mm, 0.001);

// Tapalama = G + H + Y
const { result: tapResult } = calculateTapalama(TC1.gMm, TC1.hMm, TC1.yMm);
assert('Tapalama', tapResult, TC1.gMm + TC1.hMm + TC1.yMm, 0.001);

// Delme Süresi = KKM / (TS × 0.125)
const kkmInch = 2.0;
const ts = 4;
const { result: dsResult } = calculateDelmeSuresi(kkmInch, ts);
assert('Delme Süresi', dsResult, kkmInch / (ts * 0.125), 0.001);

// Geri Alma Toplam = Tapalama + M + N
const { result: gatResult } = calculateGeriAlmaToplam(tapResult, TC1.mMm, TC1.nMm);
assert('Geri Alma Toplam', gatResult, tapResult + TC1.mMm + TC1.nMm, 0.001);

// Coupon Free = (Pipe OD / 2) - sqrt[(Pipe ID / 2)^2 - (Cutter ID / 2)^2]
const cutterIdMm = formulas.cutterID(TC1.cutterOdActualMm, TC1.cutterWallMm);
const { result: cfResult } = calculateCouponFree(TC1.pipeOdMm, TC1.pipeIdMm, cutterIdMm);
const expectedCF = (TC1.pipeOdMm / 2) - Math.sqrt(
  Math.pow(TC1.pipeIdMm / 2, 2) - Math.pow(cutterIdMm / 2, 2)
);
assert('Coupon Free', cfResult, expectedCF, 0.001);

// ─── Negatif Ref1 edge case ────────────────────────────────────────────────────
// C = C1 + (-5.0) → C1'den küçük olmalı
const { result: c1Neg } = calculateC1(TC1.pipeOdMm, TC1.pipeIdMm, TC1.cutterOdActualMm);
const { result: cNeg } = calculateC(c1Neg, -5.0);
assert('Negatif Ref1 → C < C1', cNeg < c1Neg ? c1Neg - 5.0 : NaN, c1Neg - 5.0, 0.001);

// ─── Rapor ────────────────────────────────────────────────────────────────────

export function runFormulaTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== FORMÜL TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.pass ? '' : ` (beklenen: ${r.expected}, gelen: ${r.got})`;
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
