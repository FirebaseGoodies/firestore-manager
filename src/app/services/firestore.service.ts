import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable()
export class FirestoreService {

    db: AngularFirestore;

    constructor(afs: AngularFirestore) {
        this.db = afs;
    }

    isCollection(name: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const subscription = this.db.collection(name).get().subscribe((query) => {
                // console.log(name);
                // console.log(query.size);
                subscription.unsubscribe();
                resolve(!!query.size);
            });
        });
    }

    getCollection(name: string, docIdField: string = null): Promise<any> {
        return new Promise((resolve, reject) => {
            const subscription = this.db.collection(name).valueChanges({ idField: docIdField }).subscribe((docs) => {
                // console.log(docs);
                subscription.unsubscribe();
                resolve(docs);
            });
        });
    }

    addCollection(name: string, content: any): Promise<any> {
        return this.db.collection(name).add(content);
    }
}
