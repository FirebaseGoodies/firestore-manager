import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'deduplicate'
})
export class DeduplicatePipe implements PipeTransform {
  
  constructor() { }
  
  transform(values: string[]): string[] {
    return values.filter((value: string, index: number) => values.indexOf(value) === index);
  }

}
