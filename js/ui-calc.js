import { state, currentUser, MAX_IMAGES } from './state.js';
import { supabase } from './supabase.js';
import { checkDemoLimit, decrementDemoHak } from './auth.js';
import { addPending } from './offline.js';
import { runHotTap, runStopple, runTapalama, runGeriAlma, toMm } from './calculator.js';
import { inchToMm, mmToInch } from './units.js';
import { getAllPipeData, getAllCutterData, getSpringRow } from './tables.js';
import { generatePDF } from './pdf.js';
import { getVisibility } from './settings.js';
import { calculateDelmeSuresi } from './formulas.js';
import { showToast, showEl, handleImageSelect, uploadImages } from './ui-helpers.js';

// ─── Hesaplama Akışı ──────────────────────────────────────────────────────────

export function setupCalcFlow() {
  document.querySelectorAll('.op-checkbox input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      state.selected[cb.dataset.op] = cb.checked;
    });
  });

  document.getElementById('btnStep1Next').addEventListener('click', () => {
    if (!validateStep1()) return;
    state.projeNo = document.getElementById('projeNo').value.trim();
    state.operasyonTarihi = document.getElementById('operasyonTarihi').value;
    buildOperations();
    renderOperationCards();
    goToStep(2);
  });

  document.getElementById('btnStep2Back').addEventListener('click', () => goToStep(1));

  document.getElementById('btnStep2Next').addEventListener('click', () => {
    collectFormData();
    buildResultTabs();
    renderActiveTab();
    goToStep(3);
  });

  document.getElementById('btnStep3Back').addEventListener('click', () => goToStep(2));

  document.getElementById('btnSaveCalc').addEventListener('click', saveCalculation);
}

function validateStep1() {
  const alertEl = document.getElementById('stepProjectAlert');
  const projeNo = document.getElementById('projeNo').value.trim();
  const tarih   = document.getElementById('operasyonTarihi').value;
  const anySelected = Object.values(state.selected).some(v => v);

  if (!projeNo) { showEl(alertEl, 'Proje No gereklidir.'); return false; }
  if (!tarih)   { showEl(alertEl, 'Operasyon tarihi gereklidir.'); return false; }
  if (!anySelected) { showEl(alertEl, 'En az bir operasyon seçin.'); return false; }
  alertEl.classList.add('hidden');
  return true;
}

export function goToStep(n) {
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
  const prevData = {};
  for (const op of state.operations) prevData[op.type] = op.data;

  state.operations = [];
  if (state.selected.hottap)       state.operations.push({ id: 'ht-1', type: 'hottap',    index: 1, data: prevData.hottap    || {} });
  if (state.selected.stopple)      state.operations.push({ id: 'st-1', type: 'stopple',   index: 1, data: prevData.stopple   || {} });
  if (state.selected.tapalama)     state.operations.push({ id: 'tp-1', type: 'tapalama',  index: 1, data: prevData.tapalama  || {} });
  if (state.selected['geri-alma']) state.operations.push({ id: 'ga-1', type: 'geri-alma', index: 1, data: prevData['geri-alma'] || {} });

  const activeIds = new Set(state.operations.map(o => o.id));
  for (const k of Object.keys(state.images))  if (!activeIds.has(k)) delete state.images[k];
  for (const k of Object.keys(state.results)) if (!activeIds.has(k)) delete state.results[k];
  state.activeTabId  = state.operations[0]?.id || null;
  state.activePageIdx = 0;
}

// ─── Kart Render ─────────────────────────────────────────────────────────────

function renderOperationCards() {
  const pipeOptions   = buildPipeOptions();
  const cutterOptions = buildCutterOptions();
  const hottapOps     = state.operations.filter(o => o.type === 'hottap');

  const html = state.operations.map(op => {
    if (op.type === 'hottap')    return cardHotTap(op, pipeOptions, cutterOptions);
    if (op.type === 'stopple')   return cardStopple(op, hottapOps);
    if (op.type === 'tapalama')  return cardTapalama(op, hottapOps, cutterOptions);
    if (op.type === 'geri-alma') return cardGeriAlma(op, cutterOptions, hottapOps);
    return '';
  }).join('');

  document.getElementById('operationCards').innerHTML = html;

  document.querySelectorAll('.unit-toggle__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.unit-toggle');
      group.querySelectorAll('.unit-toggle__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.querySelectorAll('.sel-cutterOd').forEach(sel => {
    sel.addEventListener('change', () => {
      validateCutterVsPipe(sel);
      updateConditionalFields();
      autofillCutterWall(sel);
    });
  });

  document.querySelectorAll('.sel-pipeOd').forEach(sel => {
    sel.addEventListener('change', () => {
      filterCutterByPipe(sel);
      const opId = sel.closest('.op-card').dataset.opId;
      const cutterSel = document.querySelector(`.op-card[data-op-id="${opId}"] .sel-cutterOd`);
      if (cutterSel) cutterSel.disabled = !sel.value;
    });
  });

  document.getElementById('operationCards').addEventListener('input', e => {
    if (e.target.classList.contains('input-field')) {
      const v = e.target.value;
      if (v.includes(',')) {
        const pos = e.target.selectionStart;
        e.target.value = v.replace(',', '.');
        try { e.target.setSelectionRange(pos, pos); } catch (_) {}
      }
    }
  });

  updateConditionalFields();

  document.querySelectorAll('.op-card').forEach(card => {
    const opId = card.dataset.opId;
    const fileInput = card.querySelector(`#imgInput-${opId}`);
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleImageSelect(opId, e.target.files));
    }
  });
}

