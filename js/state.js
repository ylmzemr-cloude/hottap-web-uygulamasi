export const state = {
  step: 1,
  projeNo: '',
  operasyonTarihi: '',
  selected: { hottap: false, stopple: false, tapalama: false, 'geri-alma': false },
  operations: [],
  activeTabId: null,
  activePageIdx: 0,
  results: {},
  images: {},
  editingCalc: null,
};

export let currentUser = null;
export function setCurrentUser(u) { currentUser = u; }

export let helpTexts = {};
export function setHelpTexts(h) { helpTexts = h; }

export const MAX_IMAGES = 5;
