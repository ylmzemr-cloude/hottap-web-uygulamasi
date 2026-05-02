import { getCurrentUser, logoutUser, checkDemoLimit, decrementDemoHak,
         approveUser, rejectUser, deleteUser, suspendUser, renewDemoHak } from './auth.js';
import { initTables, getAllPipeData, getAllCutterData, getAllSpringData,
         getPipeRow, getCutterRow, getSpringRow } from './tables.js';
import { runHotTap, runStopple, runTapalama, runKKM, runGeriAlma, toMm } from './calculator.js';
import { calculateDelmeSuresi } from './formulas.js';
import { inchToMm, mmToInch } from './units.js';
import { supabase } from './supabase.js';
import { generatePDF } from './pdf.js';
import { initOffline, addPending, updateConnectionStatus } from './offline.js';

// ─── Uygulama Durumu ─────────────────────────────────────────────────────────

let currentUser = null;

const state = {
  step: 1,
  projeNo: '',
  operasyonTarihi: '',
  selected: { hottap: false, stopple: false, tapalama: false, 'geri-alma': false },
  operations: [],   // { id, type, index, data: {} }
  activeTabId: null,    // current page id (op.id veya 'summary')
  activePageIdx: 0,     // current page numerical index
  results: {},      // { opId: { valid, results, errors } }
  images: {},       // { opId: [{ file, url, name }] }
  editingCalc: null,  // { id, parent_id, revize_no } — düzenleme modunda
};

const MAX_IMAGES = 5;

let helpTexts = {};

// ─── Başlatma ────────────────────────────────────────────────────────────────

async function init() {
  currentUser = await getCurrentUser();

  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }

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
  showView('new-calc');
}

async function loadHelpTexts() {
  try {
    const res = await fetch('data/help-texts.json');
    helpTexts = await res.json();
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

      if (view === 'history') loadHistory();
      if (view === 'admin-pending') loadAdminPending();
      if (view === 'admin-users') loadAdminUsers();
      if (view === 'admin-calcs') loadAdminCalcs();
      if (view === 'admin-tables') loadAdminTables();
    });
  });
}

function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
  const el = document.getElementById('view-' + viewId);
  if (el) el.classList.add('view--active');
}

// ─── Hesaplama Akışı ──────────────────────────────────────────────────────────

function setupCalcFlow() {
  // Operasyon onay kutuları
  document.querySelectorAll('.op-checkbox input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.selected[cb.dataset.op] = cb.checked;
    });
  });

  // Adım 1 → 2
  document.getElementById('btnStep1Next').addEventListener('click', () => {
    if (!validateStep1()) return;
    state.projeNo = document.getElementById('projeNo').value.trim();
    state.operasyonTarihi = document.getElementById('operasyonTarihi').value;
    buildOperations();
    renderOperationCards();
    goToStep(2);
  });

  // Adım 2 → 1
  document.getElementById('btnStep2Back').addEventListener('click', () => goToStep(1));

  // Adım 2 → 3
  document.getElementById('btnStep2Next').addEventListener('click', () => {
    collectFormData();
    buildResultTabs();
    renderActiveTab();
    goToStep(3);
  });

  // Adım 3 → 2
  document.getElementById('btnStep3Back').addEventListener('click', () => goToStep(2));

  // Kaydet
  document.getElementById('btnSaveCalc').addEventListener('click', saveCalculation);
}

function validateStep1() {
  const alertEl = document.getElementById('stepProjectAlert');
  const projeNo = document.getElementById('projeNo').value.trim();
  const tarih   = document.getElementById('operasyonTarihi').value;
  const anySelected = Object.values(state.selected).some(v => v);

  if (!projeNo) {
    showEl(alertEl, 'Proje No gereklidir.');
    return false;
  }
  if (!tarih) {
    showEl(alertEl, 'Operasyon tarihi gereklidir.');
    return false;
  }
  if (!anySelected) {
    showEl(alertEl, 'En az bir operasyon seçin.');
    return false;
  }
  if (state.selected.stopple && !state.selected.hottap) {
    showEl(alertEl, 'Stopple için HotTap zorunludur. HotTap\'ı da seçin.');
    return false;
  }

  alertEl.classList.add('hidden');
  return true;
}

function goToStep(n) {
  state.step = n;
  document.getElementById('step-project').classList.toggle('hidden', n !== 1);
  document.getElementById('step-data').classList.toggle('hidden', n !== 2);
  document.getElementById('step-results').classList.toggle('hidden', n !== 3);

  document.querySelectorAll('.step-dot').forEach((dot, i) => {
    dot.classList.toggle('done',   i + 1 < n);
    dot.classList.toggle('active', i + 1 === n);
  });

  window.scrollTo(0, 0);
}

// ─── Operasyon Listesi ────────────────────────────────────────────────────────

function buildOperations() {
  // Mevcut data'yı koru (ileri-geri'de kaybolmasın)
  const prevData = {};
  for (const op of state.operations) prevData[op.type] = op.data;

  state.operations = [];
  // Seçimleri sabit sırada ekle: HotTap → Stopple → Tapalama → Tapa Geri Alma
  if (state.selected.hottap)     state.operations.push({ id: 'ht-1', type: 'hottap',    index: 1, data: prevData.hottap    || {} });
  if (state.selected.stopple)    state.operations.push({ id: 'st-1', type: 'stopple',   index: 1, data: prevData.stopple   || {} });
  if (state.selected.tapalama)   state.operations.push({ id: 'tp-1', type: 'tapalama',  index: 1, data: prevData.tapalama  || {} });
  if (state.selected['geri-alma']) state.operations.push({ id: 'ga-1', type: 'geri-alma', index: 1, data: prevData['geri-alma'] || {} });

  // Aktif olmayan operasyonların image/result kayıtlarını temizle
  const activeIds = new Set(state.operations.map(o => o.id));
  for (const k of Object.keys(state.images))  if (!activeIds.has(k)) delete state.images[k];
  for (const k of Object.keys(state.results)) if (!activeIds.has(k)) delete state.results[k];
  state.activeTabId = state.operations[0]?.id || null;
  state.activePageIdx = 0;
}

// ─── Kart Şablonları ──────────────────────────────────────────────────────────

