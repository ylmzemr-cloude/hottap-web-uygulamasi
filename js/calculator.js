import {
  calculateCutterID,
  calculateC1,
  calculateC,
  calculateE,
  calculateCouponFree,
  calculateCatchPosition,
  calculateNestingSpace,
  calculatePilotTemas,
  calculateMaxTapping,
  calculateMaxTravel,
  calculateStoppleOlcusu,
  calculateTekerBoruMerkezi,
  calculateTekerTemasMesafesi,
  calculateTapalama,
  calculateGeriAlmaToplam,
} from './formulas.js';

import { inchToMm } from './units.js';
import { validateOperation } from './validation.js';

// ─── HotTap ───────────────────────────────────────────────────────────────────

/**
 * HotTap hesaplaması yapar.
 *
 * @param {object} p
 * @param {number} p.pipeOdMm          - Boru dış çapı (tablo)
 * @param {number} p.pipeIdMm          - Boru iç çapı (tablo)
 * @param {number} p.pipeWallMm        - Boru et kalınlığı (tablo)
 * @param {number} p.cutterOdActualMm  - Cutter gerçek OD (tablo)
 * @param {number} p.cutterWallMm      - Cutter et kalınlığı (SADECE mm)
 * @param {number} p.ref1Mm            - Ref1 ölçüsü, negatif olabilir
 * @param {number} p.aMm               - A ölçüsü
 * @param {number} p.bMm               - B ölçüsü
 * @param {number} p.pipeOdNominalInch - Nominal boru çapı (validasyon için)
 * @param {number} p.cutterOdNominalInch - Nominal cutter çapı (validasyon için)
 * @returns {{ valid: boolean, errors: object, results: object|null }}
 */
export function runHotTap(p) {
  const { valid, errors } = validateOperation('hottap', {
    pipeOd:      p.pipeOdNominalInch,
    cutterOd:    p.cutterOdNominalInch,
    cutterWallMm: p.cutterWallMm,
    A:           p.aMm,
    B:           p.bMm,
    ref1:        p.ref1Mm,
  });
  if (!valid) return { valid: false, errors, results: null };

  const cutterID    = calculateCutterID(p.cutterOdActualMm, p.cutterWallMm);
  const c1          = calculateC1(p.pipeOdMm, p.pipeIdMm, p.cutterOdActualMm);
  const c           = calculateC(c1.result, p.ref1Mm);
  const couponFree    = calculateCouponFree(p.pipeOdMm, p.cutterOdActualMm);
  const catchPosition = calculateCatchPosition(couponFree.result, p.ref1Mm, p.pipeWallMm);
  const nestingSpace  = calculateNestingSpace(couponFree.result);
  const pilotTemas    = calculatePilotTemas(p.aMm, p.bMm);
  const maxTapping    = calculateMaxTapping(p.pipeOdMm, p.ref1Mm);
  const maxTravel     = calculateMaxTravel(p.aMm, p.bMm, p.pipeOdMm, p.ref1Mm);

  return {
    valid: true,
    errors: {},
    results: { cutterID, c1, c, couponFree, catchPosition, nestingSpace, pilotTemas, maxTapping, maxTravel },
  };
}

// ─── Stopple ──────────────────────────────────────────────────────────────────

/**
 * Stopple hesaplaması yapar (HotTap sonucunu da içerir).
 * Cutter OD = Pipe OD (çapa çap) koşulu UI tarafında kontrol edilmelidir.
 *
 * @param {object} p - runHotTap parametreleri +
 * @param {number} p.dMm   - D ölçüsü
 * @param {number} p.ref2Mm - Ref2 ölçüsü, negatif olabilir
 */
