
export function time(hours: number, min: number, sec: number = 0, ms: number = 0): Date {
  const date = new Date();
  date.setHours(hours, min, sec, ms);
  return date;
}