function renderOperationCards() {
  const pipeOptions  = buildPipeOptions();
  const cutterOptions = buildCutterOptions();
  const hottapOps    = state.operations.filter(o => o.type === 'hottap');

  const html = state.operations.map(op => {
    if (op.type === 'hottap')    return cardHotTap(op, pipeOptions, cutterOptions);
    if (op.type === 'stopple')   return cardStopple(op, hottapOps);
    if (op.type === 'tapalama')  return cardTapalama(op, hottapOps, cutterOptions);
    if (op.type === 'geri-alma') return cardGeriAlma(op, cutterOptions, hottapOps);
    return '';
  }).join('');

  document.getElementById('operationCards').innerHTML = html;

  // Unit toggle olayları
  document.querySelectorAll('.unit-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.unit-toggle');
      group.querySelectorAll('.unit-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Cutter OD değişince Pipe OD ile kıyaslama + bağlı kartların >12" alanlarını güncelle
  document.querySelectorAll('.sel-cutterOd').forEach(sel => {
    sel.addEventListener('change', () => {
      validateCutterVsPipe(sel);
      updateConditionalFields();
      autofillCutterWall(sel);
    });
  });

  // Pipe OD değişince cutter listesini filtrele
  document.querySelectorAll('.sel-pipeOd').forEach(sel => {
    sel.addEventListener('change', () => filterCutterByPipe(sel));
  });

  // İlk render'dan sonra mevcut seçimlere göre conditional alanları ayarla
  updateConditionalFields();

  // Resim yükleme olayları
  document.querySelectorAll('.op-card').forEach(card => {
    const opId = card.dataset.opId;
    const fileInput = card.querySelector(`#imgInput-${opId}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleImageSelect(opId, e.target.files));
    }
  });
}

function buildPipeOptions() {
  const rows = getAllPipeData();
  return '<option value="">— Seçiniz —</option>' +
    rows.map(r => `<option value="${r.pipe_od_inch}">${r.pipe_od_inch}"  (${r.pipe_od_mm} mm)</option>`).join('');
}

function buildCutterOptions(maxInch = 999) {
  const rows = getAllCutterData().filter(r => r.cutter_nominal_inch <= maxInch);
  return '<option value="">— Seçiniz —</option>' +
    rows.map(r => `<option value="${r.cutter_nominal_inch}">${r.cutter_nominal_inch}"  (actual: ${r.cutter_actual_mm} mm)</option>`).join('');
}

function updateConditionalFields() {
  // HotTap'ın cutter OD'sini al (varsa)
  const hotTapCard = document.querySelector('.op-card[data-op-type="hottap"]');
  const hotTapCutter = hotTapCard
    ? parseFloat(hotTapCard.querySelector('.sel-cutterOd')?.value) || 0
    : 0;

  for (const op of state.operations) {
    if (op.type !== 'tapalama' && op.type !== 'geri-alma') continue;
    const card = document.querySelector(`.op-card[data-op-id="${op.id}"]`);
    if (!card) continue;

    // HotTap yoksa kendi cutter seçimine bak
    let cutterInch = hotTapCutter;
    if (!cutterInch) cutterInch = parseFloat(card.querySelector('.sel-cutterOd')?.value) || 0;

    const isLargerThan12 = cutterInch > 12;

    if (op.type === 'tapalama') {
      const fField = document.getElementById('fField-' + op.id);
      if (fField) fField.classList.toggle('hidden', !isLargerThan12);
    }
    if (op.type === 'geri-alma') {
      const springField = document.getElementById('gaSpringField-' + op.id);
      if (springField) springField.classList.toggle('hidden', !isLargerThan12);
    }
  }
}

function filterCutterByPipe(pipeSelect) {
  const opId = pipeSelect.closest('.op-card').dataset.opId;
  const pipeInch = parseFloat(pipeSelect.value) || 999;
  const cutterSel = document.querySelector(`.op-card[data-op-id="${opId}"] .sel-cutterOd`);
  if (!cutterSel) return;
  cutterSel.innerHTML = buildCutterOptions(pipeInch);
}

function validateCutterVsPipe(cutterSelect) {
  const opId = cutterSelect.closest('.op-card').dataset.opId;
  const pipeVal = parseFloat(document.querySelector(`.op-card[data-op-id="${opId}"] .sel-pipeOd`)?.value) || 0;
  const cutterVal = parseFloat(cutterSelect.value) || 0;
  const errEl = cutterSelect.parentElement.querySelector('.field-error');
  if (errEl && cutterVal > pipeVal && pipeVal > 0) {
    errEl.textContent = 'Cutter çapı boru çapından büyük olamaz.';
  } else if (errEl) {
    errEl.textContent = '';
  }
}

function autofillCutterWall(cutterSelect) {
  const opId = cutterSelect.closest('.op-card').dataset.opId;
  const nominal = parseFloat(cutterSelect.value);
  if (!nominal) return;
  const row = getAllCutterData().find(r => r.cutter_nominal_inch === nominal);
  if (!row?.cutter_wall_mm) return;
  const wallInput = document.getElementById('cutterWall-' + opId);
  if (wallInput && !wallInput.value) {
    wallInput.value = row.cutter_wall_mm;
  }
}

function helpBtn(field) {
  return `<button type="button" class="help-btn" data-field="${field}" aria-label="${field} yardım">?</button>`;
}

function unitToggle(prefix, opId, defaultUnit = 'mm') {
  const mmActive  = defaultUnit === 'mm'   ? 'active' : '';
  const inActive  = defaultUnit === 'inch' ? 'active' : '';
  return `<div class="unit-toggle" id="unit-${prefix}-${opId}">
    <button type="button" class="unit-toggle__btn ${mmActive}" data-unit="mm">mm</button>
    <button type="button" class="unit-toggle__btn ${inActive}" data-unit="inch">"</button>
  </div>`;
}

function inputRow(id, label, placeholder, field, opId, opts = {}) {
  const noteHtml = opts.note ? `<small style="display:block;font-size:11px;color:#64748b;margin-top:2px;">${opts.note}</small>` : '';
  const readOnly = opts.readonly ? 'readonly style="background:#f8fafc;color:#64748b;"' : '';
  return `<div class="field">
    <label for="${id}">${label} ${helpBtn(field)}</label>
    ${noteHtml}
    <div class="input-with-unit">
      <input type="number" id="${id}" class="input-field" step="0.001" placeholder="${placeholder}" ${readOnly}>
      ${opts.unitToggle ? unitToggle(field, opId) : `<span class="unit-badge" style="display:flex;align-items:center;padding:0 10px;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;color:#64748b;">${opts.fixedUnit || 'mm'}</span>`}
    </div>
    <span class="field-error" id="${id}Err" role="alert"></span>
  </div>`;
}

function cardHotTap(op, pipeOptions, cutterOptions) {
  const id = op.id;
  return `<div class="card op-card" data-op-id="${id}" data-op-type="hottap">
    <p class="card__title">HotTap #${op.index}</p>

    <div class="field">
      <label for="pipeOd-${id}">Pipe OD ${helpBtn('PipeOD')}</label>
      <select id="pipeOd-${id}" class="select-field sel-pipeOd">${pipeOptions}</select>
      <span class="field-error" id="pipeOd-${id}Err" role="alert"></span>
    </div>

    <div class="field">
      <label for="cutterOd-${id}">Cutter OD ${helpBtn('CutterOD')}</label>
      <select id="cutterOd-${id}" class="select-field sel-cutterOd">${cutterOptions}</select>
      <span class="field-error" id="cutterOd-${id}Err" role="alert"></span>
    </div>

    <div class="field">
      <label for="cutterWall-${id}">Cutter Et Kalınlığı ${helpBtn('CutterWall')}</label>
      <small style="display:block;font-size:11px;color:#64748b;margin-bottom:4px;">Sadece mm girilir</small>
      <div class="input-with-unit">
        <input type="number" id="cutterWall-${id}" class="input-field" step="0.001" placeholder="12.700">
        <span style="display:flex;align-items:center;padding:0 10px;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;color:#64748b;">mm</span>
      </div>
      <span class="field-error" id="cutterWall-${id}Err" role="alert"></span>
    </div>

    ${inputRow('fieldA-'+id, 'A', '317.500', 'A', id, { unitToggle: true, note: 'Pilot uç adaptörden dışarı taşıyorsa negatif değer girin' })}
    ${inputRow('fieldB-'+id, 'B', '203.200', 'B', id, { unitToggle: true })}
    ${inputRow('fieldRef1-'+id, 'Ref1', '6.350', 'Ref1', id, { unitToggle: true, note: 'Negatif değer alabilir' })}

    <details style="margin-top:12px;">
      <summary style="cursor:pointer;font-size:13px;color:#64748b;padding:8px 0;">
        ⬛ Delme Süresi (Opsiyonel)
      </summary>
      <div style="padding-top:10px;">
        <div class="field">
          <label for="kkm-${id}">KKM ${helpBtn('KKM')}</label>
          <small style="display:block;font-size:11px;color:#64748b;margin-bottom:4px;">Sadece inç girilir</small>
          <div class="input-with-unit">
            <input type="number" id="kkm-${id}" class="input-field" step="0.001" placeholder="0.000">
            <span style="display:flex;align-items:center;padding:0 10px;background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;color:#64748b;">"</span>
          </div>
        </div>
        <div class="field">
          <label for="ts-${id}">TS ${helpBtn('TS')}</label>
          <input type="number" id="ts-${id}" class="input-field" step="1" placeholder="0">
          <span class="field-error" id="ts-${id}Err" role="alert"></span>
        </div>
      </div>
    </details>

    <div class="image-uploader" data-op-id="${id}">
      <div class="image-uploader__previews" id="previews-${id}"></div>
      <label class="image-uploader__btn" for="imgInput-${id}" id="imgAddBtn-${id}">
        📷 Resim Ekle (0/5)
      </label>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple hidden>
    </div>
  </div>`;
}

function cardStopple(op, hottapOps) {
  const id = op.id;

  return `<div class="card op-card" data-op-id="${id}" data-op-type="stopple">
    <p class="card__title">Stopple — Tıkama</p>
    <p style="font-size:12px;color:#64748b;margin-bottom:14px;">Cutter OD = Pipe OD (çapa çap) zorunludur. HotTap verilerini kullanır.</p>

    ${inputRow('fieldD-'+id, 'D', '0.000', 'D', id, { unitToggle: true })}
    ${inputRow('fieldRef2-'+id, 'Ref2', '0.000', 'Ref2', id, { unitToggle: true, note: 'Negatif değer alabilir' })}

    <div class="image-uploader" data-op-id="${id}">
      <div class="image-uploader__previews" id="previews-${id}"></div>
      <label class="image-uploader__btn" for="imgInput-${id}" id="imgAddBtn-${id}">
        📷 Resim Ekle (0/5)
      </label>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple hidden>
    </div>
  </div>`;
}

function cardTapalama(op, hottapOps, cutterOptions) {
  const id = op.id;
  const hasHotTap = hottapOps.length > 0;

  // Eğer HotTap varsa cutter oradan otomatik gelir, yoksa kullanıcı seçer
  const cutterSection = hasHotTap
    ? `<p style="font-size:12px;color:#64748b;margin-bottom:14px;">HotTap'taki Cutter OD'ye göre yay otomatik belirlenir.</p>`
    : `<div class="field">
        <label for="cutterOd-${id}">Cutter OD ${helpBtn('CutterOD')}</label>
        <select id="cutterOd-${id}" class="select-field sel-cutterOd">${cutterOptions}</select>
        <span class="field-error" id="cutterOd-${id}Err" role="alert"></span>
      </div>`;

  return `<div class="card op-card" data-op-id="${id}" data-op-type="tapalama">
    <p class="card__title">Tapalama — Tamamlama</p>

    ${cutterSection}

    ${inputRow('fieldG-'+id, 'G', '0.000', 'G', id, { unitToggle: true })}
    ${inputRow('fieldH-'+id, 'H', '0.000', 'H', id, { unitToggle: true })}

    <div id="fField-${id}" class="hidden">
      ${inputRow('fieldF-'+id, 'F  (>12" cutter)', '0.000', 'F', id, { unitToggle: true })}
    </div>

    <div class="image-uploader" data-op-id="${id}">
      <div class="image-uploader__previews" id="previews-${id}"></div>
      <label class="image-uploader__btn" for="imgInput-${id}" id="imgAddBtn-${id}">
        📷 Resim Ekle (0/5)
      </label>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple hidden>
    </div>
  </div>`;
}

function cardGeriAlma(op, cutterOptions, hottapOps) {
  const id = op.id;
  const hasHotTap = hottapOps.length > 0;

  const cutterSection = hasHotTap
    ? `<p style="font-size:12px;color:#64748b;margin-bottom:14px;">HotTap'taki Cutter OD'ye göre yay otomatik belirlenir.</p>`
    : `<div class="field">
        <label for="cutterOd-${id}">Cutter OD ${helpBtn('CutterOD')}</label>
        <select id="cutterOd-${id}" class="select-field sel-cutterOd">${cutterOptions}</select>
        <span class="field-error" id="cutterOd-${id}Err" role="alert"></span>
      </div>`;

  return `<div class="card op-card" data-op-id="${id}" data-op-type="geri-alma">
    <p class="card__title">Tapa Geri Alma</p>

    ${cutterSection}

    ${inputRow('fieldM-'+id, 'M', '0.000', 'M', id, { unitToggle: true })}
    ${inputRow('fieldN-'+id, 'N', '0.000', 'N', id, { unitToggle: true })}

    <div id="gaSpringField-${id}" class="hidden">
      ${inputRow('fieldGaSpring-'+id, 'Yay (>12" cutter)', '0.000', 'Y', id, { unitToggle: true })}
    </div>

    <div class="image-uploader" data-op-id="${id}">
      <div class="image-uploader__previews" id="previews-${id}"></div>
      <label class="image-uploader__btn" for="imgInput-${id}" id="imgAddBtn-${id}">
        📷 Resim Ekle (0/5)
      </label>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple hidden>
    </div>
  </div>`;
}

// ─── Form Verisi Toplama ──────────────────────────────────────────────────────

function getUnit(prefix, opId) {
  const activeBtn = document.querySelector(`#unit-${prefix}-${opId} .unit-toggle__btn.active`);
  return activeBtn?.dataset.unit || 'mm';
}

/**
 * fieldId'den (örn: 'fieldA-ht-1') alan bazlı unit toggle'ını bulur ve mm değer döner.
 * Toggle yoksa varsayılan: mm.
 */
function getFieldMm(fieldId) {
  const val = parseFloat(document.getElementById(fieldId)?.value);
  if (isNaN(val)) return null;
  // 'fieldA-ht-1' → field='A', opId='ht-1'
  const m = fieldId.match(/^field([A-Za-z]+)-(.+)$/);
  if (!m) return val;
  const [, fieldName, opId] = m;
  const unit = getUnit(fieldName, opId);
  return unit === 'inch' ? inchToMm(val) : val;
}

function collectFormData() {
  for (const op of state.operations) {
    const id = op.id;

    if (op.type === 'hottap') {
      const pipeInch = parseFloat(document.getElementById('pipeOd-' + id)?.value) || null;
      const cutterInch = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;

      const pipeRow   = pipeInch   ? getPipeRow(pipeInch)   : null;
      const cutterRow = cutterInch ? getCutterRow(cutterInch) : null;

      op.data = {
        pipeOdNominalInch:    pipeInch,
        cutterOdNominalInch:  cutterInch,
        pipeOdMm:             pipeRow?.pipe_od_mm     ?? null,
        pipeIdMm:             pipeRow?.pipe_id_mm     ?? null,
        pipeWallMm:           pipeRow?.pipe_wall_mm   ?? null,
        cutterOdActualMm:     cutterRow?.cutter_actual_mm ?? null,
        cutterWallMm:         parseFloat(document.getElementById('cutterWall-' + id)?.value) || null,
        ref1Mm:               getFieldMm('fieldRef1-' + id),
        aMm:                  getFieldMm('fieldA-'    + id),
        bMm:                  getFieldMm('fieldB-'    + id),
        kkmInch:              parseFloat(document.getElementById('kkm-' + id)?.value) || null,
        ts:                   parseFloat(document.getElementById('ts-'  + id)?.value) || null,
      };
    }

    if (op.type === 'stopple') {
      // Tek HotTap olduğu için otomatik bağlanır
      const hotTap = state.operations.find(o => o.type === 'hottap');

      op.data = {
        linkedHottapId: hotTap?.id || null,
        ...(hotTap?.data || {}),
        dMm:    getFieldMm('fieldD-'    + id),
        ref2Mm: getFieldMm('fieldRef2-' + id),
      };
    }

    if (op.type === 'tapalama') {
      const hotTap = state.operations.find(o => o.type === 'hottap');
      // HotTap varsa cutter ondan, yoksa kullanıcı seçiminden
      const cutterFromForm = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;
      const cutterNominal = hotTap?.data?.cutterOdNominalInch ?? cutterFromForm;
      const springRow = cutterNominal ? getSpringRow(cutterNominal) : null;

      op.data = {
        linkedHottapId:      hotTap?.id || null,
        cutterOdNominalInch: cutterNominal,
        springTravelMm:      springRow?.spring_travel_mm ?? null,
        gMm:  getFieldMm('fieldG-' + id),
        hMm:  getFieldMm('fieldH-' + id),
        fMm:  getFieldMm('fieldF-' + id),
      };
    }

    if (op.type === 'geri-alma') {
      const hotTap = state.operations.find(o => o.type === 'hottap');
      const cutterFromForm = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;
      const cutterNominal = hotTap?.data?.cutterOdNominalInch ?? cutterFromForm;
      const springRow = cutterNominal ? getSpringRow(cutterNominal) : null;
      const isLargerThan12 = (cutterNominal || 0) > 12;
      // ≤12" tablodan, >12" kullanıcı girer
      const springTravelMm = isLargerThan12
        ? getFieldMm('fieldGaSpring-' + id)
        : (springRow?.spring_travel_mm ?? null);

      op.data = {
        cutterOdNominalInch: cutterNominal,
        springTravelMm,
        mMm: getFieldMm('fieldM-' + id),
        nMm: getFieldMm('fieldN-' + id),
      };
    }
  }
}

// ─── Sayfa Sayfa Sonuç Akışı ──────────────────────────────────────────────────

const OP_LABEL = { hottap: 'HT', stopple: 'ST', tapalama: 'TP', 'geri-alma': 'GA' };
const TYPE_LABEL = { hottap: 'HotTap', stopple: 'Stopple', tapalama: 'Tapalama', 'geri-alma': 'Tapa Geri Alma' };

function getResultPages() {
  // Operasyon sayfaları + en son özet/kaydet sayfası
  return [...state.operations.map(o => ({ id: o.id, type: o.type, op: o })),
          { id: 'summary', type: 'summary' }];
}

function buildResultTabs() {
  const tabsEl = document.getElementById('resultTabs');
  const pages = getResultPages();

  // İlk açılışta state.activePageIdx ayarla
  if (state.activePageIdx == null || state.activePageIdx >= pages.length) {
    state.activePageIdx = 0;
  }
  state.activeTabId = pages[state.activePageIdx]?.id || null;

  tabsEl.innerHTML = pages.map((p, i) => {
    let label, status, icon;
    if (p.type === 'summary') {
      label = 'Özet';
      const allDone = state.operations.every(o => state.results[o.id]?.valid === true);
      status = allDone ? 'done' : 'pending';
      icon = allDone ? '✓' : 'Σ';
    } else {
      label = OP_LABEL[p.type];
      status = state.results[p.id]?.valid === true ? 'done' : 'pending';
      icon = status === 'done' ? '✓' : '○';
    }
    return `<button class="tab tab--${status}${i === state.activePageIdx ? ' tab--active' : ''}"
      data-page-idx="${i}">
      <span class="tab__icon">${icon}</span>
      ${label}
    </button>`;
  }).join('');

  tabsEl.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activePageIdx = parseInt(tab.dataset.pageIdx, 10);
      renderActiveTab();
    });
  });
}

