import { supabase } from './supabase.js';

// ─── Section tanımları ────────────────────────────────────────────────────────

export const SECTIONS = ['summary', 'results', 'ozet', 'pdf_inputs', 'pdf_results'];
export const SECTION_LABELS = {
  summary:     'Giriş\nEkranı',
  results:     'Hesap Sonuç\nEkranı',
  ozet:        'Özet\nEkranı',
  pdf_inputs:  'PDF\nGiriş',
  pdf_results: 'PDF\nSonuç',
};

// ─── Tüm kontrol edilebilir alanlar ──────────────────────────────────────────
// sections: alanın hangi sütunlarda checkbox göstereceği
// Giriş alanları → ['summary', 'pdf_inputs']
// Sonuç alanları → ['results', 'pdf_results']

export const VISIBILITY_DEFS = {
  hottap: {
    label: 'HotTap',
    fields: [
      { key: 'pipeOd',        label: 'Pipe OD',       description: 'boru dış çapı',              sections: ['summary', 'pdf_inputs'] },
      { key: 'cutterOd',      label: 'Cutter OD',     description: 'cutter nominal çapı',        sections: ['summary', 'pdf_inputs'] },
      { key: 'cutterWall',    label: 'Cutter Et',     description: 'duvar kalınlığı',            sections: ['summary', 'pdf_inputs'] },
      { key: 'a',             label: 'A',             description: 'pilot ucundan adaptöre',     sections: ['summary', 'pdf_inputs'] },
      { key: 'b',             label: 'B',             description: 'adaptörden vana altına',     sections: ['summary', 'pdf_inputs'] },
      { key: 'ref1',          label: 'Ref1',          description: 'pilot ucundan cutter yüzeyine', sections: ['summary', 'pdf_inputs'] },
      { key: 'cutterID',      label: 'Cutter ID',     description: 'cutter iç çapı',            sections: ['results', 'pdf_results'] },
      { key: 'c1',            label: 'C1',            description: 'pilot temas → boru çıkış',  sections: ['results', 'pdf_results'] },
      { key: 'c',             label: 'C',             description: 'toplam kesme mesafesi',      sections: ['results', 'pdf_results'] },
      { key: 'couponFree',    label: 'Coupon Free',   description: 'kupon serbest kalma noktası', sections: ['results', 'pdf_results'] },
      { key: 'catchPosition', label: 'Catch Position', description: 'U-teli yakalama noktası',  sections: ['results', 'pdf_results'] },
      { key: 'nestingSpace',  label: 'Nesting Space', description: 'kupon yerleşme alanı',      sections: ['results', 'pdf_results'] },
      { key: 'pilotTemas',    label: 'Lower-in',      description: 'pilot boruya temas mesafesi', sections: ['results', 'pdf_results'] },
      { key: 'maxTapping',    label: 'Max Tapping',   description: 'maksimum delme derinliği',  sections: ['results', 'pdf_results'] },
      { key: 'maxTravel',     label: 'Max Travel',    description: 'maksimum mil hareketi',     sections: ['results', 'pdf_results'] },
    ],
  },
  stopple: {
    label: 'Stopple',
    fields: [
      { key: 'linkedHottap',        label: 'Bağlı HotTap',  description: 'hangi HotTap ile ilişkili',       sections: ['summary', 'pdf_inputs'] },
      { key: 'pipeOd',              label: 'Pipe OD',        description: 'boru dış çapı',                  sections: ['summary', 'pdf_inputs'] },
      { key: 'd',                   label: 'D',              description: 'stopple mil referans ölçüsü',    sections: ['summary', 'pdf_inputs'] },
      { key: 'ref2',                label: 'Ref2',           description: 'teker referans ölçüsü',          sections: ['summary', 'pdf_inputs'] },
      { key: 'e',                   label: 'E',              description: 'boru çapından hesaplanan',       sections: ['results', 'pdf_results'] },
      { key: 'stoppleOlcusu',       label: 'Total Set',      description: 'toplam tıkama mesafesi',         sections: ['results', 'pdf_results'] },
      { key: 'tekerBoruMerkezi',    label: 'Centerline',     description: 'tekerin boru merkezine',         sections: ['results', 'pdf_results'] },
      { key: 'tekerTemasMesafesi',  label: 'Roller to Bottom', description: 'tekerin boru tabanına',        sections: ['results', 'pdf_results'] },
    ],
  },
  tapalama: {
    label: 'Tapalama',
    fields: [
      { key: 'cutterOd',    label: 'Cutter OD',    description: 'tapa gövde çapı',              sections: ['summary', 'pdf_inputs'] },
      { key: 'g',           label: 'G',            description: 'tapa referans ölçüsü 1',        sections: ['summary', 'pdf_inputs'] },
      { key: 'h',           label: 'H',            description: 'tapa referans ölçüsü 2',        sections: ['summary', 'pdf_inputs'] },
      { key: 'y',           label: 'Y — Yay',      description: 'cutter yay baskısı',           sections: ['summary', 'pdf_inputs'] },
      { key: 'f',           label: 'F',            description: '12" üzeri ek ölçü',            sections: ['summary', 'pdf_inputs'] },
      { key: 'tapalama',    label: 'Total Set',    description: 'toplam tapalama mesafesi',      sections: ['results', 'pdf_results'] },
      { key: 'delmeSuresi', label: 'Delme Süresi', description: 'KKM / RPM / feed rate hesabı', sections: ['results', 'pdf_results'] },
    ],
  },
  'geri-alma': {
    label: 'Tapa Geri Alma',
    fields: [
      { key: 'cutterOd',       label: 'Cutter OD',    description: 'tapa tutma kafası çapı',     sections: ['summary', 'pdf_inputs'] },
      { key: 'm',              label: 'M',            description: 'vana üstünden tapa tutucuya', sections: ['summary', 'pdf_inputs'] },
      { key: 'n',              label: 'N',            description: 'vana üstünden tapa yuvasına', sections: ['summary', 'pdf_inputs'] },
      { key: 'yay',            label: 'Yay',          description: 'yay seyahat mesafesi',        sections: ['summary', 'pdf_inputs'] },
      { key: 'geriAlmaToplam', label: 'Total Travel', description: 'toplam geri alma mesafesi',   sections: ['results', 'pdf_results'] },
    ],
  },
};

