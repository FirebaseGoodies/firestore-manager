
export function booleanify(value: string) {
  switch(value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return value;
  }
}

export function jsonify(value: string) {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

export function isNumber(value: string) {
  return !isNaN(+value) && /^-?(0|[1-9][0-9]*)(\.[0-9]*)?$/.test(value);
}

// Stolen from: https://stackoverflow.com/a/53074718
export function isDate(date: string) {
  const regex  = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$');
  return regex.test(date);
}

export function isDocumentReference(value: string) {
  return value && /^[a-zA-Z]+\/[0-9a-zA-Z\/]{20,}/.test(value);
}
