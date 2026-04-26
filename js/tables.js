import { supabase } from './supabase.js';

const LS_KEY_PIPE    = 'hottap_pipe_data';
const LS_KEY_CUTTER  = 'hottap_cutter_data';
const LS_KEY_SPRING  = 'hottap_spring_data';
const LS_UPDATED_AT  = 'hottap_tables_updated_at';

// ─── Statik yedek veri (Supabase erişilemezse kullanılır) ─────────────────────

const STATIC_PIPE = [
  { pipe_od_inch: 4,  pipe_od_mm: 114.3, pipe_wall_mm: 4.37, pipe_id_mm: 105.56 },
  { pipe_od_inch: 6,  pipe_od_mm: 168.3, pipe_wall_mm: 4.37, pipe_id_mm: 159.56 },
  { pipe_od_inch: 8,  pipe_od_mm: 219.1, pipe_wall_mm: 4.78, pipe_id_mm: 209.54 },
  { pipe_od_inch: 12, pipe_od_mm: 323.8, pipe_wall_mm: 5.56, pipe_id_mm: 312.68 },
  { pipe_od_inch: 16, pipe_od_mm: 406.4, pipe_wall_mm: 6.35, pipe_id_mm: 393.70 },
  { pipe_od_inch: 20, pipe_od_mm: 508.0, pipe_wall_mm: 7.14, pipe_id_mm: 493.72 },
  { pipe_od_inch: 24, pipe_od_mm: 609.6, pipe_wall_mm: 7.92, pipe_id_mm: 593.76 },
  { pipe_od_inch: 28, pipe_od_mm: 711.2, pipe_wall_mm: 9.52, pipe_id_mm: 692.16 },
];

const STATIC_CUTTER = [
  { cutter_nominal_inch: 4,  cutter_actual_mm: 98   },
  { cutter_nominal_inch: 6,  cutter_actual_mm: 149  },
  { cutter_nominal_inch: 8,  cutter_actual_mm: 197  },
  { cutter_nominal_inch: 10, cutter_actual_mm: 248  },
  { cutter_nominal_inch: 12, cutter_actual_mm: 299  },
  { cutter_nominal_inch: 14, cutter_actual_mm: 332  },
  { cutter_nominal_inch: 16, cutter_actual_mm: 383  },
  { cutter_nominal_inch: 18, cutter_actual_mm: 432  },
  { cutter_nominal_inch: 20, cutter_actual_mm: 483  },
  { cutter_nominal_inch: 22, cutter_actual_mm: 533  },
  { cutter_nominal_inch: 24, cutter_actual_mm: 584  },
  { cutter_nominal_inch: 26, cutter_actual_mm: 635  },
  { cutter_nominal_inch: 28, cutter_actual_mm: 686  },
  { cutter_nominal_inch: 30, cutter_actual_mm: 737  },
  { cutter_nominal_inch: 32, cutter_actual_mm: 787  },
  { cutter_nominal_inch: 34, cutter_actual_mm: 838  },
  { cutter_nominal_inch: 36, cutter_actual_mm: 889  },
  { cutter_nominal_inch: 38, cutter_actual_mm: 937  },
  { cutter_nominal_inch: 40, cutter_actual_mm: 987  },
  { cutter_nominal_inch: 42, cutter_actual_mm: 1038 },
];

// 12" üzeri için yay baskısı yoktur
const STATIC_SPRING = [
  { cutter_od_inch: 4,  spring_travel_inch: 0.750, spring_travel_mm: 19.05 },
  { cutter_od_inch: 6,  spring_travel_inch: 0.750, spring_travel_mm: 19.05 },
  { cutter_od_inch: 8,  spring_travel_inch: 0.750, spring_travel_mm: 19.05 },
  { cutter_od_inch: 10, spring_travel_inch: 1.000, spring_travel_mm: 25.40 },
  { cutter_od_inch: 12, spring_travel_inch: 1.000, spring_travel_mm: 25.40 },
];

// ─── Bellek içi cache ─────────────────────────────────────────────────────────

let _pipe   = null;
let _cutter = null;
let _spring = null;

function loadFromLocalStorage() {
  try {
    const p = localStorage.getItem(LS_KEY_PIPE);
    const c = localStorage.getItem(LS_KEY_CUTTER);
    const s = localStorage.getItem(LS_KEY_SPRING);
    if (p) _pipe   = JSON.parse(p);
    if (c) _cutter = JSON.parse(c);
    if (s) _spring = JSON.parse(s);
  } catch (e) {
    console.error('Tables: localStorage read error', e);
  }
}

