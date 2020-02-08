
export class Filter {
  field: string;
  operator: '==' | '>' | '>=' | '<' | '<=' | null;
  value: string;
  isApplied: boolean;

  constructor() {
    this.field = this.operator = this.value = null;
    this.isApplied = false;
  }
}