function updateTabStatus(opId, status) {
  // page index üzerinden bul
  const pages = getResultPages();
  const idx = pages.findIndex(p => p.id === opId);
  if (idx < 0) return;
  const tab = document.querySelector(`.tab[data-page-idx="${idx}"]`);
  if (!tab) return;
  tab.className = 'tab tab--' + status + (idx === state.activePageIdx ? ' tab--active' : '');
  const icons = { pending: '○', incomplete: '⚠', done: '✓' };
  tab.querySelector('.tab__icon').textContent = icons[status] || '○';
}

// ─── Sonuç Render ─────────────────────────────────────────────────────────────

function renderActiveTab() {
  const pages = getResultPages();
  const page = pages[state.activePageIdx];
  if (!page) return;

  const contentEl = document.getElementById('resultContent');

  let html;
  if (page.type === 'summary') {
    html = renderSummaryPage();
  } else {
    const op = page.op;
    const result = state.results[op.id];
    html = `<div class="card">
      <p class="card__title">${TYPE_LABEL[op.type]}</p>
      ${renderDataSummary(op)}
      ${result ? renderCalcResults(result) : `
        <button class="btn btn--primary" data-calculate-op="${op.id}">Hesapla</button>
      `}
    </div>`;
  }

  // Önceki / Sonraki butonları
  const prevDisabled = state.activePageIdx <= 0 ? 'disabled' : '';
  const nextDisabled = state.activePageIdx >= pages.length - 1 ? 'disabled' : '';
  html += `<div class="card" style="display:flex;gap:10px;justify-content:space-between;">
    <button class="btn btn--ghost" data-page-nav="prev" ${prevDisabled}>← Önceki</button>
    <button class="btn btn--ghost" data-page-nav="next" ${nextDisabled}>Sonraki →</button>
  </div>`;

  contentEl.innerHTML = html;

  // Tab durumunu da yenile (status güncel olsun)
  buildResultTabs();

  const calcBtn = contentEl.querySelector('[data-calculate-op]');
  if (calcBtn) calcBtn.addEventListener('click', () => calculateOp(calcBtn.dataset.calculateOp));

  contentEl.querySelectorAll('[data-page-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.pageNav;
      if (dir === 'prev' && state.activePageIdx > 0) state.activePageIdx--;
      if (dir === 'next' && state.activePageIdx < pages.length - 1) state.activePageIdx++;
      renderActiveTab();
      window.scrollTo(0, 0);
    });
  });

  checkAllDone();
}

