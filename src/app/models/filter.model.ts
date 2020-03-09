
export class Filter {
  field: string;
  operator: firebase.firestore.WhereFilterOp | null;
  value: string;
  valueType: 'string' | 'number' | 'boolean' | 'object';
  isApplied: boolean;

  constructor() {
    this.field = this.operator = this.value = null;
    this.valueType = 'string';
    this.isApplied = false;
  }
}
