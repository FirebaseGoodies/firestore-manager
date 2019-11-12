import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'fm-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.css']
})
export class ExplorerComponent implements OnInit {

  data: any;

  constructor(private db: AngularFirestore) { }

  ngOnInit() {
    this.data = this.db.collection('test').valueChanges();
    this.data.subscribe((data) => {
      console.log(data);
    });
  }

}