function renderSummaryPage() {
  const allDone = state.operations.every(o => state.results[o.id]?.valid === true);
  const operationBlocks = state.operations.map(op => {
    const r = state.results[op.id];
    if (!r?.valid) {
      return `<div class="card" style="border-left:4px solid #f59e0b;">
        <p class="card__title">${TYPE_LABEL[op.type]}</p>
        <div class="alert alert--warning">Hesap eksik veya hatalı.</div>
      </div>`;
    }
    const vals = Object.entries(r.results || {}).map(([k, c]) => {
      if (typeof c?.result !== 'number') return '';
      const lbl = (RESULT_LABELS[k] || k);
      return `<div class="summary-row">
        <span class="summary-row__label">${lbl}</span>
        <span class="summary-row__val">${c.result.toFixed(2)} mm</span>
      </div>`;
    }).join('');
    return `<div class="card">
      <p class="card__title">${TYPE_LABEL[op.type]}</p>
      <div class="summary-list">${vals}</div>
    </div>`;
  }).join('');

  return `<div class="card">
    <p class="card__title">Tüm Sonuçlar</p>
    <p style="font-size:13px;color:#64748b;">Aşağıdaki sonuçlar PDF olarak kaydedilecek.</p>
    ${allDone ? '' : '<div class="alert alert--warning">Bazı operasyonlarda eksik hesap var. Lütfen önceki sayfalardan tamamlayın.</div>'}
  </div>
  ${operationBlocks}`;
}

