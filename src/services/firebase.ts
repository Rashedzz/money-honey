/**
 * Firebase Client SDK Initialization
 * Connected to project: money-honey-99f4d
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyCv_1bO4D-dcCLT1j9Ml-_iNsd26rVi7Ag",
  authDomain: "money-honey-99f4d.firebaseapp.com",
  projectId: "money-honey-99f4d",
  storageBucket: "money-honey-99f4d.firebasestorage.app",
  messagingSenderId: "154073288283",
  appId: "1:154073288283:web:0c72f2fd2e02044c03797e",
  measurementId: "G-P5WYHRQQ6C"
};

let appInstance: FirebaseApp;
let dbInstance: Firestore;
let authInstance: Auth;

try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
} catch (e) {
  console.warn('Firebase initialization error:', e);
}

export const app = appInstance!;
export const db = dbInstance!;
export const auth = authInstance!;
