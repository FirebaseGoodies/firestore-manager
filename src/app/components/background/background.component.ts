import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fm-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.css']
})
export class BackgroundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    console.log('I am the background page, did some one call me? *-*');
  }

}
