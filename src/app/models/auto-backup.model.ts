
export interface AutoBackup {
  enabled?: boolean,
  schedule: {
    days: number[],
    time: Date|string
  }
}

export interface AutoBackupDay {
  label: string,
  value: number,
  checked?: boolean
}

export const AutoBackupDays: AutoBackupDay[] = [
  { label: 'Monday', value: 1, checked: true },
  { label: 'Tuesday', value: 2, checked: true },
  { label: 'Wednesday', value: 3, checked: true },
  { label: 'Thursday', value: 4, checked: true },
  { label: 'Friday', value: 5, checked: true },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 } // @see https://www.w3schools.com/jsref/jsref_getday.asp
];
