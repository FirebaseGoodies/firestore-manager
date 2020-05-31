import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/app.service';
import { version } from 'package.json';

@Component({
  selector: 'fm-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent implements OnInit {

  version: string = version;

  constructor(public app: AppService) { }

  ngOnInit() {
  }

}
