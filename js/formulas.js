/**
 * @file formulas.js
 * @description All HotTap calculation formulas — edit here to update formulas
 * @note All input/output values in MM unless otherwise specified
 */

import { inchToMm, mmToInch } from './units.js';

export const formulas = {

  // Cutter iç çapı
  cutterID: (cutterOdActualMm, cutterWallMm) => {
    return cutterOdActualMm - (2 * cutterWallMm);
  },

  // C1 — Temas hesaplaması
  c1: (pipeOdMm, pipeIdMm, cutterOdActualMm) => {
    return (pipeOdMm / 2) - Math.sqrt(
      Math.pow(pipeIdMm / 2, 2) - Math.pow(cutterOdActualMm / 2, 2)
    );
  },

  // C — Kesme mesafesi
  c: (c1Mm, ref1Mm) => {
    return c1Mm + ref1Mm;
  },

  // E — Stopple ek ölçüsü
  e: (pipeOdMm, pipeWallMm) => {
    return pipeOdMm - (1 * pipeWallMm);
  },

  // Coupon Free — Kupon serbest mesafe
  couponFree: (pipeOdMm, pipeIdMm, cutterIdMm) => {
    return (pipeOdMm / 2) - Math.sqrt(
      Math.pow(pipeIdMm / 2, 2) - Math.pow(cutterIdMm / 2, 2)
    );
  },

  // Pilot Temas — Lower-in distance
  pilotTemas: (aMm, bMm) => {
    return aMm + bMm;
  },

  // Max Tapping Distance
  maxTapping: (pipeOdMm, ref1Mm) => {
    return (pipeOdMm / 2) + ref1Mm + inchToMm(0.125);
  },

  // Max Travel Distance
  maxTravel: (aMm, bMm, pipeOdMm, ref1Mm) => {
    return (aMm + bMm) + (pipeOdMm / 2) + ref1Mm + inchToMm(0.125);
  },

  // Stopple Ölçüsü
  stoppleOlcusu: (dMm, bMm, eMm) => {
    return dMm + bMm + eMm;
  },

  // Teker Boru Merkezi
  tekerBoruMerkezi: (ref2Mm, bMm, pipeOdMm) => {
    return ref2Mm + bMm + (pipeOdMm / 2);
  },

  // Teker Temas Mesafesi
  tekerTemasMesafesi: (eMm, bMm, ref2Mm) => {
    return eMm + bMm + ref2Mm;
  },

  // Tapalama
  tapalama: (gMm, hMm, yOrFMm) => {
    return gMm + hMm + yOrFMm;
  },

  // Delme Süresi (KKM inch, TS tur sayısı)
  delmeSuresi: (kkmInch, ts) => {
    const ADVANCE_PER_TURN = 0.125;
    return kkmInch / (ts * ADVANCE_PER_TURN);
  },

  // Geri Alma Toplam
  geriAlmaToplam: (tapalamaMm, mMm, nMm) => {
    return tapalamaMm + mMm + nMm;
  },
};

// ─── Adımlı hesaplama fonksiyonları ───────────────────────────────────────────

