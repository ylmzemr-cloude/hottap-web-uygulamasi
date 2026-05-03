import { state, currentUser } from './state.js';
import { supabase } from './supabase.js';
import { generatePDF } from './pdf.js';
import { showToast } from './ui-helpers.js';
import { buildResultTabs, renderActiveTab, goToStep } from './ui-calc.js';

// ─── Geçmiş ───────────────────────────────────────────────────────────────────

export async function loadHistory() {
  const listEl = document.getElementById('historyList');
  listEl.innerHTML = '<div style="text-align:center;padding:20px;color:#484340;">Yükleniyor...</div>';

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
    const revNo    = c.revize_no || 1;
    const revBadge = revNo > 1
      ? ` <span style="display:inline-block;background:#B2533E;color:#fff;font-size:10px;padding:1px 5px;border-radius:4px;vertical-align:middle;">R${revNo}</span>`
      : '';
    const pdfBtn   = c.pdf_storage_path
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

export function setupHistory() {
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
  state.projeNo         = calc.proje_no || '';
  state.operasyonTarihi = calc.operasyon_tarihi || '';
  state.operations      = (ops.operations || []).map(op => ({ ...op }));
  state.results         = { ...(ops.results || {}) };
  state.images          = {};
  state.selected        = {};
  state.operations.forEach(op => { state.selected[op.type] = true; });
  state.editingCalc = {
    parent_id:       calc.parent_id || calcId,
    revize_no:       yeniRevizeNo,
    revize_aciklama: aciklama,
  };

  document.getElementById('projeNo').value         = state.projeNo;
  document.getElementById('operasyonTarihi').value = state.operasyonTarihi;

  document.querySelector('.nav-btn[data-view="new-calc"]').click();
  buildResultTabs();
  renderActiveTab();
  goToStep(3);

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
