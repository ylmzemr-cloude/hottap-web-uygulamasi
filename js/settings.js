import { supabase } from './supabase.js';

// ─── Tüm kontrol edilebilir alanların tanımı ────────────────────────────────

export const VISIBILITY_DEFS = {
  hottap: {
    label: 'HotTap',
    summary: [
      { key: 'pipeOd',     label: 'Pipe OD' },
      { key: 'cutterOd',   label: 'Cutter OD' },
      { key: 'cutterWall', label: 'Cutter Et Kalınlığı' },
      { key: 'a',          label: 'A' },
      { key: 'b',          label: 'B' },
      { key: 'ref1',       label: 'Ref1' },
    ],
    results: [
      { key: 'cutterID',      label: 'Cutter ID' },
      { key: 'c1',            label: 'C1' },
      { key: 'c',             label: 'C — Kesme Mesafesi' },
      { key: 'couponFree',    label: 'Coupon Free' },
      { key: 'catchPosition', label: 'Catch Position' },
      { key: 'nestingSpace',  label: 'Nesting Space' },
      { key: 'pilotTemas',    label: 'Lower-in (Pilot Temas)' },
      { key: 'maxTapping',    label: 'Max Tapping' },
      { key: 'maxTravel',     label: 'Max Travel' },
    ],
  },
  stopple: {
    label: 'Stopple',
    summary: [
      { key: 'linkedHottap', label: 'Bağlı HotTap' },
      { key: 'pipeOd',       label: 'Pipe OD' },
      { key: 'd',            label: 'D' },
      { key: 'ref2',         label: 'Ref2' },
    ],
    results: [
      { key: 'e',                   label: 'E' },
      { key: 'stoppleOlcusu',       label: 'Total Set (Stopple)' },
      { key: 'tekerBoruMerkezi',    label: 'Centerline' },
      { key: 'tekerTemasMesafesi',  label: 'Roller to Bottom' },
    ],
  },
  tapalama: {
    label: 'Tapalama',
    summary: [
      { key: 'cutterOd', label: 'Cutter OD' },
      { key: 'g',        label: 'G' },
      { key: 'h',        label: 'H' },
      { key: 'y',        label: 'Y (Yay)' },
      { key: 'f',        label: 'F (>12" için)' },
    ],
    results: [
      { key: 'tapalama',    label: 'Total Set (Tapalama)' },
      { key: 'delmeSuresi', label: 'Delme Süresi' },
    ],
  },
  'geri-alma': {
    label: 'Tapa Geri Alma',
    summary: [
      { key: 'cutterOd', label: 'Cutter OD' },
      { key: 'm',        label: 'M' },
      { key: 'n',        label: 'N' },
      { key: 'yay',      label: 'Yay' },
    ],
    results: [
      { key: 'geriAlmaToplam', label: 'Geri Alma — Total Travel' },
    ],
  },
};

const DEFAULT_VISIBILITY = Object.fromEntries(
  Object.entries(VISIBILITY_DEFS).map(([opType, def]) => [
    opType,
    {
      summary: def.summary.map(f => f.key),
      results: def.results.map(f => f.key),
    },
  ])
);

let _cache = null;

export async function loadVisibility() {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'result_visibility')
      .single();
    _cache = data?.value || DEFAULT_VISIBILITY;
  } catch {
    _cache = DEFAULT_VISIBILITY;
  }
  return _cache;
}

export function getVisibility() {
  return _cache || DEFAULT_VISIBILITY;
}

export async function saveVisibility(value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'result_visibility', value });
  if (!error) _cache = value;
  return !error;
}
