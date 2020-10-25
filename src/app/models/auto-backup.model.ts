
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
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 } // @see https://www.w3schools.com/jsref/jsref_getday.asp
];

const now = new Date();

export const AutoBackupDefaultTime: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);

export const AutoBackupDirectoryName: string = 'firestore_manager_backups';
