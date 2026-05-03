import { getCurrentUser, logoutUser } from './auth.js';
import { initTables } from './tables.js';
import { loadVisibility } from './settings.js';
import { initOffline } from './offline.js';
import { setCurrentUser, setHelpTexts, currentUser } from './state.js';
import { setupCalcFlow, setupOpSure } from './ui-calc.js';
import { setupHistory, loadHistory } from './ui-history.js';
import { setupHelpPopup } from './ui-helpers.js';
import {
  setupMessageForm, setupVisibilitySettings,
  loadAdminPending, loadAdminUsers, loadAdminCalcs, loadAdminTables,
  renderVisibilityForm,
} from './ui-admin.js';

// ─── Başlatma ────────────────────────────────────────────────────────────────

async function init() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  setCurrentUser(user);

  await initTables();
  loadHelpTexts();
  initOffline();
  renderUser();
  setupNav();
  setupCalcFlow();
  setupHelpPopup();
  setupMessageForm();
  setupOpSure();
  setupHistory();
  setupVisibilitySettings();
  await loadVisibility();
  showView('new-calc');
}

async function loadHelpTexts() {
  try {
    const res = await fetch('data/help-texts.json');
    setHelpTexts(await res.json());
  } catch (e) {
    console.error('Help texts load error', e);
  }
}

// ─── Kullanıcı Bilgisi ────────────────────────────────────────────────────────

function renderUser() {
  const profile = currentUser.profile;
  document.getElementById('headerUserName').textContent = profile.ad_soyad || '';

  if (profile.rol === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    loadAdminPending();
  }

  if (profile.rol === 'demo') {
    const banner = document.getElementById('demoBanner');
    banner.classList.remove('hidden');
    document.getElementById('demoRemaining').textContent = profile.demo_kalan_hak ?? 5;
    if ((profile.demo_kalan_hak ?? 5) <= 1) banner.classList.add('demo-banner--warning');
    if ((profile.demo_kalan_hak ?? 5) <= 0) banner.classList.add('demo-banner--exhausted');
  }

  document.getElementById('headerLogout').addEventListener('click', async () => {
    await logoutUser();
    window.location.href = 'index.html';
  });
}

// ─── Navigasyon ──────────────────────────────────────────────────────────────

function setupNav() {
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('nav-btn--active'));
      btn.classList.add('nav-btn--active');
      showView(view);

      if (view === 'history')            loadHistory();
      if (view === 'admin-pending')      loadAdminPending();
      if (view === 'admin-users')        loadAdminUsers();
      if (view === 'admin-calcs')        loadAdminCalcs();
      if (view === 'admin-tables')       loadAdminTables();
      if (view === 'admin-visibility')   renderVisibilityForm();
    });
  });
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
  const el = document.getElementById('view-' + viewId);
  if (el) el.classList.add('view--active');
}

// ─── Başlat ───────────────────────────────────────────────────────────────────

init();