// ─── Tablo Yardımcıları ───────────────────────────────────────────────────────

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
  const hotTapCard   = document.querySelector('.op-card[data-op-type="hottap"]');
  const hotTapCutter = hotTapCard
    ? parseFloat(hotTapCard.querySelector('.sel-cutterOd')?.value) || 0
    : 0;

  for (const op of state.operations) {
    if (op.type !== 'tapalama' && op.type !== 'geri-alma') continue;
    const card = document.querySelector(`.op-card[data-op-id="${op.id}"]`);
    if (!card) continue;

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
  const opId    = pipeSelect.closest('.op-card').dataset.opId;
  const pipeInch = parseFloat(pipeSelect.value) || null;
  const cutterSel = document.querySelector(`.op-card[data-op-id="${opId}"] .sel-cutterOd`);
  if (!cutterSel) return;
  if (!pipeInch) {
    cutterSel.innerHTML = '<option value="">— Önce Pipe OD seçin —</option>';
    cutterSel.disabled = true;
    return;
  }
  cutterSel.innerHTML = buildCutterOptions(pipeInch);
  cutterSel.disabled = false;
}

function validateCutterVsPipe(cutterSelect) {
  const opId    = cutterSelect.closest('.op-card').dataset.opId;
  const pipeVal = parseFloat(document.querySelector(`.op-card[data-op-id="${opId}"] .sel-pipeOd`)?.value) || 0;
  const cutterVal = parseFloat(cutterSelect.value) || 0;
  const errEl   = cutterSelect.parentElement.querySelector('.field-error');
  if (errEl && cutterVal > pipeVal && pipeVal > 0) {
    errEl.textContent = 'Cutter çapı boru çapından büyük olamaz.';
  } else if (errEl) {
    errEl.textContent = '';
  }
}

function autofillCutterWall(cutterSelect) {
  const opId    = cutterSelect.closest('.op-card').dataset.opId;
  const nominal = parseFloat(cutterSelect.value);
  if (!nominal) return;
  const row = getAllCutterData().find(r => r.cutter_nominal_inch === nominal);
  if (!row?.cutter_wall_mm) return;
  const wallInput = document.getElementById('cutterWall-' + opId);
  if (wallInput) wallInput.value = row.cutter_wall_mm;
}

// ─── Kart HTML Şablonları ─────────────────────────────────────────────────────

function helpBtn(key) {
  return `<button type="button" class="help-btn" data-field="${key}" aria-label="${key} yardım">?</button>`;
}

function unitToggle(id, defaultUnit = 'mm') {
  const mmActive  = defaultUnit === 'mm'   ? ' active' : '';
  const inActive  = defaultUnit === 'inch' ? ' active' : '';
  return `<div class="unit-toggle" id="unit-${id}">
    <button type="button" class="unit-toggle__btn${mmActive}" data-unit="mm">mm</button>
    <button type="button" class="unit-toggle__btn${inActive}" data-unit="inch">"</button>
  </div>`;
}

function inputRow(label, id, opts = {}) {
  const { placeholder = '', help = false, toggle = false, defaultUnit = 'mm', wrapperStyle = '' } = opts;
  const helpHtml   = help   ? helpBtn(help)           : '';
  const toggleHtml = toggle ? unitToggle(id, defaultUnit) : '';
  return `<div class="input-row" id="row-${id}"${wrapperStyle ? ` style="${wrapperStyle}"` : ''}>
    <label for="${id}">${label}${helpHtml}</label>
    <div style="display:flex;gap:6px;align-items:center;">
      ${toggleHtml}
      <input type="number" id="${id}" class="input-field" placeholder="${placeholder}" inputmode="decimal" step="any">
    </div>
    <div class="field-error" id="err-${id}"></div>
  </div>`;
}

