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

  // Catch Position — U-teli minimum pozisyon kontrolü
  catchPosition: (couponFreeMm, ref1Mm, pipeWallMm) => {
    return (couponFreeMm + ref1Mm) - pipeWallMm;
  },

  // Nesting Space — Kuponu tutmak için gerekli minimum alan
  nestingSpace: (couponFreeMm) => {
    return couponFreeMm + inchToMm(1.0);
  },

  // Coupon Free — Kupon serbest mesafe
  couponFree: (pipeOdMm, cutterOdActualMm) => {
    return Math.sqrt(
      Math.pow(pipeOdMm / 2, 2) - Math.pow(cutterOdActualMm / 2, 2)
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

  // Delme Süresi (KKM inch, TS tur sayısı, advancePerTurnInch makine tipine göre)
  delmeSuresi: (kkmInch, ts, advancePerTurnInch) => {
    return kkmInch / (ts * advancePerTurnInch);
  },

  // Geri Alma Toplam
  geriAlmaToplam: (mMm, nMm, springTravelMm) => {
    return mMm + nMm + springTravelMm;
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

export function calculateCouponFree(pipeOdMm, cutterOdActualMm) {
  const halfPipeOd = pipeOdMm / 2;
  const halfCutterOd = cutterOdActualMm / 2;
  const sqrtInner = Math.sqrt(Math.pow(halfPipeOd, 2) - Math.pow(halfCutterOd, 2));
  const result = parseFloat(sqrtInner.toFixed(10));
  const steps = [
    'Formul: Coupon Free = kok[(Pipe OD / 2)^2 - (Cutter OD / 2)^2]',
    'Adim 1: Coupon Free = kok[(' + pipeOdMm.toFixed(3) + ' / 2)^2 - (' + cutterOdActualMm.toFixed(3) + ' / 2)^2]',
    'Adim 2: Coupon Free = kok[' + Math.pow(halfPipeOd, 2).toFixed(3) + ' - ' + Math.pow(halfCutterOd, 2).toFixed(3) + ']',
    'Adim 3: Coupon Free = kok[' + (Math.pow(halfPipeOd, 2) - Math.pow(halfCutterOd, 2)).toFixed(3) + ']',
    'Sonuc: Coupon Free = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateCatchPosition(couponFreeMm, ref1Mm, pipeWallMm) {
  const result = parseFloat(formulas.catchPosition(couponFreeMm, ref1Mm, pipeWallMm).toFixed(10));
  const steps = [
    'Formul: Catch Position = (CF + Ref1) - Pipe Wall',
    'Adim 1: Catch Position = (' + couponFreeMm.toFixed(3) + ' + ' + ref1Mm.toFixed(3) + ') - ' + pipeWallMm.toFixed(3),
    'Sonuc: Catch Position = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}

export function calculateNestingSpace(couponFreeMm) {
  const onInchMm = inchToMm(1.0);
  const result = parseFloat(formulas.nestingSpace(couponFreeMm).toFixed(10));
  const steps = [
    'Formul: Nesting Space = CF + 1.000"',
    'Adim 1: Nesting Space = ' + couponFreeMm.toFixed(3) + ' + ' + onInchMm.toFixed(3) + ' (1.000")',
    'Sonuc: Nesting Space = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
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

export function calculateDelmeSuresi(kkmInch, ts, advancePerTurnInch) {
  const result = parseFloat(formulas.delmeSuresi(kkmInch, ts, advancePerTurnInch).toFixed(10));
  const steps = [
    'Formul: Delme Suresi = KKM / (TS x Ilerleme)',
    'Adim 1: Delme Suresi = ' + kkmInch.toFixed(3) + '" / (' + ts + ' x ' + advancePerTurnInch + ')',
    'Adim 2: Delme Suresi = ' + kkmInch.toFixed(3) + ' / ' + (ts * advancePerTurnInch).toFixed(4),
    'Sonuc: Delme Suresi = ' + result.toFixed(3) + ' dakika'
  ];
  return { steps, result };
}

export function calculateGeriAlmaToplam(mMm, nMm, springTravelMm) {
  const result = parseFloat(formulas.geriAlmaToplam(mMm, nMm, springTravelMm).toFixed(10));
  const steps = [
    'Formul: Geri Alma Toplam = M + N + Yay',
    'Adim 1: Geri Alma Toplam = ' + mMm.toFixed(3) + ' + ' + nMm.toFixed(3) + ' + ' + springTravelMm.toFixed(3),
    'Sonuc: Geri Alma Toplam = ' + result.toFixed(3) + ' mm  (' + mmToInch(result).toFixed(3) + '")'
  ];
  return { steps, result };
}
