export const rules = {

  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Bu alan zorunludur.';
    }
    return null;
  },

  positive: (value) => {
    if (isNaN(value) || value <= 0) {
      return 'Pozitif bir deger giriniz.';
    }
    return null;
  },

  cutterNotLargerThanPipe: (cutterOd, pipeOd) => {
    if (cutterOd > pipeOd) {
      return 'Cutter capi boru capindan buyuk olamaz.';
    }
    return null;
  },

  existsInTable: (value, tableData) => {
    const found = tableData.find(row => row.nominal === value);
    if (!found) {
      return 'Bu cap icin gerekli veriler tabloda bulunamadi. Lutfen yoneticinizle iletisime gecin.';
    }
    return null;
  },

  // Ref1 ve Ref2 negatif olabilir
  numberAllowNegative: (value) => {
    if (isNaN(value)) {
      return 'Gecerli bir sayi giriniz.';
    }
    return null;
  },

};

/**
 * Tüm gerekli alanları doğrular
 * @param {'hottap'|'stopple'|'tapalama'} operationType
 * @param {object} inputs
 * @returns {{ valid: boolean, errors: object }}
 */
export function validateOperation(operationType, inputs) {
  const errors = {};

  if (operationType === 'hottap') {
    const reqFields = ['pipeOd', 'cutterOd', 'cutterWallMm', 'A', 'B'];
    reqFields.forEach(f => {
      const err = rules.required(inputs[f]);
      if (err) errors[f] = err;
    });

    if (inputs.ref1 === undefined || inputs.ref1 === '') {
      errors.ref1 = rules.required(inputs.ref1);
    } else {
      const err = rules.numberAllowNegative(Number(inputs.ref1));
      if (err) errors.ref1 = err;
    }

    if (!errors.cutterOd && !errors.pipeOd) {
      const err = rules.cutterNotLargerThanPipe(Number(inputs.cutterOd), Number(inputs.pipeOd));
      if (err) errors.cutterOd = err;
    }
  }

  if (operationType === 'stopple') {
    const err = rules.required(inputs.D);
    if (err) errors.D = err;

    if (inputs.ref2 === undefined || inputs.ref2 === '') {
      errors.ref2 = rules.required(inputs.ref2);
    } else {
      const err2 = rules.numberAllowNegative(Number(inputs.ref2));
      if (err2) errors.ref2 = err2;
    }
  }

  if (operationType === 'tapalama') {
    ['G', 'H'].forEach(f => {
      const err = rules.required(inputs[f]);
      if (err) errors[f] = err;
    });

    if (inputs.cutterOdNominalInch > 12 && !inputs.F) {
      errors.F = 'F degeri 12" uzeri borularda zorunludur.';
    }
  }

  return {
    valid: Object.keys(errors).filter(k => errors[k]).length === 0,
    errors
  };
}