export function cardHotTap(op, pipeOptions, cutterOptions) {
  const id = op.id;
  const isAdmin = currentUser?.profile?.rol === 'admin';
  const sv  = isAdmin ? null : (getVisibility()['hottap']?.summary || []);
  const vis = (key) => isAdmin || (sv && sv.includes(key)) ? '' : 'display:none;';

  return `<div class="op-card" data-op-id="${id}" data-op-type="hottap">
    <p class="card__title">HotTap #${op.index}</p>

    <div class="input-row" id="row-pipeOd-${id}" style="${vis('pipeOd')}">
      <label for="pipeOd-${id}">Pipe OD ${helpBtn('pipeOd')}</label>
      <select id="pipeOd-${id}" class="input-field sel-pipeOd">${pipeOptions}</select>
    </div>

    <div class="input-row" id="row-cutterOd-${id}" style="${vis('cutterOd')}">
      <label for="cutterOd-${id}">Cutter OD ${helpBtn('cutterOd')}</label>
      <select id="cutterOd-${id}" class="input-field sel-cutterOd" disabled>${cutterOptions}</select>
      <div class="field-error"></div>
    </div>

    <div class="input-row" id="row-cutterWall-${id}" style="${vis('cutterWall')}">
      <label for="cutterWall-${id}">Cutter Et Kalınlığı (mm) ${helpBtn('cutterWall')}</label>
      <input type="number" id="cutterWall-${id}" class="input-field" placeholder="Otomatik dolar" inputmode="decimal" step="any">
    </div>

    ${inputRow('A (mm / inch)', 'fieldA-' + id, { help: 'a', toggle: true, placeholder: '0.000', wrapperStyle: vis('a') })}
    ${inputRow('B (mm / inch)', 'fieldB-' + id, { help: 'b', toggle: true, placeholder: '0.000', wrapperStyle: vis('b') })}
    ${inputRow('Ref1 (mm / inch)', 'fieldRef1-' + id, { help: 'ref1', toggle: true, placeholder: '0.000', wrapperStyle: vis('ref1') })}

    <div class="image-section">
      <button type="button" class="btn btn--ghost btn--sm" id="imgAddBtn-${id}">📷 Resim Ekle (0/${MAX_IMAGES})</button>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple style="display:none;">
      <div id="previews-${id}" class="image-previews"></div>
    </div>
  </div>`;
}

