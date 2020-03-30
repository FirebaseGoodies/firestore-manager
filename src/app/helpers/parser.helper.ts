
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
