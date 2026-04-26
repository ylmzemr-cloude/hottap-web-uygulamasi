/**
 * @file units.test.js
 * @description Birim çevrim testleri
 */

import { inchToMm, mmToInch, INCH_TO_MM } from '../js/units.js';

let passed = 0;
let failed = 0;
const results = [];

function assert(name, got, expected, tolerance = 0.0001) {
  const ok = Math.abs(got - expected) <= tolerance;
  results.push({ name, expected, got, pass: ok });
  if (ok) passed++;
  else failed++;
}

// ─── inç → mm ─────────────────────────────────────────────────────────────────

assert('inchToMm(1)',     inchToMm(1),     25.4);
assert('inchToMm(12)',    inchToMm(12),    304.800);
assert('inchToMm(0.125)', inchToMm(0.125), 3.175);
assert('inchToMm(0.250)', inchToMm(0.250), 6.350);
assert('inchToMm(0.5)',   inchToMm(0.5),  12.700);
assert('inchToMm(16)',    inchToMm(16),   406.400);

// ─── mm → inç ─────────────────────────────────────────────────────────────────

assert('mmToInch(25.4)',   mmToInch(25.4),   1.000);
assert('mmToInch(304.8)',  mmToInch(304.8),  12.000);
assert('mmToInch(115.29)', mmToInch(115.29), 4.539, 0.001);
assert('mmToInch(12.7)',   mmToInch(12.7),   0.500);
assert('mmToInch(6.35)',   mmToInch(6.35),   0.250);

// ─── Çift yönlü tutarlılık ────────────────────────────────────────────────────

const testValues = [34.345, 100.0, 0.001, 999.999, 12.7, 323.85];
testValues.forEach(val => {
  const roundTrip = inchToMm(mmToInch(val));
  assert(`roundTrip(${val})`, roundTrip, val, 0.001);
});

// ─── Sabit değer kontrolü ─────────────────────────────────────────────────────

assert('INCH_TO_MM sabit = 25.4', INCH_TO_MM, 25.4);

// ─── Rapor ────────────────────────────────────────────────────────────────────

export function runUnitsTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== BİRİM ÇEVRİM TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.pass ? '' : ` (beklenen: ${r.expected}, gelen: ${r.got})`;
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