export function cardStopple(op, hottapOps) {
  const id = op.id;
  const isAdmin = currentUser?.profile?.rol === 'admin';
  const sv  = isAdmin ? null : (getVisibility()['stopple']?.summary || []);
  const vis = (key) => isAdmin || (sv && sv.includes(key)) ? '' : 'display:none;';

  const linkedOptions = hottapOps.length
    ? hottapOps.map(h => `<option value="${h.id}">HotTap #${h.index}</option>`).join('')
    : '<option value="">— HotTap yok —</option>';

  return `<div class="op-card" data-op-id="${id}" data-op-type="stopple">
    <p class="card__title">Stopple #${op.index}</p>

    <div class="input-row" id="row-linkedHottap-${id}" style="${vis('linkedHottap')}">
      <label for="linkedHottap-${id}">Bağlı HotTap</label>
      <select id="linkedHottap-${id}" class="input-field">${linkedOptions}</select>
    </div>

    <div class="input-row" id="row-pipeOd-${id}" style="${vis('pipeOd')}">
      <label for="pipeOd-${id}">Pipe OD ${helpBtn('pipeOd')}</label>
      <select id="pipeOd-${id}" class="input-field sel-stPipeOd">
        <option value="">— Seçiniz (opsiyonel) —</option>
        ${getAllPipeData().map(r => `<option value="${r.pipe_od_inch}">${r.pipe_od_inch}"</option>`).join('')}
      </select>
    </div>

    ${inputRow('D (mm / inch)', 'fieldD-' + id, { help: 'd', toggle: true, placeholder: '0.000', wrapperStyle: vis('d') })}
    ${inputRow('Ref2 (mm / inch)', 'fieldRef2-' + id, { help: 'ref2', toggle: true, placeholder: '0.000', wrapperStyle: vis('ref2') })}

    <div class="image-section">
      <button type="button" class="btn btn--ghost btn--sm" id="imgAddBtn-${id}">📷 Resim Ekle (0/${MAX_IMAGES})</button>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple style="display:none;">
      <div id="previews-${id}" class="image-previews"></div>
    </div>
  </div>`;
}

export function cardTapalama(op, hottapOps, cutterOptions) {
  const id = op.id;
  const isAdmin = currentUser?.profile?.rol === 'admin';
  const sv  = isAdmin ? null : (getVisibility()['tapalama']?.summary || []);
  const vis = (key) => isAdmin || (sv && sv.includes(key)) ? '' : 'display:none;';

  return `<div class="op-card" data-op-id="${id}" data-op-type="tapalama">
    <p class="card__title">Tapalama #${op.index}</p>

    <div class="input-row" id="row-cutterOd-${id}" style="${vis('cutterOd')}">
      <label for="cutterOd-${id}">Cutter OD ${helpBtn('cutterOd')}</label>
      <select id="cutterOd-${id}" class="input-field sel-cutterOd">${cutterOptions}</select>
      <div class="field-error"></div>
    </div>

    ${inputRow('G (mm / inch)', 'fieldG-' + id, { help: 'g', toggle: true, placeholder: '0.000', wrapperStyle: vis('g') })}
    ${inputRow('H (mm / inch)', 'fieldH-' + id, { help: 'h', toggle: true, placeholder: '0.000', wrapperStyle: vis('h') })}

    <div id="fField-${id}" class="hidden">
      ${inputRow('F (mm / inch)', 'fieldF-' + id, { help: 'f', toggle: true, placeholder: '0.000', wrapperStyle: vis('f') })}
    </div>

    <div class="image-section">
      <button type="button" class="btn btn--ghost btn--sm" id="imgAddBtn-${id}">📷 Resim Ekle (0/${MAX_IMAGES})</button>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple style="display:none;">
      <div id="previews-${id}" class="image-previews"></div>
    </div>
  </div>`;
}

export function cardGeriAlma(op, cutterOptions, hottapOps) {
  const id = op.id;
  const isAdmin = currentUser?.profile?.rol === 'admin';
  const sv  = isAdmin ? null : (getVisibility()['geri-alma']?.summary || []);
  const vis = (key) => isAdmin || (sv && sv.includes(key)) ? '' : 'display:none;';

  return `<div class="op-card" data-op-id="${id}" data-op-type="geri-alma">
    <p class="card__title">Tapa Geri Alma #${op.index}</p>

    <div class="input-row" id="row-cutterOd-${id}" style="${vis('cutterOd')}">
      <label for="cutterOd-${id}">Cutter OD ${helpBtn('cutterOd')}</label>
      <select id="cutterOd-${id}" class="input-field sel-cutterOd">${cutterOptions}</select>
      <div class="field-error"></div>
    </div>

    ${inputRow('M (mm / inch)', 'fieldM-' + id, { help: 'm', toggle: true, placeholder: '0.000', wrapperStyle: vis('m') })}
    ${inputRow('N (mm / inch)', 'fieldN-' + id, { help: 'n', toggle: true, placeholder: '0.000', wrapperStyle: vis('n') })}

    <div id="gaSpringField-${id}" class="hidden">
      ${inputRow('Yay Seyahat (inch)', 'fieldGaSpring-' + id, { help: 'yay', toggle: false, placeholder: '0.000', wrapperStyle: vis('yay') })}
    </div>

    <div class="image-section">
      <button type="button" class="btn btn--ghost btn--sm" id="imgAddBtn-${id}">📷 Resim Ekle (0/${MAX_IMAGES})</button>
      <input type="file" id="imgInput-${id}" accept="image/*" multiple style="display:none;">
      <div id="previews-${id}" class="image-previews"></div>
    </div>
  </div>`;
}

// ─── Form Veri Toplama ────────────────────────────────────────────────────────

function getUnit(toggleId) {
  const toggle = document.getElementById('unit-' + toggleId);
  if (!toggle) return 'mm';
  return toggle.querySelector('.unit-toggle__btn.active')?.dataset.unit || 'mm';
}

function getFieldMm(fieldId) {
  const unit = getUnit(fieldId);
  const val  = parseFloat(document.getElementById(fieldId)?.value);
  if (!val) return null;
  return unit === 'mm' ? val : inchToMm(val);
}

function collectFormData() {
  for (const op of state.operations) {
    const id = op.id;

    if (op.type === 'hottap') {
      const pipeInch   = parseFloat(document.getElementById('pipeOd-' + id)?.value) || null;
      const cutterInch = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;
      const pipeRow    = pipeInch   ? getAllPipeData().find(r => r.pipe_od_inch === pipeInch)     : null;
      const cutterRow  = cutterInch ? getAllCutterData().find(r => r.cutter_nominal_inch === cutterInch) : null;

      op.data = {
        pipeOdNominalInch:  pipeInch,
        pipeOdMm:           pipeRow?.pipe_od_mm     ?? null,
        pipeWallMm:         pipeRow?.pipe_wall_mm   ?? null,
        pipeIdMm:           pipeRow?.pipe_id_mm     ?? null,
        cutterOdNominalInch: cutterInch,
        cutterOdActualMm:   cutterRow?.cutter_actual_mm ?? null,
        cutterWallMm:       parseFloat(document.getElementById('cutterWall-' + id)?.value) || null,
        aMm:    getFieldMm('fieldA-'    + id),
        bMm:    getFieldMm('fieldB-'    + id),
        ref1Mm: getFieldMm('fieldRef1-' + id),
      };
    }

    if (op.type === 'stopple') {
      const linkedId   = document.getElementById('linkedHottap-' + id)?.value || null;
      const linkedOp   = state.operations.find(o => o.id === linkedId);
      const pipeInch   = linkedOp?.data?.pipeOdNominalInch
        || parseFloat(document.getElementById('pipeOd-' + id)?.value) || null;
      const pipeRow    = pipeInch ? getAllPipeData().find(r => r.pipe_od_inch === pipeInch) : null;
      const bMm        = linkedOp?.data?.bMm ?? null;

      op.data = {
        linkedHottapId:    linkedId,
        pipeOdNominalInch: pipeInch,
        pipeOdMm:          pipeRow?.pipe_od_mm   ?? null,
        pipeWallMm:        pipeRow?.pipe_wall_mm ?? null,
        pipeIdMm:          pipeRow?.pipe_id_mm   ?? null,
        bMm,
        dMm:    getFieldMm('fieldD-'    + id),
        ref2Mm: getFieldMm('fieldRef2-' + id),
      };
    }

    if (op.type === 'tapalama') {
      const cutterNominal = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;
      const springRow     = cutterNominal ? getSpringRow(cutterNominal) : null;
      const isLargerThan12 = (cutterNominal || 0) > 12;
      const springTravelMm = isLargerThan12
        ? getFieldMm('fieldF-' + id)
        : (springRow?.spring_travel_mm ?? null);

      op.data = {
        cutterOdNominalInch: cutterNominal,
        springTravelMm,
        gMm: getFieldMm('fieldG-' + id),
        hMm: getFieldMm('fieldH-' + id),
        fMm: getFieldMm('fieldF-' + id),
      };
    }

    if (op.type === 'geri-alma') {
      const cutterNominal  = parseFloat(document.getElementById('cutterOd-' + id)?.value) || null;
      const springRow      = cutterNominal ? getSpringRow(cutterNominal) : null;
      const isLargerThan12 = (cutterNominal || 0) > 12;
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

// ─── Sayfa / Sekme Yönetimi ───────────────────────────────────────────────────

const OP_LABEL   = { hottap: 'HT', stopple: 'ST', tapalama: 'TP', 'geri-alma': 'GA' };
const TYPE_LABEL = { hottap: 'HotTap', stopple: 'Stopple', tapalama: 'Tapalama', 'geri-alma': 'Tapa Geri Alma' };

function getResultPages() {
  return [...state.operations.map(o => ({ id: o.id, type: o.type, op: o })),
          { id: 'summary', type: 'summary' }];
}

export function buildResultTabs() {
  const tabsEl = document.getElementById('resultTabs');
  const pages  = getResultPages();

  if (state.activePageIdx == null || state.activePageIdx >= pages.length) state.activePageIdx = 0;
  state.activeTabId = pages[state.activePageIdx]?.id || null;

  tabsEl.innerHTML = pages.map((p, i) => {
    let label, status, icon;
    if (p.type === 'summary') {
      label  = 'Özet';
      const allDone = state.operations.every(o => state.results[o.id]?.valid === true);
      status = allDone ? 'done' : 'pending';
      icon   = allDone ? '✓' : 'Σ';
    } else {
      label  = OP_LABEL[p.type];
      status = state.results[p.id]?.valid === true ? 'done' : 'pending';
      icon   = status === 'done' ? '✓' : '○';
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
  const pages = getResultPages();
  const idx   = pages.findIndex(p => p.id === opId);
  if (idx < 0) return;
  const tab = document.querySelector(`.tab[data-page-idx="${idx}"]`);
  if (!tab) return;
  tab.className = 'tab tab--' + status + (idx === state.activePageIdx ? ' tab--active' : '');
  const icons = { pending: '○', incomplete: '⚠', done: '✓' };
  tab.querySelector('.tab__icon').textContent = icons[status] || '○';
}

// ─── Sonuç Render ─────────────────────────────────────────────────────────────

export function renderActiveTab() {
  const pages   = getResultPages();
  const page    = pages[state.activePageIdx];
  if (!page) return;

  const contentEl = document.getElementById('resultContent');

  let html;
  if (page.type === 'summary') {
    html = renderSummaryPage();
  } else {
    const op     = page.op;
    const result = state.results[op.id];
    html = `<div class="card">
      <p class="card__title">${TYPE_LABEL[op.type]}</p>
      ${renderDataSummary(op)}
      ${result ? renderCalcResults(result, op.type) : `
        <button class="btn btn--primary" data-calculate-op="${op.id}">Hesapla</button>
      `}
    </div>`;
  }

  const prevDisabled = state.activePageIdx <= 0 ? 'disabled' : '';
  const nextDisabled = state.activePageIdx >= pages.length - 1 ? 'disabled' : '';
  html += `<div class="card" style="display:flex;gap:10px;justify-content:space-between;">
    <button class="btn btn--ghost" data-page-nav="prev" ${prevDisabled}>← Önceki</button>
    <button class="btn btn--ghost" data-page-nav="next" ${nextDisabled}>Sonraki →</button>
  </div>`;

  contentEl.innerHTML = html;
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
      return `<div class="card" style="border-left:4px solid #FCE09B;">
        <p class="card__title">${TYPE_LABEL[op.type]}</p>
        <div class="alert alert--warning">Hesap eksik veya hatalı.</div>
      </div>`;
    }
    const isAdmin      = currentUser?.profile?.rol === 'admin';
    const ozetAllowed  = isAdmin ? null : (getVisibility()[op.type]?.ozet || []);
    const vals = Object.entries(r.results || {}).map(([k, c]) => {
      if (typeof c?.result !== 'number') return '';
      if (!isAdmin && ozetAllowed && !ozetAllowed.includes(k)) return '';
      return `<div class="summary-row">
        <span class="summary-row__label">${RESULT_LABELS[k] || k}</span>
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
    <p style="font-size:13px;color:#484340;">Aşağıdaki sonuçlar PDF olarak kaydedilecek.</p>
    ${allDone ? '' : '<div class="alert alert--warning">Bazı operasyonlarda eksik hesap var.</div>'}
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
  geriAlmaToplam:     'Geri Alma — Total Travel',
};