const RESULT_LABELS = {
  cutterID:           'Cutter ID',
  c1:                 'C1',
  c:                  'C — Kesme Mesafesi',
  couponFree:         'Coupon Free',
  catchPosition:      'Catch Position',
  nestingSpace:       'Nesting Space',
  pilotTemas:         'Lower-in (Pilot Temas)',
  maxTapping:         'Max Tapping',
  maxTravel:          'Max Travel',
  e:                  'E',
  stoppleOlcusu:      'Total Set (Stopple)',
  tekerBoruMerkezi:   'Centerline',
  tekerTemasMesafesi: 'Roller to Bottom',
  tapalama:           'Total Set (Tapalama)',
  delmeSuresi:        'Delme Süresi (dk)',
  geriAlmaToplam:     'Geri Alma — Total Travel',
};

function renderDataSummary(op) {
  const d = op.data;
  const rows = [];

  if (op.type === 'hottap') {
    if (d.pipeOdNominalInch) rows.push(['Pipe OD', d.pipeOdNominalInch + '"  (' + (d.pipeOdMm ?? '—') + ' mm)']);
    if (d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"  (' + (d.cutterOdActualMm ?? '—') + ' mm actual)']);
    if (d.cutterWallMm != null) rows.push(['Cutter Et', d.cutterWallMm.toFixed(3) + ' mm']);
    if (d.aMm != null) rows.push(['A', d.aMm.toFixed(3) + ' mm  (' + mmToInch(d.aMm).toFixed(3) + '")']);
    if (d.bMm != null) rows.push(['B', d.bMm.toFixed(3) + ' mm  (' + mmToInch(d.bMm).toFixed(3) + '")']);
    if (d.ref1Mm != null) rows.push(['Ref1', d.ref1Mm.toFixed(3) + ' mm  (' + mmToInch(d.ref1Mm).toFixed(3) + '")']);
  }

  if (op.type === 'stopple') {
    const linked = state.operations.find(o => o.id === d.linkedHottapId);
    if (linked) rows.push(['Bağlı HotTap', 'HotTap #' + linked.index]);
    if (d.pipeOdNominalInch) rows.push(['Pipe OD', d.pipeOdNominalInch + '"']);
    if (d.dMm != null) rows.push(['D', d.dMm.toFixed(3) + ' mm']);
    if (d.ref2Mm != null) rows.push(['Ref2', d.ref2Mm.toFixed(3) + ' mm']);
  }

  if (op.type === 'tapalama') {
    if (d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"']);
    if (d.gMm != null) rows.push(['G', d.gMm.toFixed(3) + ' mm']);
    if (d.hMm != null) rows.push(['H', d.hMm.toFixed(3) + ' mm']);
    if (d.springTravelMm != null) rows.push(['Y (yay)', d.springTravelMm.toFixed(3) + ' mm']);
    if (d.fMm != null) rows.push(['F', d.fMm.toFixed(3) + ' mm']);
  }

  if (op.type === 'geri-alma') {
    if (d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"']);
    if (d.mMm != null) rows.push(['M', d.mMm.toFixed(3) + ' mm']);
    if (d.nMm != null) rows.push(['N', d.nMm.toFixed(3) + ' mm']);
    if (d.springTravelMm != null) rows.push(['Yay', d.springTravelMm.toFixed(3) + ' mm']);
  }

  if (!rows.length) return '';

  return `<div class="data-summary">
    ${rows.map(([k, v]) => `<div class="data-summary__row">
      <span class="data-summary__label">${k}</span>
      <span class="data-summary__val">${v}</span>
    </div>`).join('')}
  </div>`;
}

function renderCalcResults(result) {
  if (!result.valid) {
    const errList = Object.values(result.errors || {}).filter(Boolean).join(', ');
    return `<div class="alert alert--error">Hata: ${errList || 'Eksik veya hatalı veri.'}</div>
      <button class="btn btn--primary" data-calculate-op="${state.activeTabId}">Tekrar Hesapla</button>`;
  }

  const blocks = Object.entries(result.results || {}).map(([key, calc]) => {
    if (!calc || typeof calc.result !== 'number') return '';
    const val = calc.result.toFixed(3);
    const valInch = mmToInch(calc.result).toFixed(3);
    const stepsHtml = (calc.steps || []).map(s => `<li>${s}</li>`).join('');
    const title = RESULT_LABELS[key] || key;
    const stepsBlock = stepsHtml ? `<details class="result-steps">
      <summary>Hesap adımlarını göster</summary>
      <ul class="steps-list">${stepsHtml}</ul>
    </details>` : '';
    return `<div class="result-block">
      <div class="result-block__title">${title}</div>
      <div class="result-block__value">${val} <span style="font-size:14px;color:#64748b;">mm</span></div>
      <div class="result-block__value-sub">${valInch}"</div>
      ${stepsBlock}
    </div>`;
  }).join('');

  return blocks || '<div class="alert alert--info">Sonuç bulunamadı.</div>';
}

// ─── Hesaplama ────────────────────────────────────────────────────────────────

function calculateOp(opId) {
  const op = state.operations.find(o => o.id === opId);
  if (!op) return;

  let result;

  if (op.type === 'hottap') {
    result = runHotTap(op.data);
    // KKM varsa ekle
    if (op.data.kkmInch && op.data.ts) {
      const kkmResult = runKKM({ kkmInch: op.data.kkmInch, ts: op.data.ts });
      if (kkmResult.valid) {
        result.results = { ...result.results, ...kkmResult.results };
      }
    }
  } else if (op.type === 'stopple') {
    result = runStopple(op.data);
  } else if (op.type === 'tapalama') {
    result = runTapalama(op.data);
  } else if (op.type === 'geri-alma') {
    result = runGeriAlma(op.data);
  }

  state.results[opId] = result;
  updateTabStatus(opId, result?.valid ? 'done' : 'incomplete');
  renderActiveTab();
  checkAllDone();
}

function checkAllDone() {
  const allDone = state.operations.every(op => state.results[op.id]?.valid === true);
  document.getElementById('btnSaveCalc').disabled = !allDone;
}

// ─── Kaydet ───────────────────────────────────────────────────────────────────

async function saveCalculation() {
  const btn = document.getElementById('btnSaveCalc');
  btn.disabled = true;
  btn.classList.add('btn--loading');

  try {
    // Demo hak kontrolü
    if (currentUser.profile.rol === 'demo') {
      const { allowed, remaining } = await checkDemoLimit(currentUser.id);
      if (!allowed) {
        showToast('Demo hesaplama hakkınız dolmuştur.', 'error');
        btn.disabled = false;
        btn.classList.remove('btn--loading');
        return;
      }
    }

    // GPS konumu (sessiz, arka planda)
    let konum_lat = null, konum_lng = null;
    await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => { konum_lat = pos.coords.latitude; konum_lng = pos.coords.longitude; resolve(); },
        () => resolve(),
        { timeout: 5000, maximumAge: 60000 }
      );
    });

    // Resimleri yükle (yalnızca online ise)
    const imageUrls = navigator.onLine ? await uploadImages(currentUser.id) : {};

    const calcPayload = {
      user_id:            currentUser.id,
      user_display_name:  currentUser.profile.ad_soyad,
      proje_no:           state.projeNo,
      operasyon_tarihi:   state.operasyonTarihi,
      operasyonlar: {
        operations: state.operations.map(op => ({ ...op })),
        results: state.results,
        images: imageUrls,
      },
      konum_lat,
      konum_lng,
    };

    if (state.editingCalc) {
      calcPayload.parent_id       = state.editingCalc.parent_id;
      calcPayload.revize_no       = state.editingCalc.revize_no;
      calcPayload.revize_aciklama = state.editingCalc.revize_aciklama || null;
    }

    let savedToServer = false;
    let savedCalcId   = null;

    if (navigator.onLine) {
      const { data: calc, error } = await supabase
        .from('calculations').insert(calcPayload).select('id').single();

      if (!error) {
        savedToServer = true;
        savedCalcId   = calc.id;

        // Demo hak düşür
        if (currentUser.profile.rol === 'demo') {
          await decrementDemoHak(currentUser.id);
          const newRemaining = (currentUser.profile.demo_kalan_hak ?? 5) - 1;
          currentUser.profile.demo_kalan_hak = newRemaining;
          document.getElementById('demoRemaining').textContent = newRemaining;
        }

        // Admin'e mail (best-effort)
        supabase.functions.invoke('send-email', {
          body: {
            tip: state.editingCalc ? 'yeni_revize' : 'yeni_hesaplama',
            hesaplama: {
              id: calc.id,
              proje_no: state.projeNo,
              kullanici_adi: currentUser.profile.ad_soyad,
              operasyon_tarihi: state.operasyonTarihi,
              revize_no: state.editingCalc?.revize_no,
              revize_aciklama: state.editingCalc?.revize_aciklama,
            },
          },
        }).catch(() => {});
      } else {
        // Online ama Supabase hatası — kuyruğa ekle
        addPending(calcPayload);
        showToast('Sunucuya kaydedilemedi. Bağlantı sağlandığında otomatik gönderilecek.', 'warning');
      }
    } else {
      // Çevrimdışı — kuyruğa ekle
      addPending(calcPayload);
      showToast('Çevrimdışısınız. Bağlantı sağlandığında otomatik gönderilecek.', 'warning');
    }

    // PDF üret (indir + blob al)
    const revizeNo = state.editingCalc?.revize_no || 1;
    const pdfBlob = await generatePDF({
      projeNo:          state.projeNo,
      operasyonTarihi:  state.operasyonTarihi,
      kullanici:        currentUser.profile.ad_soyad,
      operations:       state.operations,
      results:          state.results,
      images:           imageUrls,
      revize_no:        revizeNo,
      revize_aciklama:  state.editingCalc?.revize_aciklama,
    });

    // PDF'i Storage'a yükle
    if (savedCalcId && navigator.onLine && pdfBlob) {
      try {
        const pdfPath = `${currentUser.id}/${savedCalcId}_v${revizeNo}.pdf`;
        const { error: stErr } = await supabase.storage
          .from('pdfs')
          .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true });
        if (!stErr) {
          await supabase.from('calculations')
            .update({ pdf_storage_path: pdfPath })
            .eq('id', savedCalcId);
        }
      } catch (e) {
        console.error('PDF storage upload error', e);
      }
    }

    // Revize modunu sıfırla
    state.editingCalc = null;
    document.getElementById('btnSaveCalc').textContent = 'Kaydet ve PDF İndir';

    if (savedToServer) {
      showToast('Hesaplama kaydedildi ve PDF indirildi!', 'success');
      setTimeout(() => {
        document.querySelector('.nav-btn[data-view="history"]').click();
      }, 2000);
    }

  } catch (err) {
    console.error('Save error', err);
    showToast('İşlem sırasında hata: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn--loading');
  }
}

