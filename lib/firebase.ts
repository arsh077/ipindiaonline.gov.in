import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { FullPortalData } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyAk3Sg9xLMHTFniteRXsVK8zGdpcqWKhVw",
  authDomain: "ipindiaonline-1cb21.firebaseapp.com",
  projectId: "ipindiaonline-1cb21",
  storageBucket: "ipindiaonline-1cb21.firebasestorage.app",
  messagingSenderId: "689492433909",
  appId: "1:689492433909:web:9a14d617147435369d9ebc"
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

const COLLECTION_NAME = 'cms_portal';
const DOC_NAME = 'portal_data';

export async function fetchFirebaseData(): Promise<FullPortalData | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_NAME);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as FullPortalData;
    }
  } catch (error) {
    console.error('Error fetching from Firebase Firestore:', error);
  }
  return null;
}

export async function saveFirebaseData(data: FullPortalData): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTION_NAME, DOC_NAME);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving to Firebase Firestore:', error);
    return false;
  }
}
