import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Database } from '../models/database.model';
import { StorageService } from './storage.service';

@Injectable()
export class FirestoreService {

    db: AngularFirestore;
    cache: any = {};
    private unchangedCache: any = {};
    private subscriptions: { [key: string]: Subscription } = {};

    constructor(afs: AngularFirestore) {
      this.db = afs;
    }

    static getDatabaseConfig() {
      const database: Database = StorageService.getTmp('database');
      //console.log(database);
      return database ? database.config : null;
    }

    getUnchangedCache() {
      return this.unchangedCache;
    }

    clearCache(collectionName?: string) {
      if (collectionName) {
        this.cache[collectionName] && delete this.cache[collectionName];
        this.unchangedCache[collectionName] && delete this.unchangedCache[collectionName];
      } else {
        this.cache = {};
        this.unchangedCache = {};
      }
      this.unsubscribe(collectionName);
    }

    unsubscribe(subscriptionName?: string) {
      if (subscriptionName) {
        // Remove solo subscription
        if (this.subscriptions[subscriptionName]) {
          this.subscriptions[subscriptionName].unsubscribe();
          delete this.subscriptions[subscriptionName];
        }
      } else {
        // Remove all subscriptions
        Object.keys(this.subscriptions).forEach(subscriptionName => {
          this.subscriptions[subscriptionName].unsubscribe();
        });
        this.subscriptions = {};
      }
    }

    isCollection(name: string): Promise<boolean> {
      return new Promise((resolve, reject) => {
        this.db.collection(name).get().toPromise().then((query) => {
          // console.log(name, query.size);
          resolve(!!query.size);
        }).catch((error) => {
          reject(error);
        });
      });
    }

    getCollection(name: string): Promise<any> {
      return new Promise((resolve, reject) => {
        if (this.cache[name]) {
          // console.log(name + ' found in cache');
          resolve(this.cache[name]);
        } else if (! this.subscriptions[name]) {
          this.subscriptions[name] = this.db.collection(name).get().subscribe((snapshot) => {
            // console.log(snapshot);
            let docs = {};
            snapshot.forEach(doc => {
              // console.log(doc);
              docs[doc.id] = doc.data();
            });
            // console.log(docs);
            if (! this.cache[name]) {
              this.cache[name] = docs;
            }
            this.unchangedCache[name] = {...docs}; // assign a copy
            resolve(docs);
          }, (error) => {
            reject(error);
          });
        } else {
          resolve(null);
        }
      });
    }

    filterCollection(name: string, queryFunction?: any): Promise<any> {
      return new Promise((resolve, reject) => {
        this.db.collection(name, queryFunction).get().toPromise().then((snapshot) => {
          // console.log(snapshot);
          let docs = {};
          snapshot.forEach(doc => {
            // console.log(doc);
            docs[doc.id] = doc.data();
          });
          // console.log(docs);
          this.cache[name] = docs;
          this.unchangedCache[name] = {...docs}; // assign a copy
          resolve(docs);
        }).catch((error) => {
          reject(error);
        });
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
        if (this.subscriptions[collectionName]) {
          this.unsubscribe(collectionName);
        }
        console.log(collectionName + ' deleted!')
        return true;
      }
      return false;
    }

    getDocument(collectionName: string, documentName: string): Promise<any> {
      return new Promise((resolve, reject) => {
        const subscriptionName = collectionName + '.' + documentName;
        if (this.cache[collectionName] && this.cache[collectionName][documentName]) {
          // console.log(collectionName + ' > ' + documentName + ' found in cache');
          resolve(this.cache[collectionName][documentName]);
        } else if (! this.subscriptions[subscriptionName]) {
          this.subscriptions[subscriptionName] = this.db.collection(collectionName).doc(documentName).valueChanges().subscribe((doc: any) => {
            // console.log(doc);
            if (! this.cache[collectionName][documentName]) {
              this.cache[collectionName][documentName] = doc;
            }
            this.unchangedCache[collectionName][documentName] = {...doc}; // assign a copy
            resolve(doc);
          }, (error) => {
            reject(error);
          });
        } else {
          resolve(null);
        }
      });
    }

    addDocument(collectionName: string, content: any): Promise<any> {
      return this.addCollection(collectionName, content);
    }

    deleteDocument(collectionName: string, documentName: string, permanently: boolean = true): Promise<void> {
      return new Promise((resolve, reject) => {
        if (this.cache[collectionName][documentName]) {
          delete this.cache[collectionName][documentName];
          if (this.unchangedCache[collectionName][documentName]) {
            delete this.unchangedCache[collectionName][documentName];
          }
          const subscriptionName = collectionName + '.' + documentName;
          if (this.subscriptions[subscriptionName]) {
            this.unsubscribe(subscriptionName);
          }
        }
        if (permanently) {
          this.db.collection(collectionName).doc(documentName).delete().then(() => {
            console.log(collectionName + ' > ' + documentName + ' permanently deleted!');
            resolve();
          }, (error) => {
            reject(error);
          });
        } else {
          console.log(collectionName + ' > ' + documentName + ' deleted!');
          resolve();
        }
      });
    }

    setDocument(collectionName: string, documentName: string, content: any): Promise<any> {
      return this.db.collection(collectionName).doc(documentName).set(content);
    }

    saveDocument(collectionName: string, documentName: string): Promise<any> {
      return this.setDocument(collectionName, documentName, this.cache[collectionName][documentName]);
    }
}