// ─── Geçmiş ───────────────────────────────────────────────────────────────────

async function loadHistory() {
  const listEl = document.getElementById('historyList');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">Yükleniyor...</div>';

  const { data, error } = await supabase
    .from('calculations')
    .select('id, proje_no, operasyon_tarihi, sistem_kayit_zamani, revize_no, parent_id, pdf_storage_path')
    .eq('user_id', currentUser.id)
    .order('sistem_kayit_zamani', { ascending: false })
    .limit(50);

  if (error || !data?.length) {
    listEl.innerHTML = `<div class="empty-state">
      <div class="empty-state__icon">📋</div>
      <div class="empty-state__text">Henüz hesaplama kaydedilmedi.</div>
    </div>`;
    return;
  }

  listEl.innerHTML = data.map(c => {
    const revNo = c.revize_no || 1;
    const revBadge = revNo > 1 ? ` <span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;padding:1px 5px;border-radius:4px;vertical-align:middle;">R${revNo}</span>` : '';
    const pdfBtn = c.pdf_storage_path
      ? `<button class="btn btn--sm" data-dl-pdf="${c.id}" data-pdf-path="${c.pdf_storage_path}" style="font-size:11px;padding:4px 8px;">PDF</button>`
      : '';
    return `
    <div class="history-item" style="align-items:center;">
      <div class="history-item__info" style="flex:1;">
        <div class="history-item__title">${c.proje_no || '—'}${revBadge}</div>
        <div class="history-item__sub">${c.operasyon_tarihi || ''} &nbsp;·&nbsp; ${new Date(c.sistem_kayit_zamani).toLocaleDateString('tr-TR')}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
        ${pdfBtn}
        <button class="btn btn--sm btn--primary" data-revize="${c.id}" data-revize-no="${revNo}" style="font-size:11px;padding:4px 8px;">Revize Et</button>
      </div>
    </div>`;
  }).join('');

}

function setupHistory() {
  document.getElementById('historyList').addEventListener('click', e => {
    const revBtn = e.target.closest('[data-revize]');
    if (revBtn) {
      showRevizeModal(revBtn.dataset.revize, parseInt(revBtn.dataset.revizeNo));
      return;
    }
    const dlBtn = e.target.closest('[data-dl-pdf]');
    if (dlBtn) downloadPdfFromStorage(dlBtn.dataset.pdfPath);
  });
}

// ─── Revize ───────────────────────────────────────────────────────────────────

function showRevizeModal(calcId, currentRevizeNo) {
  const overlay = document.getElementById('revizeOverlay');
  const modal   = document.getElementById('revizeModal');
  document.getElementById('revizeAciklamaInput').value = '';
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');

  const close = () => {
    overlay.classList.add('hidden');
    modal.classList.add('hidden');
  };

  document.getElementById('btnRevizeIptal').onclick    = close;
  document.getElementById('btnRevizeIptalAlt').onclick = close;
  overlay.onclick = close;

  document.getElementById('btnRevizeOnayla').onclick = async () => {
    const aciklama = document.getElementById('revizeAciklamaInput').value.trim();
    close();
    await startRevize(calcId, currentRevizeNo + 1, aciklama);
  };
}

