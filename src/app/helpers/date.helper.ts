
export function time(hours: number, min: number = 0, sec: number = 0, ms: number = 0): Date {
  const date = new Date();
  date.setHours(hours, min, sec, ms);
  return date;
}

export function cloneDate(date: Date) {
  return new Date(date.getTime());
}
