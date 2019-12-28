import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Authentication, AuthenticationType } from '../models/auth.model';

@Injectable()
export class AuthService {

  currentUser: firebase.User = null;
  lastError: firebase.FirebaseError = null;

  constructor(private afa: AngularFireAuth) {
    this.afa.auth.onAuthStateChanged((user) => {
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
            signInFunction = () => this.afa.auth.signInAnonymously();
            break;
          case AuthenticationType.EmailAndPassword:
            if (authentication.data.email && authentication.data.password && authentication.data.email.length && authentication.data.password.length) {
              signInFunction = () => this.afa.auth.signInWithEmailAndPassword(authentication.data.email, authentication.data.password);
            }
            break;
          case AuthenticationType.Token:
            if (authentication.data.token && authentication.data.token.length) {
              signInFunction = () => this.afa.auth.signInWithCustomToken(authentication.data.token);
            }
            break;
        }
        // Sign in
        if (signInFunction !== null) {
          signInFunction().then(() => {
            resolve();
          }).catch((error: firebase.FirebaseError) => {
            this.lastError = error;
            console.error(`[${error.code}] ${error.message}`);
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
      this.afa.auth.signOut().catch((error: firebase.FirebaseError) => {
        this.lastError = error;
        console.error(`[${error.code}] ${error.message}`);
      });
    }
  }

}
