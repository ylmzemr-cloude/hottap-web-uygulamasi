import {
  calculateCutterID,
  calculateC1,
  calculateC,
  calculateE,
  calculateCouponFree,
  calculatePilotTemas,
  calculateMaxTapping,
  calculateMaxTravel,
  calculateStoppleOlcusu,
  calculateTekerBoruMerkezi,
  calculateTekerTemasMesafesi,
  calculateTapalama,
  calculateDelmeSuresi,
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
  const couponFree  = calculateCouponFree(p.pipeOdMm, p.pipeIdMm, cutterID.result);
  const pilotTemas  = calculatePilotTemas(p.aMm, p.bMm);
  const maxTapping  = calculateMaxTapping(p.pipeOdMm, p.ref1Mm);
  const maxTravel   = calculateMaxTravel(p.aMm, p.bMm, p.pipeOdMm, p.ref1Mm);

  return {
    valid: true,
    errors: {},
    results: { cutterID, c1, c, couponFree, pilotTemas, maxTapping, maxTravel },
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
  const hotTapResult = runHotTap(p);
  if (!hotTapResult.valid) return hotTapResult;

  const { valid, errors } = validateOperation('stopple', {
    D:    p.dMm,
    ref2: p.ref2Mm,
  });
  if (!valid) return { valid: false, errors, results: null };

  const e                = calculateE(p.pipeOdMm, p.pipeWallMm);
  const stoppleOlcusu    = calculateStoppleOlcusu(p.dMm, p.bMm, e.result);
  const tekerBoruMerkezi = calculateTekerBoruMerkezi(p.ref2Mm, p.bMm, p.pipeOdMm);
  const tekerTemas       = calculateTekerTemasMesafesi(e.result, p.bMm, p.ref2Mm);

  return {
    valid: true,
    errors: {},
    results: {
      ...hotTapResult.results,
      e,
      stoppleOlcusu,
      tekerBoruMerkezi,
      tekerTemasMesafesi: tekerTemas,
    },
  };
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

// ─── KKM / Delme Süresi ───────────────────────────────────────────────────────

/**
 * KKM (kalan kesim mesafesi) hesaplaması yapar.
 *
 * @param {object} p
 * @param {number} p.kkmInch - Kalan kesim mesafesi (SADECE inç)
 * @param {number} p.ts      - Tur sayısı
 */
export function runKKM(p) {
  if (!p.kkmInch || !p.ts) {
    return {
      valid: false,
      errors: {
        kkmInch: p.kkmInch ? null : 'Bu alan zorunludur.',
        ts:      p.ts      ? null : 'Bu alan zorunludur.',
      },
      results: null,
    };
  }

  const delmeSuresi = calculateDelmeSuresi(p.kkmInch, p.ts);
  return { valid: true, errors: {}, results: { delmeSuresi } };
}

// ─── Geri Alma ────────────────────────────────────────────────────────────────

/**
 * Geri alma toplam mesafesini hesaplar.
 *
 * @param {object} p
 * @param {number} p.tapalamaMm - Tapalama sonucu
 * @param {number} p.mMm        - M ölçüsü
 * @param {number} p.nMm        - N ölçüsü
 */
export function runGeriAlma(p) {
  if (p.tapalamaMm === undefined || p.mMm === undefined || p.nMm === undefined) {
    return { valid: false, errors: { general: 'Tapalama, M ve N degerleri zorunludur.' }, results: null };
  }

  const geriAlmaToplam = calculateGeriAlmaToplam(p.tapalamaMm, p.mMm, p.nMm);
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