export function calculateCutterID(cutterOdActualMm, cutterWallMm) {
  const result = formulas.cutterID(cutterOdActualMm, cutterWallMm);
  const steps = [
    'Formul: Cutter ID = Cutter OD - (2 x Et Kalinligi)',
    'Adim 1: Cutter ID = ' + cutterOdActualMm.toFixed(3) + ' - (2 x ' + cutterWallMm.toFixed(3) + ')',
    'Sonuc: Cutter ID = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateC1(pipeOdMm, pipeIdMm, cutterOdActualMm) {
  const halfPipeOd = pipeOdMm / 2;
  const halfPipeId = pipeIdMm / 2;
  const halfCutterOd = cutterOdActualMm / 2;
  const sqrtInner = Math.sqrt(Math.pow(halfPipeId, 2) - Math.pow(halfCutterOd, 2));
  const result = parseFloat((halfPipeOd - sqrtInner).toFixed(10));

  const steps = [
    'Formul: C1 = (Pipe OD / 2) - kok[(Pipe ID / 2)^2 - (Cutter OD / 2)^2]',
    'Adim 1: C1 = (' + pipeOdMm.toFixed(3) + ' / 2) - kok[(' + pipeIdMm.toFixed(3) + ' / 2)^2 - (' + cutterOdActualMm.toFixed(3) + ' / 2)^2]',
    'Adim 2: C1 = ' + halfPipeOd.toFixed(3) + ' - kok[' + Math.pow(halfPipeId, 2).toFixed(3) + ' - ' + Math.pow(halfCutterOd, 2).toFixed(3) + ']',
    'Adim 3: C1 = ' + halfPipeOd.toFixed(3) + ' - kok[' + (Math.pow(halfPipeId, 2) - Math.pow(halfCutterOd, 2)).toFixed(3) + ']',
    'Adim 4: C1 = ' + halfPipeOd.toFixed(3) + ' - ' + sqrtInner.toFixed(3),
    'Sonuc: C1 = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateC(c1Mm, ref1Mm) {
  const result = parseFloat(formulas.c(c1Mm, ref1Mm).toFixed(10));
  const steps = [
    'Formul: C = C1 + Ref1',
    'Adim 1: C = ' + c1Mm.toFixed(3) + ' + (' + ref1Mm.toFixed(3) + ')',
    'Sonuc: C = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateE(pipeOdMm, pipeWallMm) {
  const result = parseFloat(formulas.e(pipeOdMm, pipeWallMm).toFixed(10));
  const steps = [
    'Formul: E = Pipe OD - (1 x Pipe Wall)',
    'Adim 1: E = ' + pipeOdMm.toFixed(3) + ' - (1 x ' + pipeWallMm.toFixed(3) + ')',
    'Adim 2: E = ' + pipeOdMm.toFixed(3) + ' - ' + pipeWallMm.toFixed(3),
    'Sonuc: E = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateCouponFree(pipeOdMm, pipeIdMm, cutterIdMm) {
  const halfPipeOd = pipeOdMm / 2;
  const halfPipeId = pipeIdMm / 2;
  const halfCutterId = cutterIdMm / 2;
  const sqrtInner = Math.sqrt(Math.pow(halfPipeId, 2) - Math.pow(halfCutterId, 2));
  const result = parseFloat((halfPipeOd - sqrtInner).toFixed(10));
  const steps = [
    'Formul: Coupon Free = (Pipe OD / 2) - kok[(Pipe ID / 2)^2 - (Cutter ID / 2)^2]',
    'Adim 1: Coupon Free = (' + pipeOdMm.toFixed(3) + ' / 2) - kok[(' + pipeIdMm.toFixed(3) + ' / 2)^2 - (' + cutterIdMm.toFixed(3) + ' / 2)^2]',
    'Adim 2: Coupon Free = ' + halfPipeOd.toFixed(3) + ' - kok[' + Math.pow(halfPipeId, 2).toFixed(3) + ' - ' + Math.pow(halfCutterId, 2).toFixed(3) + ']',
    'Adim 3: Coupon Free = ' + halfPipeOd.toFixed(3) + ' - kok[' + (Math.pow(halfPipeId, 2) - Math.pow(halfCutterId, 2)).toFixed(3) + ']',
    'Adim 4: Coupon Free = ' + halfPipeOd.toFixed(3) + ' - ' + sqrtInner.toFixed(3),
    'Sonuc: Coupon Free = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculatePilotTemas(aMm, bMm) {
  const result = parseFloat(formulas.pilotTemas(aMm, bMm).toFixed(10));
  const steps = [
    'Formul: Pilot Temas = A + B',
    'Adim 1: Pilot Temas = ' + aMm.toFixed(3) + ' + ' + bMm.toFixed(3),
    'Sonuc: Pilot Temas = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateMaxTapping(pipeOdMm, ref1Mm) {
  const oneEighthMm = inchToMm(0.125);
  const result = parseFloat(formulas.maxTapping(pipeOdMm, ref1Mm).toFixed(10));
  const steps = [
    'Formul: Max Tapping = (Pipe OD / 2) + Ref1 + 0.125"',
    'Adim 1: Max Tapping = (' + pipeOdMm.toFixed(3) + ' / 2) + ' + ref1Mm.toFixed(3) + ' + ' + oneEighthMm.toFixed(3) + ' (0.125" karsiligi)',
    'Adim 2: Max Tapping = ' + (pipeOdMm / 2).toFixed(3) + ' + ' + ref1Mm.toFixed(3) + ' + ' + oneEighthMm.toFixed(3),
    'Sonuc: Max Tapping = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateMaxTravel(aMm, bMm, pipeOdMm, ref1Mm) {
  const oneEighthMm = inchToMm(0.125);
  const pilotSum = aMm + bMm;
  const result = parseFloat(formulas.maxTravel(aMm, bMm, pipeOdMm, ref1Mm).toFixed(10));
  const steps = [
    'Formul: Max Travel = (A + B) + (Pipe OD / 2) + Ref1 + 0.125"',
    'Adim 1: Max Travel = (' + aMm.toFixed(3) + ' + ' + bMm.toFixed(3) + ') + (' + pipeOdMm.toFixed(3) + ' / 2) + ' + ref1Mm.toFixed(3) + ' + ' + oneEighthMm.toFixed(3),
    'Adim 2: Max Travel = ' + pilotSum.toFixed(3) + ' + ' + (pipeOdMm / 2).toFixed(3) + ' + ' + ref1Mm.toFixed(3) + ' + ' + oneEighthMm.toFixed(3),
    'Sonuc: Max Travel = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateStoppleOlcusu(dMm, bMm, eMm) {
  const result = parseFloat(formulas.stoppleOlcusu(dMm, bMm, eMm).toFixed(10));
  const steps = [
    'Formul: Stopple Olcusu = D + B + E',
    'Adim 1: Stopple Olcusu = ' + dMm.toFixed(3) + ' + ' + bMm.toFixed(3) + ' + ' + eMm.toFixed(3),
    'Sonuc: Stopple Olcusu = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateTekerBoruMerkezi(ref2Mm, bMm, pipeOdMm) {
  const result = parseFloat(formulas.tekerBoruMerkezi(ref2Mm, bMm, pipeOdMm).toFixed(10));
  const steps = [
    'Formul: Teker Boru Merkezi = Ref2 + B + (Pipe OD / 2)',
    'Adim 1: Teker Boru Merkezi = (' + ref2Mm.toFixed(3) + ') + ' + bMm.toFixed(3) + ' + (' + pipeOdMm.toFixed(3) + ' / 2)',
    'Adim 2: Teker Boru Merkezi = ' + ref2Mm.toFixed(3) + ' + ' + bMm.toFixed(3) + ' + ' + (pipeOdMm / 2).toFixed(3),
    'Sonuc: Teker Boru Merkezi = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateTekerTemasMesafesi(eMm, bMm, ref2Mm) {
  const result = parseFloat(formulas.tekerTemasMesafesi(eMm, bMm, ref2Mm).toFixed(10));
  const steps = [
    'Formul: Teker Temas Mesafesi = E + B + Ref2',
    'Adim 1: Teker Temas Mesafesi = ' + eMm.toFixed(3) + ' + ' + bMm.toFixed(3) + ' + (' + ref2Mm.toFixed(3) + ')',
    'Sonuc: Teker Temas Mesafesi = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateTapalama(gMm, hMm, yOrFMm, yOrFLabel) {
  const result = parseFloat(formulas.tapalama(gMm, hMm, yOrFMm).toFixed(10));
  const label = yOrFLabel || 'Y/F';
  const steps = [
    'Formul: Tapalama = G + H + ' + label,
    'Adim 1: Tapalama = ' + gMm.toFixed(3) + ' + ' + hMm.toFixed(3) + ' + ' + yOrFMm.toFixed(3),
    'Sonuc: Tapalama = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateDelmeSuresi(kkmInch, ts) {
  const ADVANCE = 0.125;
  const result = parseFloat(formulas.delmeSuresi(kkmInch, ts).toFixed(10));
  const steps = [
    'Formul: Delme Suresi = KKM / (TS x 0.125)',
    'Adim 1: Delme Suresi = ' + kkmInch.toFixed(3) + '" / (' + ts + ' x ' + ADVANCE + ')',
    'Adim 2: Delme Suresi = ' + kkmInch.toFixed(3) + ' / ' + (ts * ADVANCE).toFixed(3),
    'Sonuc: Delme Suresi = ' + result.toFixed(3) + ' tur'
  ];
  return { steps, result };
}

export function calculateGeriAlmaToplam(tapalamaMm, mMm, nMm) {
  const result = parseFloat(formulas.geriAlmaToplam(tapalamaMm, mMm, nMm).toFixed(10));
  const steps = [
    'Formul: Geri Alma Toplam = Tapalama + M + N',
    'Adim 1: Geri Alma Toplam = ' + tapalamaMm.toFixed(3) + ' + ' + mMm.toFixed(3) + ' + ' + nMm.toFixed(3),
    'Sonuc: Geri Alma Toplam = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}
