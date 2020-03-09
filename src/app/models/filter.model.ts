
export class Filter {
  field: string;
  operator: firebase.firestore.WhereFilterOp | null;
  value: string;
  valueType: FilterValueType;
  isApplied: boolean;

  constructor() {
    this.field = this.operator = this.value = null;
    this.valueType = FilterValueType.String;
    this.isApplied = false;
  }
}

export enum FilterValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object'
}
