import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'datetime'
})
export class DateTimePipe extends DatePipe implements PipeTransform {

  constructor(private translateService: TranslateService) {
    super(translateService.getLanguage());
  }

  transform(value: any, format?: string, timezone?: string, locale?: string): string {
    return value ? super.transform(value, format || 'dd MMMM yyyy HH:mm', timezone, locale) : '';
  }

}
