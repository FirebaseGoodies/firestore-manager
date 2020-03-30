import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'translate'
})
export class TranslatePipe implements PipeTransform {
  
  constructor(private translateService: TranslateService) { }
  
  transform(key: string, substitutions?: string | string[]): string {
    return this.translateService.get(key, substitutions);
  }
}