// ─── Varsayılan: tüm alanlar tüm section'larda açık ─────────────────────────

function buildDefault() {
  const def = {};
  for (const [opType, opDef] of Object.entries(VISIBILITY_DEFS)) {
    def[opType] = { summary: [], results: [], ozet: [], pdf_inputs: [], pdf_results: [] };
    for (const field of opDef.fields) {
      // sections dizisi hangi alanlarda varsayılan olarak işaretli olduğunu belirtir
      for (const sec of field.sections) {
        def[opType][sec].push(field.key);
      }
      // Sonuç alanları özette de varsayılan açık
      if (field.sections.includes('results') && !def[opType].ozet.includes(field.key)) {
        def[opType].ozet.push(field.key);
      }
    }
  }
  return def;
}

const DEFAULT_VISIBILITY = buildDefault();

// ─── Eksik section'ları varsayılanla tamamla ─────────────────────────────────

function mergeWithDefaults(saved) {
  const result = {};
  for (const [opType, def] of Object.entries(DEFAULT_VISIBILITY)) {
    result[opType] = {
      summary:     saved[opType]?.summary     ?? def.summary,
      results:     saved[opType]?.results     ?? def.results,
      ozet:        saved[opType]?.ozet        ?? def.ozet,
      pdf_inputs:  saved[opType]?.pdf_inputs  ?? def.pdf_inputs,
      pdf_results: saved[opType]?.pdf_results ?? def.pdf_results,
    };
  }
  return result;
}

// ─── Cache ve API ─────────────────────────────────────────────────────────────

let _cache = null;

export async function loadVisibility() {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'result_visibility')
      .single();
    _cache = mergeWithDefaults(data?.value || {});
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
