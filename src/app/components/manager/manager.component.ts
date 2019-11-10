import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fm-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit {

  title = 'firestore-manager';

  constructor() { }

  ngOnInit() {
  }

}
