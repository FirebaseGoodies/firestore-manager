import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'fm-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.css']
})
export class LoadingIndicatorComponent implements OnInit {

  @Input() text: string = null;
  @Input() isLoading: boolean = false;
  @Input() style: { [key: string]: any } = {};

  constructor() { }

  ngOnInit(): void {
  }

}
