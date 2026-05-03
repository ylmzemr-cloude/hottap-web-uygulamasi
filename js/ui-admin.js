import { currentUser } from './state.js';
import { supabase } from './supabase.js';
import { approveUser, rejectUser, deleteUser, suspendUser, renewDemoHak, restoreUser } from './auth.js';
import { generatePDF } from './pdf.js';
import { getAllPipeData, getAllCutterData, getAllSpringData } from './tables.js';
import { getVisibility, saveVisibility, VISIBILITY_DEFS } from './settings.js';
import { showToast, escHtml } from './ui-helpers.js';

// ─── Admin — Bekleyenler ──────────────────────────────────────────────────────

export async function loadAdminPending() {
  const { data } = await supabase.from('users')
    .select('id, ad_soyad, email, telefon, created_at')
    .eq('onay_durumu', 'beklemede')
    .order('created_at', { ascending: false });

  const count = data?.length || 0;
  const badge = document.getElementById('pendingBadge');
  if (badge) badge.textContent = count;

  const listEl = document.getElementById('pendingList');
  if (!listEl) return;

  if (!count) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">✅</div><div class="empty-state__text">Bekleyen başvuru yok.</div></div>`;
    return;
  }

  listEl.innerHTML = data.map(u => `
    <div class="card" style="margin-bottom:10px;">
      <p style="font-weight:600;">${escHtml(u.ad_soyad)}</p>
      <p style="font-size:13px;color:#484340;">${escHtml(u.email)} · ${escHtml(u.telefon)}</p>
      <p style="font-size:12px;color:#595450;margin-top:4px;">${new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn btn--success btn--sm" data-approve="${u.id}" data-type="tam_kullanici">Tam Kullanıcı Onayla</button>
        <button class="btn btn--ghost btn--sm" data-approve="${u.id}" data-type="demo">Demo Onayla</button>
        <button class="btn btn--danger btn--sm" data-reject="${u.id}">Reddet</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-approve]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await approveUser(btn.dataset.approve, btn.dataset.type);
      showToast('Kullanıcı onaylandı.', 'success');
      loadAdminPending();
    });
  });
  listEl.querySelectorAll('[data-reject]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await rejectUser(btn.dataset.reject);
      showToast('Kullanıcı reddedildi.');
      loadAdminPending();
    });
  });
}

// ─── Admin — Kullanıcılar ─────────────────────────────────────────────────────

let _usersFilter = 'all';

export async function loadAdminUsers(filter) {
  const listEl = document.getElementById('usersList');
  if (!listEl) return;
  if (filter !== undefined) _usersFilter = filter;

  const FILTERS = [
    { key: 'all',       label: 'Tümü' },
    { key: 'aktif',     label: 'Aktif' },
    { key: 'demo',      label: 'Demo' },
    { key: 'beklemede', label: 'Beklemede' },
    { key: 'pasif',     label: 'Pasif' },
    { key: 'silindi',   label: 'Silindi' },
  ];

  const filterHtml = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
    ${FILTERS.map(f => {
      const active = _usersFilter === f.key;
      return `<button class="btn btn--ghost btn--sm" data-user-filter="${f.key}"
        style="${active ? 'font-weight:700;border-color:var(--color-primary);color:var(--color-primary);' : ''}">${f.label}</button>`;
    }).join('')}
  </div>`;

  let query = supabase.from('users')
    .select('id, ad_soyad, email, rol, onay_durumu, demo_kalan_hak, son_giris')
    .order('ad_soyad');

  if (_usersFilter === 'aktif')      query = query.eq('onay_durumu', 'onaylandi').eq('rol', 'tam_kullanici');
  else if (_usersFilter === 'demo')      query = query.eq('rol', 'demo');
  else if (_usersFilter === 'pasif')     query = query.eq('onay_durumu', 'pasif');
  else if (_usersFilter === 'silindi')   query = query.eq('onay_durumu', 'silindi');
  else if (_usersFilter === 'beklemede') query = query.eq('onay_durumu', 'beklemede');

  const { data } = await query;

  if (!data?.length) {
    listEl.innerHTML = filterHtml + '<p style="color:#484340;font-size:13px;">Kullanıcı bulunamadı.</p>';
    listEl.querySelectorAll('[data-user-filter]').forEach(b =>
      b.addEventListener('click', () => loadAdminUsers(b.dataset.userFilter)));
    return;
  }

  const tableHtml = `<div style="overflow-x:auto;"><table class="admin-table">
    <thead><tr>
      <th>Ad Soyad</th><th>E-posta</th><th>Rol</th><th>Durum</th><th>Demo Hak</th><th>Son Giriş</th><th>İşlemler</th>
    </tr></thead>
    <tbody>
    ${data.map(u => {
      const canUpgrade = u.rol !== 'tam_kullanici' && u.onay_durumu !== 'silindi';
      const canRenew   = u.rol === 'demo';
      const canSuspend = u.onay_durumu !== 'pasif' && u.onay_durumu !== 'silindi';
      const canRestore = u.onay_durumu === 'silindi';
      return `<tr>
        <td>${escHtml(u.ad_soyad)}</td>
        <td style="font-size:11px;">${escHtml(u.email)}</td>
        <td style="font-size:12px;">${escHtml(u.rol || '—')}</td>
        <td><span class="status-badge status-badge--${u.onay_durumu || 'beklemede'}">${u.onay_durumu || '—'}</span></td>
        <td style="text-align:center;">${u.demo_kalan_hak ?? '—'}</td>
        <td style="font-size:11px;">${u.son_giris ? new Date(u.son_giris).toLocaleDateString('tr-TR') : '—'}</td>
        <td style="display:flex;gap:4px;flex-wrap:wrap;min-width:160px;">
          ${canUpgrade ? `<button class="btn btn--ghost btn--sm" data-upgrade="${u.id}" title="Tam kullanıcıya yükselt">↑ Tam</button>` : ''}
          ${canRenew   ? `<button class="btn btn--ghost btn--sm" data-renew="${u.id}" title="Demo hakkını yenile">↺ Demo</button>` : ''}
          ${canSuspend ? `<button class="btn btn--ghost btn--sm" data-suspend="${u.id}" title="Yetkiyi durdur" style="color:#7a5c12;border-color:#FCE09B;">⏸ Durdur</button>` : ''}
          ${canRestore ? `<button class="btn btn--ghost btn--sm" data-restore="${u.id}" style="color:#186F65;border-color:#a3d4cf;" title="Geri Getir">↺ Geri Getir</button>` : ''}
          <button class="btn btn--ghost btn--sm" data-del-user="${u.id}" style="color:#B2533E;border-color:#dba898;" title="Sil">✕ Sil</button>
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table></div>`;

  listEl.innerHTML = filterHtml + tableHtml;

  listEl.querySelectorAll('[data-user-filter]').forEach(b =>
    b.addEventListener('click', () => loadAdminUsers(b.dataset.userFilter)));

  listEl.querySelectorAll('[data-upgrade]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await approveUser(btn.dataset.upgrade, 'tam_kullanici');
      showToast('Tam kullanıcıya yükseltildi.', 'success');
      loadAdminUsers();
    });
  });
  listEl.querySelectorAll('[data-renew]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await renewDemoHak(btn.dataset.renew);
      showToast("Demo hakkı 5'e yenilendi.", 'success');
      loadAdminUsers();
    });
  });
  listEl.querySelectorAll('[data-suspend]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await suspendUser(btn.dataset.suspend);
      showToast('Kullanıcı yetkisi durduruldu.', 'warning');
      loadAdminUsers();
    });
  });
  listEl.querySelectorAll('[data-restore]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await restoreUser(btn.dataset.restore);
      showToast('Kullanıcı geri getirildi.', 'success');
      loadAdminUsers();
    });
  });
  listEl.querySelectorAll('[data-del-user]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
      await deleteUser(btn.dataset.delUser);
      showToast('Kullanıcı silindi.');
      loadAdminUsers();
    });
  });
}

// ─── Admin — Hesaplamalar ─────────────────────────────────────────────────────

export async function loadAdminCalcs() {
  const listEl = document.getElementById('calcsList');
  if (!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#484340;">Yükleniyor...</div>';

  const { data } = await supabase.from('calculations')
    .select('id, proje_no, operasyon_tarihi, user_display_name, sistem_kayit_zamani, konum_lat, konum_lng')
    .order('sistem_kayit_zamani', { ascending: false })
    .limit(200);

  if (!data?.length) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📊</div><div class="empty-state__text">Kayıt yok.</div></div>';
    return;
  }

  function buildRow(c) {
    const konum = (c.konum_lat && c.konum_lng)
      ? `<a href="https://maps.google.com/?q=${c.konum_lat},${c.konum_lng}" target="_blank" rel="noopener" style="font-size:16px;text-decoration:none;" title="Haritada göster">📍</a>`
      : '—';
    return `<tr>
      <td style="font-size:12px;">${c.operasyon_tarihi || '—'}</td>
      <td>${escHtml(c.user_display_name || '—')}</td>
      <td>${escHtml(c.proje_no || '—')}</td>
      <td style="font-size:11px;">${new Date(c.sistem_kayit_zamani).toLocaleString('tr-TR')}</td>
      <td style="text-align:center;">${konum}</td>
      <td><button class="btn btn--ghost btn--sm" data-pdf-calc="${c.id}">⬇ PDF</button></td>
    </tr>`;
  }

  function renderTable(rows) {
    if (!rows.length) return '<p style="color:#484340;font-size:13px;">Eşleşen kayıt yok.</p>';
    return `<div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr>
        <th>Tarih</th><th>Kullanıcı</th><th>Proje No</th><th>Kayıt Zamanı</th><th>Konum</th><th>PDF</th>
      </tr></thead>
      <tbody>${rows.map(buildRow).join('')}</tbody>
    </table></div>`;
  }

  const searchHtml = `<div style="margin-bottom:12px;">
    <input type="text" id="calcSearchInput" class="input-field"
      placeholder="Proje No veya kullanıcı ara..." style="max-width:320px;">
  </div>`;

  listEl.innerHTML = searchHtml + renderTable(data);
  attachPdfButtons(listEl);

  document.getElementById('calcSearchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = data.filter(c =>
      (c.proje_no || '').toLowerCase().includes(q) ||
      (c.user_display_name || '').toLowerCase().includes(q)
    );
    const tbody = listEl.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = filtered.length
      ? filtered.map(buildRow).join('')
      : `<tr><td colspan="6" style="text-align:center;color:#484340;">Eşleşen kayıt yok.</td></tr>`;
    attachPdfButtons(tbody);
  });
}

function attachPdfButtons(container) {
  container.querySelectorAll('[data-pdf-calc]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        const { data: calc } = await supabase.from('calculations')
          .select('*').eq('id', btn.dataset.pdfCalc).single();
        if (calc) {
          const parsed = calc.operasyonlar || {};
          await generatePDF({
            projeNo:         calc.proje_no,
            operasyonTarihi: calc.operasyon_tarihi,
            kullanici:       calc.user_display_name,
            operations:      parsed.operations || [],
            results:         parsed.results    || {},
            images:          parsed.images     || {},
            isAdmin:         currentUser?.profile?.rol === 'admin',
          });
        }
      } catch { showToast('PDF indirilemedi.', 'error'); }
      btn.disabled = false;
      btn.textContent = orig;
    });
  });
}

// ─── Admin — Tablolar ─────────────────────────────────────────────────────────

export function loadAdminTables() {
  const el = document.getElementById('tablesContent');
  if (!el) return;

  const pipeData   = getAllPipeData();
  const cutterData = getAllCutterData();
  const springData = getAllSpringData();

  el.innerHTML = `
  <div style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <p style="font-weight:600;font-size:13px;">Boru Verileri (${pipeData.length} satır)</p>
      <button class="btn btn--ghost btn--sm" id="btnExportPipe">⬇ CSV</button>
    </div>
    <div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr><th>OD (inç)</th><th>OD (mm)</th><th>Et (mm)</th><th>ID (mm)</th></tr></thead>
      <tbody>${pipeData.map(r => `<tr>
        <td>${r.pipe_od_inch}"</td><td>${r.pipe_od_mm}</td>
        <td>${r.pipe_wall_mm}</td><td>${r.pipe_id_mm}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <p style="font-weight:600;font-size:13px;">Cutter Verileri (${cutterData.length} satır)</p>
      <button class="btn btn--ghost btn--sm" id="btnExportCutter">⬇ CSV</button>
    </div>
    <div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr><th>Nominal (inç)</th><th>Gerçek (mm)</th><th>Et (mm)</th></tr></thead>
      <tbody>${cutterData.map(r => `<tr>
        <td>${r.cutter_nominal_inch}"</td><td>${r.cutter_actual_mm}</td><td>${r.cutter_wall_mm ?? '—'}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <p style="font-weight:600;font-size:13px;">Yay Verileri (${springData.length} satır)</p>
      <button class="btn btn--ghost btn--sm" id="btnExportSpring">⬇ CSV</button>
    </div>
    <div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr><th>Cutter OD (inç)</th><th>Yay Hareketi (inç)</th><th>Yay Hareketi (mm)</th></tr></thead>
      <tbody>${springData.map(r => `<tr>
        <td>${r.cutter_od_inch}"</td><td>${r.spring_travel_inch}"</td><td>${r.spring_travel_mm}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>`;

  document.getElementById('btnExportPipe')?.addEventListener('click', () =>
    csvDownload('pipe_data.csv',
      ['OD_inch', 'OD_mm', 'wall_mm', 'ID_mm'],
      pipeData.map(r => [r.pipe_od_inch, r.pipe_od_mm, r.pipe_wall_mm, r.pipe_id_mm])));

  document.getElementById('btnExportCutter')?.addEventListener('click', () =>
    csvDownload('cutter_data.csv',
      ['nominal_inch', 'actual_mm', 'wall_mm'],
      cutterData.map(r => [r.cutter_nominal_inch, r.cutter_actual_mm, r.cutter_wall_mm ?? ''])));

  document.getElementById('btnExportSpring')?.addEventListener('click', () =>
    csvDownload('spring_data.csv',
      ['cutter_od_inch', 'spring_travel_inch', 'spring_travel_mm'],
      springData.map(r => [r.cutter_od_inch, r.spring_travel_inch, r.spring_travel_mm])));
}

function csvDownload(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))];
  const blob  = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a     = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Görünüm Ayarları ─────────────────────────────────────────────────────────

export function setupVisibilitySettings() {
  const nav = document.querySelector('.nav-btn[data-view="admin-visibility"]');
  if (!nav) return;
  nav.addEventListener('click', renderVisibilityForm);
}

export function renderVisibilityForm() {
  const formEl = document.getElementById('visibilityForm');
  if (!formEl) return;

  const vis = getVisibility();
  const COLS = ['summary', 'results', 'ozet', 'pdf_inputs', 'pdf_results'];
  const COL_LABELS = {
    summary:     'Giriş\nEkranı',
    results:     'Hesap Sonuç\nEkranı',
    ozet:        'Özet\nEkranı',
    pdf_inputs:  'PDF\nGiriş',
    pdf_results: 'PDF\nSonuç',
  };

  const colStyle   = 'text-align:center;padding:4px 6px;font-size:11px;font-weight:600;color:#484340;text-transform:uppercase;letter-spacing:.05em;white-space:pre-line;line-height:1.3;';
  const cellStyle  = 'text-align:center;padding:4px 6px;';
  const labelStyle = 'padding:4px 8px;font-size:13px;';

  formEl.innerHTML = Object.entries(VISIBILITY_DEFS).map(([opType, def]) => {
    const opVis = vis[opType] || {};

    const headerRow = `<tr>
      <th style="${labelStyle}font-weight:600;color:#1a1614;"></th>
      ${COLS.map(sec => `<th style="${colStyle}">${COL_LABELS[sec]}</th>`).join('')}
    </tr>`;

    const rows = def.fields.map(f => {
      const cells = COLS.map(sec => {
        const checked = (opVis[sec] || []).includes(f.key) ? 'checked' : '';
        return `<td style="${cellStyle}">
          <input type="checkbox"
            data-op="${opType}" data-section="${sec}" data-key="${f.key}"
            ${checked} style="width:15px;height:15px;cursor:pointer;">
        </td>`;
      }).join('');
      const desc = f.description ? `<span style="color:#595450;font-size:11px;margin-left:4px;">(${f.description})</span>` : '';
      return `<tr style="border-bottom:1px solid #f2f0ed;">
        <td style="${labelStyle}">${f.label}${desc}</td>
        ${cells}
      </tr>`;
    }).join('');

    return `<div style="margin-bottom:28px;">
      <div style="font-weight:700;font-size:15px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #9e9890;">
        ${def.label}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>${headerRow}</thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  document.getElementById('btnSaveVisibility').onclick = saveVisibilityFromForm;
  document.getElementById('visibilitySaveMsg').style.display = 'none';
}

async function saveVisibilityFromForm() {
  const newVis = {};
  document.querySelectorAll('#visibilityForm input[type=checkbox]').forEach(cb => {
    const { op, section, key } = cb.dataset;
    if (!newVis[op]) newVis[op] = { summary: [], results: [], ozet: [], pdf_inputs: [], pdf_results: [] };
    if (cb.checked) newVis[op][section].push(key);
  });

  const btn = document.getElementById('btnSaveVisibility');
  btn.disabled = true;
  const ok = await saveVisibility(newVis);
  btn.disabled = false;

  const msg = document.getElementById('visibilitySaveMsg');
  msg.textContent      = ok ? 'Kaydedildi.' : 'Kayıt başarısız.';
  msg.style.color      = ok ? '#186F65' : '#B2533E';
  msg.style.display    = 'inline';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

// ─── Yöneticiye Mesaj ─────────────────────────────────────────────────────────

export function setupMessageForm() {
  const btn = document.getElementById('btnSendMessage');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const text    = document.getElementById('messageText').value.trim();
    const alertEl = document.getElementById('messageAlert');
    if (!text) {
      alertEl.className = 'alert alert--error';
      alertEl.textContent = 'Mesaj boş olamaz.';
      alertEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        tip:      'yonetici_mesaj',
        kullanici: { ad_soyad: currentUser.profile.ad_soyad, email: currentUser.email },
        mesaj:    text,
      },
    });

    btn.disabled = false;

    if (error) {
      alertEl.className = 'alert alert--error';
      alertEl.textContent = 'Mesaj gönderilemedi.';
      alertEl.classList.remove('hidden');
    } else {
      alertEl.className = 'alert alert--success';
      alertEl.textContent = 'Mesajınız iletildi.';
      alertEl.classList.remove('hidden');
      document.getElementById('messageText').value = '';
    }
  });
}
