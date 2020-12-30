
export const Chars = {
  Numeric: [...'0123456789'],
  Alpha: [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  AlphaNumeric: [...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']
};

export function randomString(length: number, chars: string[] = Chars.AlphaNumeric) {
  return [...Array(length)].map(i => chars[Math.random()*chars.length|0]).join('');
}
