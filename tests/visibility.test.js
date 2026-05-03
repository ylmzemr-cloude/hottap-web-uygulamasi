/**
 * @file visibility.test.js
 * @description cardHotTap/Stopple/Tapalama/GeriAlma fonksiyonlarına eklenen
 *              vis() görünürlük mantığını test eder.
 */

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = '') {
  results.push({ name, pass: !!condition, detail });
  if (condition) passed++;
  else failed++;
}

// vis() — card fonksiyonlarına eklenen yardımcı mantık
// getVisibility()[opType]?.summary || [] üzerinde çalışır
function makeVis(summaryList) {
  const sv = (summaryList == null ? [] : summaryList);
  return (key) => sv.includes(key) ? '' : 'display:none;';
}

// ─── Test 1: Tam liste — tüm alanlar görünür ─────────────────────────────────
{
  const vis = makeVis(['pipeOd', 'cutterOd', 'cutterWall', 'a', 'b', 'ref1']);
  assert('HotTap tam liste — pipeOd görünür',     vis('pipeOd')    === '');
  assert('HotTap tam liste — cutterOd görünür',   vis('cutterOd')  === '');
  assert('HotTap tam liste — cutterWall görünür', vis('cutterWall') === '');
  assert('HotTap tam liste — a görünür',          vis('a')         === '');
  assert('HotTap tam liste — b görünür',          vis('b')         === '');
  assert('HotTap tam liste — ref1 görünür',       vis('ref1')      === '');
}

// ─── Test 2: cutterWall listede yok → gizli ──────────────────────────────────
{
  const vis = makeVis(['pipeOd', 'cutterOd', 'a', 'b', 'ref1']);
  assert('cutterWall kaldırıldı → display:none', vis('cutterWall') === 'display:none;');
  assert('pipeOd hâlâ listede → style boş',      vis('pipeOd')    === '');
  assert('a hâlâ listede → style boş',           vis('a')         === '');
}

// ─── Test 3: Birden fazla alan kaldırıldı ────────────────────────────────────
{
  const vis = makeVis(['pipeOd', 'cutterOd']);
  assert('a kaldırıldı → display:none',       vis('a')         === 'display:none;');
  assert('b kaldırıldı → display:none',       vis('b')         === 'display:none;');
  assert('ref1 kaldırıldı → display:none',    vis('ref1')      === 'display:none;');
  assert('cutterWall kaldırıldı → display:none', vis('cutterWall') === 'display:none;');
  assert('pipeOd listede → boş',              vis('pipeOd')    === '');
}

// ─── Test 4: Boş liste → tümü gizli ─────────────────────────────────────────
{
  const vis = makeVis([]);
  assert('Boş liste — pipeOd gizli',    vis('pipeOd')    === 'display:none;');
  assert('Boş liste — cutterWall gizli', vis('cutterWall') === 'display:none;');
  assert('Boş liste — a gizli',         vis('a')         === 'display:none;');
  assert('Boş liste — b gizli',         vis('b')         === 'display:none;');
  assert('Boş liste — ref1 gizli',      vis('ref1')      === 'display:none;');
}

// ─── Test 5: null/undefined güvenliği ────────────────────────────────────────
{
  // getVisibility()['hottap']?.summary undefined gelirse || [] devreye girer
  const sv1 = undefined?.['hottap']?.summary || [];
  const vis1 = makeVis(sv1);
  assert('undefined kaynak → display:none',   vis1('cutterWall') === 'display:none;');

  const sv2 = null;
  const vis2 = makeVis(sv2);
  assert('null liste → display:none',         vis2('pipeOd') === 'display:none;');
}

// ─── Test 6: Stopple alanları ────────────────────────────────────────────────
{
  const vis = makeVis(['pipeOd', 'ref2']); // d kaldırıldı
  assert('Stopple — ref2 görünür',           vis('ref2') === '');
  assert('Stopple — pipeOd görünür',         vis('pipeOd') === '');
  assert('Stopple — d kaldırıldı → gizli',  vis('d') === 'display:none;');
}

// ─── Test 7: Tapalama alanları ───────────────────────────────────────────────
{
  const vis = makeVis(['cutterOd', 'h']); // g ve f kaldırıldı
  assert('Tapalama — h görünür',              vis('h') === '');
  assert('Tapalama — cutterOd görünür',       vis('cutterOd') === '');
  assert('Tapalama — g kaldırıldı → gizli',  vis('g') === 'display:none;');
  assert('Tapalama — f kaldırıldı → gizli',  vis('f') === 'display:none;');
}

