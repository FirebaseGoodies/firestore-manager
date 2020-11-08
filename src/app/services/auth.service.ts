import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Authentication, AuthenticationType } from '../models/auth.model';
import * as firebase from 'firebase/app';
import 'firebase/auth'; // required when importing firebase from 'firebase/app'

@Injectable()
export class AuthService {

  currentUser: firebase.User = null;
  lastError: firebase.FirebaseError = null;

  constructor(private auth: AngularFireAuth) {
    this.auth.onAuthStateChanged((user) => {
      // console.log(user);
      this.currentUser = user;
    });
  }

  isSignedIn(): boolean {
    return !!this.currentUser;
  }

  signIn(authentication: Authentication): Promise<void> {
    // console.log('sign in', authentication);
    return new Promise((resolve, reject) => {
      if (this.isSignedIn()) {
        console.log('already signed in!');
        resolve();
      } else {
        // Set authentication function
        let signInFunction: Function = null;
        switch(authentication.type) {
          case AuthenticationType.Anonymous:
            signInFunction = () => this.auth.signInAnonymously();
            break;
          case AuthenticationType.EmailAndPassword:
            if (authentication.data.email?.length && authentication.data.password?.length) {
              signInFunction = () => this.auth.signInWithEmailAndPassword(authentication.data.email, authentication.data.password);
            }
            break;
          case AuthenticationType.JWT:
            if (authentication.data.token?.length) {
              signInFunction = () => this.auth.signInWithCustomToken(authentication.data.token);
            }
            break;
        }
        // Sign in
        if (signInFunction !== null) {
          this.auth.setPersistence(firebase.auth.Auth.Persistence.NONE).then(() => {
            signInFunction().then(() => {
              resolve();
            }).catch((error: firebase.FirebaseError) => {
              this.setLastError(error);
              reject();
            });
          }).catch((error: firebase.FirebaseError) => {
            this.setLastError(error);
            reject();
          });
        } else {
          reject();
        }
      }
    });
  }

  signOut(force: boolean = false): void {
    // console.log('sign out', this.isSignedIn());
    if (force || this.isSignedIn()) {
      this.auth.signOut().catch((error: firebase.FirebaseError) => {
        this.setLastError(error);
      });
    }
  }

  private setLastError(error: firebase.FirebaseError) {
    this.lastError = error;
    console.error(`[${error.code}] ${error.message}`);
  }

}