const RESULT_FORMULAS = {
  cutterID:           'Cutter ID = Cutter OD − 2 × Et',
  c1:                 'C1 = (Pipe OD/2) − √[(Pipe ID/2)² − (Cutter OD/2)²]',
  c:                  'C = C1 + Ref1',
  couponFree:         'Coupon Free = √[(Pipe OD/2)² − (Cutter OD/2)²]',
  catchPosition:      'Catch Position = Coupon Free + Ref1 − Pipe Wall',
  nestingSpace:       'Nesting Space = Coupon Free + 25.4',
  pilotTemas:         'Lower-in = A + B',
  maxTapping:         'Max Tapping = Pipe OD/2 + Ref1 + 3.175',
  maxTravel:          'Max Travel = A + B + Pipe OD/2 + Ref1 + 3.175',
  e:                  'E = Pipe OD − Pipe Wall',
  stoppleOlcusu:      'Total Set = D + B + E',
  tekerBoruMerkezi:   'Centerline = Ref2 + B + Pipe OD/2',
  tekerTemasMesafesi: 'Roller to Bottom = E + B + Ref2',
  tapalama:           'Total Set = G + H + Y',
  geriAlmaToplam:     'Total Travel = M + N + Yay',
};

function renderDataSummary(op) {
  const d    = op.data;
  const rows = [];
  const isAdmin  = currentUser?.profile?.rol === 'admin';
  const allowed  = isAdmin ? null : (getVisibility()[op.type]?.summary || []);
  const show = (key) => isAdmin || (allowed && allowed.includes(key));

  if (op.type === 'hottap') {
    if (show('pipeOd')     && d.pipeOdNominalInch)  rows.push(['Pipe OD',    d.pipeOdNominalInch + '"  (' + (d.pipeOdMm ?? '—') + ' mm)']);
    if (show('cutterOd')   && d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"  (' + (d.cutterOdActualMm ?? '—') + ' mm actual)']);
    if (show('cutterWall') && d.cutterWallMm != null) rows.push(['Cutter Et', d.cutterWallMm.toFixed(3) + ' mm']);
    if (show('a')   && d.aMm   != null) rows.push(['A',    d.aMm.toFixed(3)   + ' mm  (' + mmToInch(d.aMm).toFixed(3)   + '")']);
    if (show('b')   && d.bMm   != null) rows.push(['B',    d.bMm.toFixed(3)   + ' mm  (' + mmToInch(d.bMm).toFixed(3)   + '")']);
    if (show('ref1') && d.ref1Mm != null) rows.push(['Ref1', d.ref1Mm.toFixed(3) + ' mm  (' + mmToInch(d.ref1Mm).toFixed(3) + '")']);
  }
  if (op.type === 'stopple') {
    const linked = state.operations.find(o => o.id === d.linkedHottapId);
    if (show('linkedHottap') && linked)          rows.push(['Bağlı HotTap', 'HotTap #' + linked.index]);
    if (show('pipeOd') && d.pipeOdNominalInch)   rows.push(['Pipe OD', d.pipeOdNominalInch + '"']);
    if (show('d')    && d.dMm    != null)         rows.push(['D',    d.dMm.toFixed(3)    + ' mm']);
    if (show('ref2') && d.ref2Mm != null)         rows.push(['Ref2', d.ref2Mm.toFixed(3) + ' mm']);
  }
  if (op.type === 'tapalama') {
    if (show('cutterOd') && d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"']);
    if (show('g') && d.gMm != null)               rows.push(['G', d.gMm.toFixed(3) + ' mm']);
    if (show('h') && d.hMm != null)               rows.push(['H', d.hMm.toFixed(3) + ' mm']);
    if (show('y') && d.springTravelMm != null)    rows.push(['Y (yay)', d.springTravelMm.toFixed(3) + ' mm']);
    if (show('f') && d.fMm != null)               rows.push(['F', d.fMm.toFixed(3) + ' mm']);
  }
  if (op.type === 'geri-alma') {
    if (show('cutterOd') && d.cutterOdNominalInch) rows.push(['Cutter OD', d.cutterOdNominalInch + '"']);
    if (show('m') && d.mMm != null)               rows.push(['M', d.mMm.toFixed(3) + ' mm']);
    if (show('n') && d.nMm != null)               rows.push(['N', d.nMm.toFixed(3) + ' mm']);
    if (show('yay') && d.springTravelMm != null)  rows.push(['Yay', d.springTravelMm.toFixed(3) + ' mm']);
  }

  if (!rows.length) return '';
  return `<div class="data-summary">
    ${rows.map(([k, v]) => `<div class="data-summary__row">
      <span class="data-summary__label">${k}</span>
      <span class="data-summary__val">${v}</span>
    </div>`).join('')}
  </div>`;
}

function renderCalcResults(result, opType) {
  if (!result.valid) {
    const errList = Object.values(result.errors || {}).filter(Boolean).join(', ');
    return `<div class="alert alert--error">Hata: ${errList || 'Eksik veya hatalı veri.'}</div>
      <button class="btn btn--primary" data-calculate-op="${state.activeTabId}">Tekrar Hesapla</button>`;
  }

  const isAdmin  = currentUser?.profile?.rol === 'admin';
  const allowed  = isAdmin ? null : (getVisibility()[opType]?.results || []);

  const blocks = Object.entries(result.results || {}).map(([key, calc]) => {
    if (!calc || typeof calc.result !== 'number') return '';
    if (!isAdmin && allowed && !allowed.includes(key)) return '';
    const val      = calc.result.toFixed(3);
    const valInch  = mmToInch(calc.result).toFixed(3);
    const title    = RESULT_LABELS[key] || key;
    const formula  = RESULT_FORMULAS[key];
    const formulaHtml = formula
      ? `<div style="font-size:11px;color:#484340;margin-top:3px;font-family:monospace;">${formula}</div>`
      : '';
    const stepsHtml  = (calc.steps || []).map(s => `<li>${s}</li>`).join('');
    const stepsBlock = isAdmin && stepsHtml ? `<details class="result-steps">
      <summary>Hesap adımlarını göster</summary>
      <ul class="steps-list">${stepsHtml}</ul>
    </details>` : '';
    return `<div class="result-block">
      <div class="result-block__title">${title}</div>
      <div class="result-block__value">${val} <span style="font-size:14px;color:#484340;">mm</span></div>
      <div class="result-block__value-sub">${valInch}"</div>
      ${formulaHtml}
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
  if (op.type === 'hottap')    result = runHotTap(op.data);
  else if (op.type === 'stopple')   result = runStopple(op.data);
  else if (op.type === 'tapalama')  result = runTapalama(op.data);
  else if (op.type === 'geri-alma') result = runGeriAlma(op.data);

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
    if (currentUser.profile.rol === 'demo') {
      const { allowed } = await checkDemoLimit(currentUser.id);
      if (!allowed) {
        showToast('Demo hesaplama hakkınız dolmuştur.', 'error');
        btn.disabled = false;
        btn.classList.remove('btn--loading');
        return;
      }
    }

    let konum_lat = null, konum_lng = null;
    await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => { konum_lat = pos.coords.latitude; konum_lng = pos.coords.longitude; resolve(); },
        () => resolve(),
        { timeout: 5000, maximumAge: 60000 }
      );
    });

    const imageUrls  = navigator.onLine ? await uploadImages(currentUser.id) : {};

    const calcPayload = {
      user_id:           currentUser.id,
      user_display_name: currentUser.profile.ad_soyad,
      proje_no:          state.projeNo,
      operasyon_tarihi:  state.operasyonTarihi,
      operasyonlar: {
        operations: state.operations.map(op => ({ ...op })),
        results:    state.results,
        images:     imageUrls,
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

        if (currentUser.profile.rol === 'demo') {
          await decrementDemoHak(currentUser.id);
          const newRemaining = (currentUser.profile.demo_kalan_hak ?? 5) - 1;
          currentUser.profile.demo_kalan_hak = newRemaining;
          document.getElementById('demoRemaining').textContent = newRemaining;
        }

        supabase.functions.invoke('send-email', {
          body: {
            tip: state.editingCalc ? 'yeni_revize' : 'yeni_hesaplama',
            hesaplama: {
              id:               calc.id,
              proje_no:         state.projeNo,
              kullanici_adi:    currentUser.profile.ad_soyad,
              operasyon_tarihi: state.operasyonTarihi,
              revize_no:        state.editingCalc?.revize_no,
              revize_aciklama:  state.editingCalc?.revize_aciklama,
            },
          },
        }).catch(err => console.warn('Mail gönderilemedi:', err));
      } else {
        addPending(calcPayload);
        showToast('Sunucuya kaydedilemedi. Bağlantı sağlandığında otomatik gönderilecek.', 'warning');
      }
    } else {
      addPending(calcPayload);
      showToast('Çevrimdışısınız. Bağlantı sağlandığında otomatik gönderilecek.', 'warning');
    }

    const revizeNo = state.editingCalc?.revize_no || 1;
    const pdfBlob  = await generatePDF({
      projeNo:         state.projeNo,
      operasyonTarihi: state.operasyonTarihi,
      kullanici:       currentUser.profile.ad_soyad,
      operations:      state.operations,
      results:         state.results,
      images:          imageUrls,
      revize_no:       revizeNo,
      revize_aciklama: state.editingCalc?.revize_aciklama,
      isAdmin:         currentUser?.profile?.rol === 'admin',
    });

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

// ─── Operasyon Süresi ─────────────────────────────────────────────────────────

export function setupOpSure() {
  const toggle    = document.getElementById('opSureMachineToggle');
  const feedInput = document.getElementById('opSureFeedRate');
  const feedNote  = document.getElementById('opSureFeedNote');
  const kkmInput  = document.getElementById('opSureKkm');
  const rpmInput  = document.getElementById('opSureRpm');
  const resultEl  = document.getElementById('opSureResult');
  const resultVal = document.getElementById('opSureResultValue');
  const resultSteps = document.getElementById('opSureSteps');

  if (!toggle) return;

  let machine = 'T203';

  function applyMachine(m) {
    machine = m;
    toggle.querySelectorAll('.unit-toggle__btn').forEach(b => {
      b.classList.toggle('active', b.dataset.machine === m);
    });
    if (m === '1200') {
      feedInput.value    = '0.004';
      feedInput.readOnly = true;
      feedInput.style.background = '#f7f6f2';
      feedInput.style.color      = '#484340';
      feedNote.textContent = '1200 serisi için sabit 0.004"/dev — değiştirilemez';
    } else {
      feedInput.value    = '';
      feedInput.readOnly = false;
      feedInput.style.background = '';
      feedInput.style.color      = '';
      feedNote.textContent = 'T-203 için 0 ile 0.125" arası operatör girer';
    }
    resultEl.classList.add('hidden');
    clearErrors();
  }

  function clearErrors() {
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
    clearErrors();
    resultEl.classList.add('hidden');

    const kkm  = parseFloat(kkmInput.value);
    const rpm  = parseFloat(rpmInput.value);
    const feed = parseFloat(feedInput.value);

    let valid = true;
    if (!kkm  || kkm  <= 0) { showFieldError('opSureKkmErr',      'Geçerli bir KKM/C değeri girin.'); valid = false; }
    if (!rpm  || rpm  <= 0) { showFieldError('opSureRpmErr',      'Geçerli bir RPM girin.');          valid = false; }
    if (!feed || feed <= 0) { showFieldError('opSureFeedRateErr',  'Geçerli bir Feed Rate girin.');    valid = false; }
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

  applyMachine('T203');
}
