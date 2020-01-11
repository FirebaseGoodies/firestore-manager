
export class Filter {
  field: string;
  operator: '==' | '>' | '>=' | '<' | '<=' | null;
  value: string;

  constructor() {
    this.field = this.operator = this.value = null;
  }
}