async function startRevize(calcId, yeniRevizeNo, aciklama) {
  showToast('Hesaplama yükleniyor…', 'info');

  const { data: calc, error } = await supabase
    .from('calculations')
    .select('*')
    .eq('id', calcId)
    .single();

  if (error || !calc) {
    showToast('Hesaplama yüklenemedi.', 'error');
    return;
  }

  const ops = calc.operasyonlar || {};
  state.projeNo          = calc.proje_no || '';
  state.operasyonTarihi  = calc.operasyon_tarihi || '';
  state.operations       = (ops.operations || []).map(op => ({ ...op }));
  state.results          = { ...(ops.results || {}) };
  state.images           = {};
  state.selected         = {};
  state.operations.forEach(op => { state.selected[op.type] = true; });
  state.editingCalc = {
    parent_id:       calc.parent_id || calcId,
    revize_no:       yeniRevizeNo,
    revize_aciklama: aciklama,
  };

  // Form alanlarını doldur
  document.getElementById('projeNo').value          = state.projeNo;
  document.getElementById('operasyonTarihi').value  = state.operasyonTarihi;

  // Hesaplama sekmesine geç, sonuç adımına götür
  document.querySelector('.nav-btn[data-view="calculator"]').click();
  buildResultTabs();
  renderActiveTab();
  goToStep(3);

  // Kaydet butonunu güncelle
  const saveBtn = document.getElementById('btnSaveCalc');
  saveBtn.textContent = `Revize ${yeniRevizeNo} Kaydet`;

  showToast(`Revize ${yeniRevizeNo} modu aktif. Kaydet butonuyla onaylayın.`, 'success');
}

async function downloadPdfFromStorage(pdfPath) {
  showToast('PDF indiriliyor…', 'info');
  const { data, error } = await supabase.storage.from('pdfs').download(pdfPath);
  if (error || !data) {
    showToast('PDF indirilemedi.', 'error');
    return;
  }
  const url = URL.createObjectURL(data);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = pdfPath.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Yöneticiye Mesaj ─────────────────────────────────────────────────────────

function setupMessageForm() {
  document.getElementById('btnSendMessage').addEventListener('click', async () => {
    const text = document.getElementById('messageText').value.trim();
    const alertEl = document.getElementById('messageAlert');
    if (!text) {
      showEl(alertEl, 'Mesaj boş olamaz.', 'error');
      return;
    }

    const btn = document.getElementById('btnSendMessage');
    btn.disabled = true;

    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        tip: 'yonetici_mesaj',
        kullanici: { ad_soyad: currentUser.profile.ad_soyad, email: currentUser.email },
        mesaj: text,
      },
    });

    btn.disabled = false;

    if (error) {
      showEl(alertEl, 'Mesaj gönderilemedi.', 'error');
    } else {
      showEl(alertEl, 'Mesajınız iletildi.', 'success');
      document.getElementById('messageText').value = '';
    }
  });
}

// ─── Operasyon Süresi ─────────────────────────────────────────────────────────

