import { mmToInch } from './units.js';

// html2pdf.js CDN'den yüklenir (app.html'deki <script> tag'i)
// window.html2pdf olarak erişilir

const OP_TYPE_TR = { hottap: 'HotTap', stopple: 'Stopple', tapalama: 'Tapalama' };

// ─── Ana PDF Üretim Fonksiyonu ────────────────────────────────────────────────

/**
 * Hesaplama verilerinden PDF üretir ve indirir.
 *
 * @param {object} data
 * @param {string} data.projeNo
 * @param {string} data.operasyonTarihi
 * @param {string} data.kullanici
 * @param {Array}  data.operations  - state.operations dizisi
 * @param {object} data.results     - state.results nesnesi
 * @param {object} [data.images]    - { opId: [{ url, name }] }
 */
export async function generatePDF(data) {
  if (!window.html2pdf) {
    throw new Error('html2pdf kütüphanesi yüklenemedi.');
  }

  const html = buildTemplate(data);

  const filename = `ByMEY_HotTap_${data.projeNo || 'Hesap'}_${data.operasyonTarihi || ''}.pdf`
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

  const options = {
    margin: [10, 10, 10, 10],
    filename,
    image:      { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:   { mode: ['avoid-all', 'css'] },
  };

  // HTML string olarak ver — html2pdf kendi container'ını oluşturur,
  // opacity/visibility hilelerine gerek kalmaz, boş PDF sorunu ortadan kalkar.
  await window.html2pdf().set(options).from(html).save();
}

// ─── HTML Şablon Oluşturucu ────────────────────────────────────────────────────

function buildTemplate(data) {
  const tarihStr = data.operasyonTarihi
    ? new Date(data.operasyonTarihi).toLocaleDateString('tr-TR')
    : '—';

  const operationsHtml = (data.operations || []).map(op => {
    const result = data.results?.[op.id];
    const images = data.images?.[op.id] || [];
    return buildOperationSection(op, result, images);
  }).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; }

  .pdf-header { border-bottom: 2px solid #1e40af; padding-bottom: 10px; margin-bottom: 14px; }
  .pdf-title  { font-size: 16pt; font-weight: bold; color: #1e40af; }
  .pdf-meta   { font-size: 9pt; color: #444; margin-top: 4px; display: flex; gap: 20px; flex-wrap: wrap; }

  .op-section { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
  .op-title   { font-size: 12pt; font-weight: bold; color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9pt; }
  .data-table td { padding: 3px 6px; border: 1px solid #e5e7eb; }
  .data-table td:first-child { font-weight: bold; background: #f8fafc; width: 35%; }

  .result-block { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px 10px; margin-bottom: 8px; page-break-inside: avoid; }
  .result-title { font-weight: bold; color: #166534; font-size: 9pt; margin-bottom: 4px; }
  .result-value { font-size: 13pt; font-weight: bold; font-family: 'Courier New', monospace; }
  .result-inch  { font-size: 9pt; color: #555; font-family: 'Courier New', monospace; }

  .steps { margin-top: 5px; font-size: 8pt; color: #555; line-height: 1.6; }
  .steps li { list-style: none; border-top: 1px solid #e5e7eb; padding: 2px 0; }
  .steps li:first-child { border-top: none; }

  .images-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .images-grid img { width: 120px; height: 90px; object-fit: cover; border-radius: 4px; border: 1px solid #d1d5db; }

  .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; color: #991b1b; font-size: 9pt; }

  .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8pt; color: #94a3b8; text-align: center; }
</style>
</head>
<body>

<div class="pdf-header">
  <div class="pdf-title">ByMEY HotTap Ölçüm Kartı</div>
  <div class="pdf-meta">
    <span><b>Proje No:</b> ${esc(data.projeNo || '—')}</span>
    <span><b>Tarih:</b> ${tarihStr}</span>
    <span><b>Operatör:</b> ${esc(data.kullanici || '—')}</span>
    <span><b>Oluşturulma:</b> ${new Date().toLocaleString('tr-TR')}</span>
  </div>
</div>

${operationsHtml}

<div class="footer">ByMEY HotTap Ölçüm Kartı — Gizli</div>
</body>
</html>`;
}

function buildOperationSection(op, result, images) {
  const typeStr = OP_TYPE_TR[op.type] || op.type;
  const title   = `${typeStr} #${op.index}`;

  const inputsHtml  = buildInputTable(op);
  const resultsHtml = result ? buildResultsHtml(result) : '<p style="color:#94a3b8;font-size:9pt;">Hesaplama yapılmadı.</p>';
  const imagesHtml  = images.length ? buildImagesHtml(images) : '';

  return `<div class="op-section">
  <div class="op-title">${title}</div>
  ${inputsHtml}
  ${resultsHtml}
  ${imagesHtml}
</div>`;
}

function buildInputTable(op) {
  const d = op.data || {};
  const rows = [];

  if (op.type === 'hottap') {
    if (d.pipeOdNominalInch)  rows.push(['Pipe OD',       `${d.pipeOdNominalInch}"  (${d.pipeOdMm ?? '—'} mm)`]);
    if (d.cutterOdNominalInch) rows.push(['Cutter OD',    `${d.cutterOdNominalInch}"  (actual: ${d.cutterOdActualMm ?? '—'} mm)`]);
    if (d.cutterWallMm != null) rows.push(['Cutter Et',   fmt(d.cutterWallMm) + ' mm']);
    if (d.aMm != null)         rows.push(['A',            fmtBoth(d.aMm)]);
    if (d.bMm != null)         rows.push(['B',            fmtBoth(d.bMm)]);
    if (d.ref1Mm != null)      rows.push(['Ref1',         fmtBoth(d.ref1Mm)]);
    if (d.kkmInch != null)     rows.push(['KKM',          fmt(d.kkmInch) + '"']);
    if (d.ts != null)          rows.push(['TS',           d.ts + ' tur']);
  }

  if (op.type === 'stopple') {
    if (d.pipeOdNominalInch)  rows.push(['Pipe OD',  `${d.pipeOdNominalInch}"`]);
    if (d.dMm != null)        rows.push(['D',        fmtBoth(d.dMm)]);
    if (d.ref2Mm != null)     rows.push(['Ref2',     fmtBoth(d.ref2Mm)]);
  }

  if (op.type === 'tapalama') {
    if (d.gMm != null)        rows.push(['G',    fmtBoth(d.gMm)]);
    if (d.hMm != null)        rows.push(['H',    fmtBoth(d.hMm)]);
    if (d.springTravelMm != null) rows.push(['Y (yay)', fmtBoth(d.springTravelMm)]);
    if (d.fMm != null)        rows.push(['F',    fmtBoth(d.fMm)]);
  }

  if (!rows.length) return '';

  return `<table class="data-table">
    <tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody>
  </table>`;
}

function buildResultsHtml(result) {
  if (!result.valid) {
    const errMsg = Object.values(result.errors || {}).filter(Boolean).join(', ');
    return `<div class="error-box">Hesaplama hatası: ${esc(errMsg || 'Eksik veri')}</div>`;
  }

  return Object.entries(result.results || {}).map(([key, calc]) => {
    if (!calc || typeof calc.result !== 'number') return '';
    const val  = calc.result.toFixed(3);
    const inch = mmToInch(calc.result).toFixed(3);
    const stepsHtml = (calc.steps || []).map(s => `<li>${esc(s)}</li>`).join('');

    return `<div class="result-block">
      <div class="result-title">${esc(key.toUpperCase())}</div>
      <div class="result-value">${esc(val)} <span style="font-size:10pt;font-weight:normal;">mm</span></div>
      <div class="result-inch">${esc(inch)}"</div>
      ${stepsHtml ? `<ul class="steps">${stepsHtml}</ul>` : ''}
    </div>`;
  }).join('');
}

function buildImagesHtml(images) {
  if (!images.length) return '';
  const imgs = images.map(img =>
    `<img src="${esc(img.url)}" alt="${esc(img.name || 'görsel')}">`
  ).join('');
  return `<div class="images-grid">${imgs}</div>`;
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

function fmt(val) {
  return typeof val === 'number' ? val.toFixed(3) : String(val ?? '—');
}

function fmtBoth(mm) {
  if (mm == null) return '—';
  return `${mm.toFixed(3)} mm  (${mmToInch(mm).toFixed(3)}")`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
