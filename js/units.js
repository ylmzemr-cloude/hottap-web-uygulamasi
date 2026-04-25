export const INCH_TO_MM = 25.4;
export const MM_TO_INCH = 1 / 25.4;

export function inchToMm(inch) {
  return parseFloat((inch * INCH_TO_MM).toFixed(10));
}

export function mmToInch(mm) {
  return parseFloat((mm * MM_TO_INCH).toFixed(10));
}

export function formatResult(valueMm) {
  const mm = valueMm.toFixed(3);
  const inch = mmToInch(valueMm).toFixed(3);
  return {
    mm: mm + ' mm',
    inch: inch + '"',
    display: mm + ' mm  (' + inch + '")'
  };
}
