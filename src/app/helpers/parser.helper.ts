
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