export function runStopple(p) {
  const { valid, errors } = validateOperation('stopple', {
    D:    p.dMm,
    ref2: p.ref2Mm,
  });
  if (!valid) return { valid: false, errors, results: null };

  if (!p.pipeOdMm || !p.pipeWallMm) {
    return { valid: false, errors: { pipeOd: 'Pipe OD zorunludur.' }, results: null };
  }

  const e                = calculateE(p.pipeOdMm, p.pipeWallMm);
  const stoppleOlcusu    = calculateStoppleOlcusu(p.dMm, p.bMm ?? 0, e.result);
  const tekerBoruMerkezi = calculateTekerBoruMerkezi(p.ref2Mm, p.bMm ?? 0, p.pipeOdMm);
  const tekerTemas       = calculateTekerTemasMesafesi(e.result, p.bMm ?? 0, p.ref2Mm);

  const stoppleResults = { e, stoppleOlcusu, tekerBoruMerkezi, tekerTemasMesafesi: tekerTemas };

  // HotTap verisi varsa (bağımsız değilse) HotTap sonuçlarını da ekle
  if (!p.standalone) {
    const hotTapResult = runHotTap(p);
    if (hotTapResult.valid) {
      return { valid: true, errors: {}, results: { ...hotTapResult.results, ...stoppleResults } };
    }
  }

  return { valid: true, errors: {}, results: stoppleResults };
}

// ─── Tapalama ─────────────────────────────────────────────────────────────────

/**
 * Tapalama hesaplaması yapar.
 *
 * @param {object} p
 * @param {number} p.gMm                - G ölçüsü
 * @param {number} p.hMm                - H ölçüsü
 * @param {number} p.cutterOdNominalInch - Nominal cutter çapı (Y/F seçimi için)
 * @param {number} [p.springTravelMm]   - Y — yay baskısı (tablo, ≤12" için zorunlu)
 * @param {number} [p.fMm]              - F — kullanıcı girişi (>12" için zorunlu)
 */
export function runTapalama(p) {
  const { valid, errors } = validateOperation('tapalama', {
    G:                    p.gMm,
    H:                    p.hMm,
    cutterOdNominalInch:  p.cutterOdNominalInch,
    F:                    p.fMm,
  });
  if (!valid) return { valid: false, errors, results: null };

  const isLargerThan12 = p.cutterOdNominalInch > 12;
  const yOrFMm         = isLargerThan12 ? p.fMm : p.springTravelMm;
  const yOrFLabel      = isLargerThan12 ? 'F' : 'Y';

  if (yOrFMm === undefined || yOrFMm === null) {
    const field = isLargerThan12 ? 'F' : 'springTravelMm';
    return { valid: false, errors: { [field]: 'Bu deger zorunludur.' }, results: null };
  }

  const tapalama = calculateTapalama(p.gMm, p.hMm, yOrFMm, yOrFLabel);

  return {
    valid: true,
    errors: {},
    results: { tapalama },
  };
}


// ─── Geri Alma ────────────────────────────────────────────────────────────────

/**
 * Geri alma toplam mesafesini hesaplar.
 *
 * @param {object} p
 * @param {number} p.mMm             - M ölçüsü
 * @param {number} p.nMm             - N ölçüsü
 * @param {number} p.springTravelMm  - Yay ilerlemesi (tablodan veya kullanıcı girişi)
 */
export function runGeriAlma(p) {
  if (p.mMm === undefined || p.nMm === undefined || p.springTravelMm === undefined) {
    return { valid: false, errors: { general: 'M, N ve Yay degerleri zorunludur.' }, results: null };
  }

  const geriAlmaToplam = calculateGeriAlmaToplam(p.mMm, p.nMm, p.springTravelMm);
  return { valid: true, errors: {}, results: { geriAlmaToplam } };
}

// ─── Yardımcı: birim çevirici ─────────────────────────────────────────────────

/**
 * UI formundan gelen { value, unit } nesnesini mm'ye çevirir.
 * @param {{ value: number, unit: 'mm'|'inch' }} field
 * @returns {number} mm cinsinden değer
 */
export function toMm(field) {
  if (!field) return 0;
  return field.unit === 'inch' ? inchToMm(field.value) : field.value;
}
