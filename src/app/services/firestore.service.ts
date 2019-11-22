import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Injectable()
export class FirestoreService {

    db: AngularFirestore;
    cache: any = {};
    private unchangedCache: any = {};
    private subscriptions: Subscription[] = [];

    constructor(afs: AngularFirestore) {
      this.db = afs;
    }

    getUnchangedCache() {
      return this.unchangedCache;
    }

    clearCache() {
      this.cache = {};
      this.unchangedCache = {};
      this.unsubscribe();
    }

    unsubscribe() {
      this.subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      });
      this.subscriptions = [];
    }

    isCollection(name: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        const subscription = this.db.collection(name).get().subscribe((query) => {
          // console.log(name, query.size);
          subscription.unsubscribe();
          resolve(!!query.size);
        }, (error) => {
          reject(error);
        });
      });
    }

    getCollection(name: string): Promise<any> {
      return new Promise((resolve, reject) => {
        if (this.cache[name]) {
          // console.log(name + ' found in cache');
          resolve(this.cache[name]);
        } else {
          this.subscriptions.push(
            this.db.collection(name).snapshotChanges().pipe(
              map(actions => {
                return actions.map(a => {
                  const data = a.payload.doc.data();
                  const id = a.payload.doc.id;
                  return { id: id, data: data };
                });
              })
            ).subscribe(snapshot => {
              // console.log(snapshot);
              let docs = {};
              snapshot.forEach(doc => {
                // console.log(doc);
                docs[doc.id] = doc.data;
              });
              // console.log(docs);
              if (Object.keys(this.cache).length === 0) {
                this.cache[name] = docs;
              }
              this.unchangedCache[name] = {...docs}; // assign a copy
              resolve(docs);
            })
          );
        }
      });
    }

    addCollection(name: string, content: any): Promise<any> {
      return this.db.collection(name).add(content);
    }

    deleteCollection(collectionName: string): boolean {
      if (this.cache[collectionName]) {
        delete this.cache[collectionName];
        if (this.unchangedCache[collectionName]) {
          delete this.unchangedCache[collectionName];
        }
        return true;
      }
      return false;
    }

    getDocument(collectionName: string, documentName: string): Promise<any> {
      return new Promise((resolve, reject) => {
        if (this.cache[collectionName] && this.cache[collectionName][documentName]) {
          // console.log(collectionName + ' > ' + documentName + ' found in cache');
          resolve(this.cache[collectionName][documentName]);
        } else {
          this.subscriptions.push(
            this.db.collection(collectionName).doc(documentName).valueChanges().subscribe((doc) => {
              // console.log(doc);
              if (Object.keys(this.cache).length === 0) {
                this.cache[collectionName][documentName] = doc;
              }
              this.unchangedCache[collectionName][documentName] = {...doc}; // assign a copy
              resolve(doc);
            })
          );
        }
      });
    }

    deleteDocument(collectionName: string, documentName: string, permanently: boolean = true): Promise<void> {
      return new Promise((resolve, reject) => {
        if (this.cache[collectionName][documentName]) {
          delete this.cache[collectionName][documentName];
          if (this.unchangedCache[collectionName][documentName]) {
            delete this.unchangedCache[collectionName][documentName];
          }
        }
        if (permanently) {
          this.db.collection(collectionName).doc(documentName).delete().then(() => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    saveDocument(collectionName: string, documentName: string): Promise<any> {
      return this.db.collection(collectionName).doc(documentName).set(this.cache[collectionName][documentName]);
    }
}
