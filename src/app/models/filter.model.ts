
export class Filter {
  field: string;
  operator: firebase.firestore.WhereFilterOp | 'start-with' | '!=' | null;
  value: string;
  valueType: FilterValueType;
  isApplied: boolean;

  constructor() {
    this.field = this.operator = this.value = this.valueType = null;
    this.isApplied = false;
  }
}

export enum FilterValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object'
}