function saveToLocalStorage(pipe, cutter, spring) {
  try {
    localStorage.setItem(LS_KEY_PIPE,   JSON.stringify(pipe));
    localStorage.setItem(LS_KEY_CUTTER, JSON.stringify(cutter));
    localStorage.setItem(LS_KEY_SPRING, JSON.stringify(spring));
    localStorage.setItem(LS_UPDATED_AT, new Date().toISOString());
  } catch (e) {
    console.error('Tables: localStorage write error', e);
  }
}

// ─── Supabase'den çekme ───────────────────────────────────────────────────────

async function fetchFromSupabase() {
  const [pipeRes, cutterRes, springRes] = await Promise.all([
    supabase.from('pipe_data').select('*'),
    supabase.from('cutter_data').select('*'),
    supabase.from('spring_data').select('*'),
  ]);

  if (pipeRes.error || cutterRes.error || springRes.error) {
    throw new Error('Supabase tablo verisi alinamadi');
  }

  return {
    pipe:   pipeRes.data,
    cutter: cutterRes.data,
    spring: springRes.data,
  };
}

// ─── Başlatma ─────────────────────────────────────────────────────────────────

/**
 * Tabloları başlatır.
 * 1. Önce localStorage'dan okur (hızlı, offline uyumlu).
 * 2. Sonra arka planda Supabase'den günceller.
 */
export async function initTables() {
  loadFromLocalStorage();

  if (!_pipe) {
    _pipe   = STATIC_PIPE;
    _cutter = STATIC_CUTTER;
    _spring = STATIC_SPRING;
    console.log('Tables: using static fallback data');
  }

  // Arka planda Supabase'den güncelle
  fetchFromSupabase()
    .then(({ pipe, cutter, spring }) => {
      _pipe   = pipe;
      _cutter = cutter;
      _spring = spring;
      saveToLocalStorage(pipe, cutter, spring);
      console.log('Tables: updated from Supabase');
    })
    .catch(() => {
      console.log('Tables: offline, using cached data');
    });
}

// ─── Lookup fonksiyonları ─────────────────────────────────────────────────────

export function getAllPipeData() {
  return _pipe || STATIC_PIPE;
}

export function getAllCutterData() {
  return _cutter || STATIC_CUTTER;
}

export function getAllSpringData() {
  return _spring || STATIC_SPRING;
}

/**
 * @param {number} nominalInch - örn: 12
 * @returns {object|null} pipe_data satırı
 */
export function getPipeRow(nominalInch) {
  const data = _pipe || STATIC_PIPE;
  return data.find(r => r.pipe_od_inch === nominalInch) || null;
}

/**
 * @param {number} nominalInch - örn: 12
 * @returns {object|null} cutter_data satırı
 */
export function getCutterRow(nominalInch) {
  const data = _cutter || STATIC_CUTTER;
  return data.find(r => r.cutter_nominal_inch === nominalInch) || null;
}

/**
 * @param {number} cutterNominalInch - örn: 12
 * @returns {object|null} spring_data satırı; 12" üzeri için null döner
 */
export function getSpringRow(cutterNominalInch) {
  if (cutterNominalInch > 12) return null;
  const data = _spring || STATIC_SPRING;
  return data.find(r => r.cutter_od_inch === cutterNominalInch) || null;
}

/**
 * Admin: pipe_data satırını günceller (Supabase + cache)
 * @param {number} nominalInch
 * @param {object} updates
 */
export async function updatePipeRow(nominalInch, updates) {
  const { error } = await supabase
    .from('pipe_data')
    .update(updates)
    .eq('pipe_od_inch', nominalInch);
  if (error) throw error;
  const fresh = await fetchFromSupabase();
  _pipe   = fresh.pipe;
  _cutter = fresh.cutter;
  _spring = fresh.spring;
  saveToLocalStorage(_pipe, _cutter, _spring);
}

/**
 * Admin: cutter_data satırını günceller (Supabase + cache)
 */
export async function updateCutterRow(nominalInch, updates) {
  const { error } = await supabase
    .from('cutter_data')
    .update(updates)
    .eq('cutter_nominal_inch', nominalInch);
  if (error) throw error;
  const fresh = await fetchFromSupabase();
  _pipe   = fresh.pipe;
  _cutter = fresh.cutter;
  _spring = fresh.spring;
  saveToLocalStorage(_pipe, _cutter, _spring);
}

/**
 * Admin: spring_data satırını günceller (Supabase + cache)
 */
export async function updateSpringRow(cutterOdInch, updates) {
  const { error } = await supabase
    .from('spring_data')
    .update(updates)
    .eq('cutter_od_inch', cutterOdInch);
  if (error) throw error;
  const fresh = await fetchFromSupabase();
  _pipe   = fresh.pipe;
  _cutter = fresh.cutter;
  _spring = fresh.spring;
  saveToLocalStorage(_pipe, _cutter, _spring);
}
