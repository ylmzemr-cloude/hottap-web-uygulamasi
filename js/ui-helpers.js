import { state, currentUser, helpTexts, MAX_IMAGES } from './state.js';
import { supabase } from './supabase.js';

// ─── XSS önleme ───────────────────────────────────────────────────────────────

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Toast & Alert ────────────────────────────────────────────────────────────

export function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ' toast--' + type : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

export function showEl(el, msg, type = 'error') {
  el.className = 'alert alert--' + type;
  el.textContent = msg;
  el.classList.remove('hidden');
}

// ─── Yardım Popup ─────────────────────────────────────────────────────────────

export function setupHelpPopup() {
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

// ─── Resim Yükleme ────────────────────────────────────────────────────────────

export function handleImageSelect(opId, files) {
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

export function renderImagePreviews(opId) {
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

export function updateImageBtn(opId) {
  const btn = document.getElementById('imgAddBtn-' + opId);
  if (!btn) return;
  const count = state.images[opId]?.length || 0;
  btn.textContent = `📷 Resim Ekle (${count}/${MAX_IMAGES})`;
  btn.style.opacity = count >= MAX_IMAGES ? '0.4' : '1';
  btn.style.pointerEvents = count >= MAX_IMAGES ? 'none' : '';
}

export async function uploadImages(userId) {
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
