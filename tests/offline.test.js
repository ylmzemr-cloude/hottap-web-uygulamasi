/**
 * @file offline.test.js
 * @description Offline çalışma ve senkronizasyon testleri (mock tabanlı)
 */

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = '') {
  results.push({ name, pass: !!condition, detail });
  if (condition) passed++;
  else failed++;
}

// ─── Mock offline ortamı ─────────────────────────────────────────────────────

let isOnline = true;
const pendingQueue = [];
const remoteStore = [];

function mockOffline() { isOnline = false; }
function mockOnline() { isOnline = true; }

function mockSaveCalculation(userId, data) {
  if (!isOnline) {
    const localId = 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    pendingQueue.push({ localId, userId, data, syncStatus: 'pending' });
    return { savedLocally: true, syncStatus: 'pending', localId };
  }
  remoteStore.push({ userId, data });
  return { savedLocally: false, syncStatus: 'synced' };
}

async function mockSyncPending() {
  const toSync = [...pendingQueue];
  pendingQueue.length = 0;
  toSync.forEach(item => {
    remoteStore.push({ userId: item.userId, data: item.data });
  });
  return { synced: toSync.length };
}

function getFromRemote(localId) {
  return remoteStore.find(r => r.data._localId === localId) || null;
}

// ─── Test: Offline'da lokal kayıt ────────────────────────────────────────────

mockOffline();

const mockCalc = { proje: 'TEST-001', tarih: '2026-04-26', _localId: 'lc-001' };
const saveResult = mockSaveCalculation('user-001', mockCalc);

assert('Offline: savedLocally=true',          saveResult.savedLocally === true);
assert('Offline: syncStatus=pending',         saveResult.syncStatus === 'pending');
assert('Offline: localId üretildi',           typeof saveResult.localId === 'string');
assert('Offline: pending kuyrukta 1 kayıt',   pendingQueue.length === 1);

// ─── Test: Online iken kayıt direkt gider ────────────────────────────────────

mockOnline();

const onlineResult = mockSaveCalculation('user-001', { proje: 'TEST-002' });
assert('Online: savedLocally=false',  onlineResult.savedLocally === false);
assert('Online: syncStatus=synced',   onlineResult.syncStatus === 'synced');
assert('Online: remote store arttı',  remoteStore.length === 1);

// ─── Test: Online gelince pending senkronize olur ─────────────────────────────

const syncResult = await mockSyncPending();
assert('Sync: 1 kayıt senkronize edildi',     syncResult.synced === 1);
assert('Sync: pending kuyruk boşaldı',         pendingQueue.length === 0);
assert('Sync: remote store 2 kayıt içeriyor', remoteStore.length === 2);

// ─── Test: Çoklu offline kayıt ───────────────────────────────────────────────

mockOffline();
for (let i = 0; i < 3; i++) {
  mockSaveCalculation('user-002', { proje: `OFFLINE-${i}` });
}
assert('3 offline kayıt pending kuyruğa eklendi', pendingQueue.length === 3);

mockOnline();
const multiSync = await mockSyncPending();
assert('3 kayıt senkronize edildi',  multiSync.synced === 3);
assert('Kuyruk temizlendi',          pendingQueue.length === 0);
assert('Remote store 5 kayıt',       remoteStore.length === 5);

// ─── Test: Tablo verisi offline erişimi (cache simülasyonu) ─────────────────

const mockCache = {
  'pipe_data': [{ nominal: 4 }, { nominal: 6 }, { nominal: 8 }, { nominal: 12 }]
};

function mockGetPipeData() {
  return mockCache['pipe_data'] || [];
}

mockOffline();
const pipeData = mockGetPipeData();
assert('Offline: cached tablo verisi erişilebilir', pipeData.length > 0);
assert('Offline: pipe tablosu 4 kayıt içeriyor',    pipeData.length === 4);

// ─── Rapor ────────────────────────────────────────────────────────────────────

export function runOfflineTests() {
  return { passed, failed, total: passed + failed, results };
}

if (typeof process !== 'undefined') {
  console.log('\n=== OFFLİNE TESTLERİ ===');
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✗';
    const detail = r.detail ? ` — ${r.detail}` : '';
    console.log(`  ${icon} ${r.name}${detail}`);
  });
  console.log(`\nSonuç: ${passed}/${passed + failed} geçti\n`);
}
