import { Directive, Input, ElementRef, AfterViewInit } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Directive({
  selector: '[translate]'
})
export class TranslateDirective implements AfterViewInit {

  @Input() translate: string;
  @Input() substitutions: string | string[]; // ToDo

  constructor(private translateService: TranslateService, private element: ElementRef) { }

  ngAfterViewInit() {
    const key = this.translate.length ? this.translate : this.element.nativeElement.innerHTML.trim();
    this.element.nativeElement.innerHTML = this.translateService.get(key);
  }
}