function setupOpSure() {
  const toggle    = document.getElementById('opSureMachineToggle');
  const feedInput = document.getElementById('opSureFeedRate');
  const feedNote  = document.getElementById('opSureFeedNote');
  const kkmInput  = document.getElementById('opSureKkm');
  const rpmInput  = document.getElementById('opSureRpm');
  const resultEl  = document.getElementById('opSureResult');
  const resultVal = document.getElementById('opSureResultValue');
  const resultSteps = document.getElementById('opSureSteps');

  let machine = 'T203';

  function applyMachine(m) {
    machine = m;
    toggle.querySelectorAll('.unit-toggle__btn').forEach(b => {
      b.classList.toggle('active', b.dataset.machine === m);
    });
    if (m === '1200') {
      feedInput.value = '0.004';
      feedInput.readOnly = true;
      feedInput.style.background = '#f8fafc';
      feedInput.style.color = '#64748b';
      feedNote.textContent = '1200 serisi için sabit 0.004"/dev — değiştirilemez';
    } else {
      feedInput.value = '';
      feedInput.readOnly = false;
      feedInput.style.background = '';
      feedInput.style.color = '';
      feedNote.textContent = 'T-203 için 0 ile 0.125" arası operatör girer';
    }
    resultEl.classList.add('hidden');
    clearOpSureErrors();
  }

  function clearOpSureErrors() {
    ['opSureKkmErr', 'opSureRpmErr', 'opSureFeedRateErr'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  toggle.querySelectorAll('.unit-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => applyMachine(btn.dataset.machine));
  });

  document.getElementById('btnOpSureHesapla').addEventListener('click', () => {
    clearOpSureErrors();
    resultEl.classList.add('hidden');

    const kkm = parseFloat(kkmInput.value);
    const rpm = parseFloat(rpmInput.value);
    const feed = parseFloat(feedInput.value);

    let valid = true;
    if (!kkm || kkm <= 0) { showFieldError('opSureKkmErr', 'Geçerli bir KKM/C değeri girin.'); valid = false; }
    if (!rpm || rpm <= 0) { showFieldError('opSureRpmErr', 'Geçerli bir RPM girin.'); valid = false; }
    if (!feed || feed <= 0) { showFieldError('opSureFeedRateErr', 'Geçerli bir Feed Rate girin.'); valid = false; }
    if (machine === 'T203' && feed > 0.125) {
      showFieldError('opSureFeedRateErr', 'T-203 için maksimum 0.125" girilebilir.');
      valid = false;
    }
    if (!valid) return;

    const calc = calculateDelmeSuresi(kkm, rpm, feed);
    resultVal.textContent = calc.result.toFixed(2);
    resultSteps.innerHTML = (calc.steps || []).map(s => `<li>${s}</li>`).join('');
    resultEl.classList.remove('hidden');
  });

  document.getElementById('btnOpSureReset').addEventListener('click', () => {
    kkmInput.value = '';
    rpmInput.value = '';
    applyMachine('T203');
  });

  // İlk durumu uygula
  applyMachine('T203');
}

// ─── Admin — Bekleyenler ──────────────────────────────────────────────────────

async function loadAdminPending() {
  const { data } = await supabase.from('users')
    .select('id, ad_soyad, email, telefon, created_at')
    .eq('onay_durumu', 'beklemede')
    .order('created_at', { ascending: false });

  const count = data?.length || 0;
  document.getElementById('pendingBadge').textContent = count;

  const listEl = document.getElementById('pendingList');
  if (!listEl) return;

  if (!count) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">✅</div><div class="empty-state__text">Bekleyen başvuru yok.</div></div>`;
    return;
  }

  listEl.innerHTML = data.map(u => `
    <div class="card" style="margin-bottom:10px;">
      <p style="font-weight:600;">${u.ad_soyad}</p>
      <p style="font-size:13px;color:#64748b;">${u.email} · ${u.telefon}</p>
      <p style="font-size:12px;color:#94a3b8;margin-top:4px;">${new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
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

async function loadAdminUsers(filter) {
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
    listEl.innerHTML = filterHtml + '<p style="color:#64748b;font-size:13px;">Kullanıcı bulunamadı.</p>';
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
      const canUpgrade = u.rol !== 'tam_kullanici';
      const canRenew   = u.rol === 'demo';
      const canSuspend = u.onay_durumu !== 'pasif' && u.onay_durumu !== 'silindi';
      return `<tr>
        <td>${u.ad_soyad}</td>
        <td style="font-size:11px;">${u.email}</td>
        <td style="font-size:12px;">${u.rol || '—'}</td>
        <td><span class="status-badge status-badge--${u.onay_durumu || 'beklemede'}">${u.onay_durumu || '—'}</span></td>
        <td style="text-align:center;">${u.demo_kalan_hak ?? '—'}</td>
        <td style="font-size:11px;">${u.son_giris ? new Date(u.son_giris).toLocaleDateString('tr-TR') : '—'}</td>
        <td style="display:flex;gap:4px;flex-wrap:wrap;min-width:160px;">
          ${canUpgrade ? `<button class="btn btn--ghost btn--sm" data-upgrade="${u.id}" title="Tam kullanıcıya yükselt">↑ Tam</button>` : ''}
          ${canRenew   ? `<button class="btn btn--ghost btn--sm" data-renew="${u.id}" title="Demo hakkını yenile">↺ Demo</button>` : ''}
          ${canSuspend ? `<button class="btn btn--ghost btn--sm" data-suspend="${u.id}" title="Yetkiyi durdur" style="color:#f59e0b;border-color:#fde68a;">⏸ Durdur</button>` : ''}
          <button class="btn btn--ghost btn--sm" data-del-user="${u.id}" style="color:#dc2626;border-color:#fecaca;" title="Sil">✕ Sil</button>
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

async function loadAdminCalcs() {
  const listEl = document.getElementById('calcsList');
  if (!listEl) return;

  listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">Yükleniyor...</div>';

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
      <td>${c.user_display_name || '—'}</td>
      <td>${c.proje_no || '—'}</td>
      <td style="font-size:11px;">${new Date(c.sistem_kayit_zamani).toLocaleString('tr-TR')}</td>
      <td style="text-align:center;">${konum}</td>
      <td><button class="btn btn--ghost btn--sm" data-pdf-calc="${c.id}">⬇ PDF</button></td>
    </tr>`;
  }

  function renderTable(rows) {
    if (!rows.length) return '<p style="color:#64748b;font-size:13px;">Eşleşen kayıt yok.</p>';
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
      : `<tr><td colspan="6" style="text-align:center;color:#64748b;">Eşleşen kayıt yok.</td></tr>`;
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
            results:         parsed.results || {},
            images:          parsed.images || {},
          });
        }
      } catch { showToast('PDF indirilemedi.', 'error'); }
      btn.disabled = false;
      btn.textContent = orig;
    });
  });
}

// ─── Admin — Tablolar ─────────────────────────────────────────────────────────

function loadAdminTables() {
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
        <td>${r.pipe_wall_mm}</td>
        <td>${r.pipe_id_mm}</td>
      </tr>`).join('')}</tbody>
    </table></div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <p style="font-weight:600;font-size:13px;">Cutter Verileri (${cutterData.length} satır)</p>
      <button class="btn btn--ghost btn--sm" id="btnExportCutter">⬇ CSV</button>
    </div>
    <div style="overflow-x:auto;"><table class="admin-table">
      <thead><tr><th>Nominal (inç)</th><th>Gerçek (mm)</th></tr></thead>
      <tbody>${cutterData.map(r => `<tr>
        <td>${r.cutter_nominal_inch}"</td><td>${r.cutter_actual_mm}</td>
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
      ['OD_inch','OD_mm','wall_mm','ID_mm'],
      pipeData.map(r => [r.pipe_od_inch,r.pipe_od_mm,r.pipe_wall_mm,r.pipe_id_mm])));

  document.getElementById('btnExportCutter')?.addEventListener('click', () =>
    csvDownload('cutter_data.csv',
      ['nominal_inch','actual_mm'],
      cutterData.map(r => [r.cutter_nominal_inch,r.cutter_actual_mm])));

  document.getElementById('btnExportSpring')?.addEventListener('click', () =>
    csvDownload('spring_data.csv',
      ['cutter_od_inch','spring_travel_inch','spring_travel_mm'],
      springData.map(r => [r.cutter_od_inch,r.spring_travel_inch,r.spring_travel_mm])));
}

function csvDownload(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ─── Yardım Popup ─────────────────────────────────────────────────────────────

function setupHelpPopup() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.help-btn');
    if (btn) openHelp(btn.dataset.field);
  });

  document.getElementById('helpPopupClose').addEventListener('click', closeHelp);
  document.getElementById('popupOverlay').addEventListener('click', closeHelp);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeHelp();
  });
}

function openHelp(field) {
  const data = helpTexts[field];
  if (!data) return;

  document.getElementById('helpPopupTitle').textContent = data.title || field;
  document.getElementById('helpPopupText').textContent  = data.text  || '';
  document.getElementById('helpPopupMeta').textContent  =
    (data.unit ? 'Birim: ' + data.unit + '  ' : '') +
    (data.note ? '· ' + data.note : '');

  const imgWrap = document.getElementById('helpPopupImgWrap');
  if (data.image) {
    const img = new Image();
    img.onload = () => { imgWrap.innerHTML = ''; imgWrap.appendChild(img); img.style.maxWidth = '100%'; img.style.maxHeight = '200px'; };
    img.onerror = () => { imgWrap.innerHTML = '<div class="help-img-placeholder">Görsel hazırlanıyor...</div>'; };
    img.src = 'public/images/help/' + data.image;
    img.alt = data.title || field;
  } else {
    imgWrap.innerHTML = '<div class="help-img-placeholder">Görsel hazırlanıyor...</div>';
  }

  document.getElementById('helpPopup').classList.remove('hidden');
  document.getElementById('popupOverlay').classList.remove('hidden');
}

function closeHelp() {
  document.getElementById('helpPopup').classList.add('hidden');
  document.getElementById('popupOverlay').classList.add('hidden');
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' toast--' + type : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function showEl(el, msg, type = 'error') {
  el.className = 'alert alert--' + type;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── Resim Yükleme ────────────────────────────────────────────────────────────

function handleImageSelect(opId, files) {
  if (!files?.length) return;

  if (!state.images[opId]) state.images[opId] = [];
  const current = state.images[opId].length;

  if (current >= MAX_IMAGES) {
    showToast(`En fazla ${MAX_IMAGES} resim ekleyebilirsiniz.`, 'error');
    return;
  }

  const allowed = MAX_IMAGES - current;
  const toAdd   = Array.from(files).slice(0, allowed);

  toAdd.forEach(file => {
    const url = URL.createObjectURL(file);
    state.images[opId].push({ file, url, name: file.name });
  });

  renderImagePreviews(opId);
  updateImageBtn(opId);
}

function renderImagePreviews(opId) {
  const container = document.getElementById('previews-' + opId);
  if (!container) return;

  const imgs = state.images[opId] || [];
  container.innerHTML = imgs.map((img, idx) => `
    <div class="image-preview">
      <img src="${img.url}" alt="${img.name}">
      <button type="button" class="image-preview__del" data-op="${opId}" data-idx="${idx}" aria-label="Sil">×</button>
    </div>
  `).join('');

  container.querySelectorAll('.image-preview__del').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.idx);
      URL.revokeObjectURL(state.images[opId][i]?.url);
      state.images[opId].splice(i, 1);
      renderImagePreviews(opId);
      updateImageBtn(opId);
    });
  });
}

function updateImageBtn(opId) {
  const btn = document.getElementById('imgAddBtn-' + opId);
  if (!btn) return;
  const count = state.images[opId]?.length || 0;
  btn.textContent = `📷 Resim Ekle (${count}/${MAX_IMAGES})`;
  btn.style.opacity = count >= MAX_IMAGES ? '0.4' : '1';
  btn.style.pointerEvents = count >= MAX_IMAGES ? 'none' : '';
}

async function uploadImages(userId) {
  const result = {};

  for (const [opId, imgs] of Object.entries(state.images)) {
    if (!imgs?.length) continue;
    result[opId] = [];

    for (const img of imgs) {
      if (!img.file) {
        result[opId].push({ url: img.url, name: img.name });
        continue;
      }

      const path = `${userId}/${Date.now()}_${img.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('hesaplama-gorselleri')
        .upload(path, img.file, { upsert: false });

      if (error) {
        console.error('Image upload error', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('hesaplama-gorselleri')
        .getPublicUrl(data.path);

      result[opId].push({ url: urlData.publicUrl, name: img.name });
    }
  }

  return result;
}

// ─── Başlat ───────────────────────────────────────────────────────────────────

init();
