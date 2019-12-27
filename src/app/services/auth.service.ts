import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Authentication, AuthenticationType } from '../models/auth.model';

@Injectable()
export class AuthService {

  currentUser: any = null;
  isSignedIn: boolean = false;

  constructor(private afa: AngularFireAuth) {
    this.afa.auth.onAuthStateChanged((user) => {
      // console.log(user);
      this.currentUser = user;
      this.isSignedIn = user ? true : false;
    });
  }

  signIn(authentication: Authentication) {
    // console.log('sign in', authentication);
    switch(authentication.type) {
      case AuthenticationType.Anonymous:
        this.signInAnonymously();
        break;
      case AuthenticationType.EmailAndPassword:
        this.signInWithEmailAndPassword(authentication.data.email, authentication.data.password);
        break;
      case AuthenticationType.Token:
        this.signInWithCustomToken(authentication.data.token);
        break;
    }
  }

  private signInAnonymously() {
    this._signIn(() => this.afa.auth.signInAnonymously());
  }

  private signInWithEmailAndPassword(email: string, password: string) {
    this._signIn(() => this.afa.auth.signInWithEmailAndPassword(email, password));
  }

  private signInWithCustomToken(token: string) {
    this._signIn(() => this.afa.auth.signInWithCustomToken(token));
  }

  private _signIn(signInCallback: Function) {
    if (this.isSignedIn) {
      console.log('already signed in!');
    } else {
      signInCallback().catch((error: firebase.FirebaseError) => {
        console.error(`[${error.code}] ${error.message}`);
      });
    }
  }

  signOut() {
    // console.log('sign out', this.isSignedIn);
    this.afa.auth.signOut().catch((error: firebase.FirebaseError) => {
      console.error(`[${error.code}] ${error.message}`);
    });
  }

}
