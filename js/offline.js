import { supabase } from './supabase.js';

const STORAGE_KEY = 'bymey_pending_calcs';

// ─── LocalStorage İşlemleri ───────────────────────────────────────────────────

function loadPending() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePendingList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getPendingCount() {
  return loadPending().length;
}

export function addPending(calcData) {
  const list = loadPending();
  list.push({
    localId: crypto.randomUUID(),
    timestamp: Date.now(),
    data: calcData,
  });
  savePendingList(list);
  updateConnectionStatus();
}

function markSynced(localId) {
  const list = loadPending().filter(item => item.localId !== localId);
  savePendingList(list);
}

// ─── Senkronizasyon ───────────────────────────────────────────────────────────

export async function syncPending() {
  if (!navigator.onLine) return;
  const list = loadPending();
  if (!list.length) return;

  for (const item of list) {
    try {
      const { error } = await supabase.from('calculations').insert(item.data);
      if (!error) {
        markSynced(item.localId);
        // Admin mail (best-effort, hata görmezden gelinir)
        supabase.functions.invoke('send-email', {
          body: {
            tip: 'yeni_hesaplama',
            hesaplama: {
              proje_no:         item.data.proje_no,
              kullanici_adi:    item.data.user_display_name,
              operasyon_tarihi: item.data.operasyon_tarihi,
            },
          },
        }).catch(() => {});
      }
    } catch {
      // Bir sonraki online event'inde tekrar denenecek
    }
  }

  updateConnectionStatus();
}

// ─── Bağlantı Göstergesi ─────────────────────────────────────────────────────

export function updateConnectionStatus() {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  const pending = getPendingCount();

  if (navigator.onLine) {
    el.textContent = '● Bağlı';
    el.className = 'status-indicator status-indicator--online';
  } else {
    el.textContent = pending > 0
      ? `📡 Çevrimdışı — ${pending} kayıt bekliyor`
      : '📡 Çevrimdışı';
    el.className = 'status-indicator status-indicator--offline';
  }
}

// ─── Başlatma ────────────────────────────────────────────────────────────────

export function initOffline() {
  window.addEventListener('online', () => {
    updateConnectionStatus();
    syncPending();
  });
  window.addEventListener('offline', updateConnectionStatus);
  updateConnectionStatus();

  // Sayfa açılışında bekleyen kayıtları göndermeyi dene
  if (navigator.onLine) syncPending();
}