// ─── Test 8: Geri Alma alanları ──────────────────────────────────────────────
{
  const vis = makeVis(['cutterOd', 'm']); // n ve yay kaldırıldı
  assert('Geri Alma — m görünür',              vis('m')   === '');
  assert('Geri Alma — cutterOd görünür',       vis('cutterOd') === '');
  assert('Geri Alma — n kaldırıldı → gizli',  vis('n')   === 'display:none;');
  assert('Geri Alma — yay kaldırıldı → gizli', vis('yay') === 'display:none;');
}

// ─── Test 9: HTML template literal içinde doğru çıktı ────────────────────────
{
  const vis = makeVis(['a', 'b']); // ref1 listede yok

  const hiddenHtml = `<div class="field" style="${vis('ref1')}">ref1</div>`;
  assert('HTML — ref1 gizli → style="display:none;"',
    hiddenHtml.includes('style="display:none;"'));

  const visibleHtml = `<div class="field" style="${vis('a')}">a</div>`;
  assert('HTML — a görünür → style=""',
    visibleHtml.includes('style=""'));

  // inputRow wrapperStyle pattern'i
  const wrapperHidden = `<div class="field" style="display:none;">içerik</div>`;
  assert('wrapperStyle — display:none doğru biçim',
    wrapperHidden.includes('style="display:none;"'));
}

// ─── Test 10: cardHotTap HTML simülasyonu ────────────────────────────────────
// cardHotTap() ui.js'ten import edilemiyor (Supabase/DOM bağımlılığı),
// bu yüzden aynı template kalıbını burada simüle edip HTML çıktısını test ediyoruz.
function simulateCardHotTap(summaryList) {
  const sv = summaryList || [];
  const vis = (key) => sv.includes(key) ? '' : 'display:none;';
  return [
    `<div class="field" style="${vis('pipeOd')}">`,
    `<div class="field" style="${vis('cutterOd')}">`,
    `<div class="field" style="${vis('cutterWall')}">`,
    `<div class="field" style="${vis('a')}">`,
    `<div class="field" style="${vis('b')}">`,
    `<div class="field" style="${vis('ref1')}">`,
  ].join('\n');
}

// Senaryo A: cutterWall admin tarafından kaldırıldı
{
  const html = simulateCardHotTap(['pipeOd', 'cutterOd', 'a', 'b', 'ref1']);
  const lines = html.split('\n');

  assert('cardHotTap — pipeOd satırı: style=""',
    lines[0].includes('style=""'));
  assert('cardHotTap — cutterOd satırı: style=""',
    lines[1].includes('style=""'));
  assert('cardHotTap — cutterWall satırı: display:none',
    lines[2].includes('style="display:none;"'));
  assert('cardHotTap — a satırı: style=""',
    lines[3].includes('style=""'));
  assert('cardHotTap — b satırı: style=""',
    lines[4].includes('style=""'));
  assert('cardHotTap — ref1 satırı: style=""',
    lines[5].includes('style=""'));
}

// Senaryo B: Yalnızca A ve B görünür, geri kalanlar gizli
{
  const html = simulateCardHotTap(['a', 'b']);
  const lines = html.split('\n');

  assert('Senaryo B — pipeOd gizli',     lines[0].includes('style="display:none;"'));
  assert('Senaryo B — cutterOd gizli',   lines[1].includes('style="display:none;"'));
  assert('Senaryo B — cutterWall gizli', lines[2].includes('style="display:none;"'));
  assert('Senaryo B — a görünür',        lines[3].includes('style=""'));
  assert('Senaryo B — b görünür',        lines[4].includes('style=""'));
  assert('Senaryo B — ref1 gizli',       lines[5].includes('style="display:none;"'));
}

// Senaryo C: Boş liste — tüm alanlar gizli (tüm kutular işaretsiz)
{
  const html = simulateCardHotTap([]);
  assert('Boş liste — hiçbir alan style="" içermiyor',
    !html.includes('style=""'));
  assert('Boş liste — tüm alanlar display:none içeriyor',
    html.split('\n').every(l => l.includes('style="display:none;"')));
}

// Senaryo D: Tam liste — tüm alanlar görünür (hiçbir şey kaldırılmadı)
{
  const html = simulateCardHotTap(['pipeOd', 'cutterOd', 'cutterWall', 'a', 'b', 'ref1']);
  assert('Tam liste — display:none hiç yok',
    !html.includes('display:none'));
  assert('Tam liste — tüm satırlar style="" içeriyor',
    html.split('\n').every(l => l.includes('style=""')));
}

// ─── Rapor ───────────────────────────────────────────────────────────────────

export function runVisibilityTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== VİSİBİLİTY TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.detail ? ` — ${r.detail}` : '';
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
