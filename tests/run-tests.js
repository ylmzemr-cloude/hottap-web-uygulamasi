/**
 * @file run-tests.js
 * @description Tüm testleri çalıştırır — `node tests/run-tests.js` ile
 */

import { runFormulaTests }    from './formulas.test.js';
import { runUnitsTests }      from './units.test.js';
import { runValidationTests } from './validation.test.js';
import { runIntegrationTests } from './integration.test.js';
import { runOfflineTests }    from './offline.test.js';
import { runVisibilityTests } from './visibility.test.js';

const suites = [
  { name: 'Formül Testleri',      run: runFormulaTests },
  { name: 'Birim Çevrim Testleri', run: runUnitsTests },
  { name: 'Validasyon Testleri',  run: runValidationTests },
  { name: 'Entegrasyon Testleri', run: runIntegrationTests },
  { name: 'Offline Testleri',     run: runOfflineTests },
  { name: 'Visibility Testleri',  run: runVisibilityTests },
];

let totalPassed = 0;
let totalFailed = 0;

console.log('\n╔══════════════════════════════════════╗');
console.log('║  ByMEY HotTap — Test Koşturucusu    ║');
console.log('╚══════════════════════════════════════╝\n');

for (const suite of suites) {
  const { passed, failed, total, results } = suite.run();
  totalPassed += passed;
  totalFailed += failed;

  const icon = failed === 0 ? '✓' : '✗';
  console.log(`${icon} ${suite.name}: ${passed}/${total}`);

  if (failed > 0) {
    results.filter(r => !r.pass).forEach(r => {
      const detail = r.expected !== undefined
        ? ` (beklenen: ${r.expected}, gelen: ${r.got})`
        : '';
      console.log(`    ✗ ${r.name}${detail}`);
    });
  }
}

console.log('\n──────────────────────────────────────');
const allOk = totalFailed === 0;
const summary = `${allOk ? '✓ TÜMÜ GEÇTİ' : '✗ BAŞARISIZ'} — ${totalPassed}/${totalPassed + totalFailed} test`;
console.log(summary);

if (typeof process !== 'undefined') {
  process.exit(totalFailed > 0 ? 1 : 0);
}
