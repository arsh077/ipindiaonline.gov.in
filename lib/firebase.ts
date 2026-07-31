import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { FullPortalData } from './types';

// Service Account Credentials provided for Full Admin Access to Firestore
const serviceAccount = {
  projectId: "ipindiaonline-1cb21",
  clientEmail: "firebase-adminsdk-fbsvc@ipindiaonline-1cb21.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC83nsIkartd2DI\neExnPCw4e5a77r538n3KqOA/pit/a9vQ4FhNqptQQdMhILkBeOs7QfeDtX2vseBH\nshYbFAHj2vvwHgpBbs0qtieN7pn+C53Pf5jrgz2kHfq+4wHFymRk/inkJabGQbcz\niy+wrSIOSHNh2YUZNODstf+7j39BYYCCcINt5y3iju2UkI5d+l90+XuC0AFmnTA8\nKGtqwfuWhUr8GRiOqnovhtVZE47YfjFlA0LU2GsmdaLK8tFdh9Pn4Bja7oXZfb4k\nZxhg6KLNyB0YyiNvPUuoeRn//GWAgSO1HW1DnYpjIBGi+7Aa31nUydCn3mSMPU1n\nl6hjVGBpAgMBAAECggEAVzMY9uHaWv0M8EGqdNdxSzq0Y1xdECAjN9g0gO6FkrUH\nri6GVoV4Y9ugUOE8yZM8eAWC84pt1xp3BGMSlbntDXhjbX9RGNjBXQDwzjTlYEeY\nut6cic/0O7ujs1I31UwWghJe4PkJQOvCW8fdYuLsoE+PBhRZwUOKvX9h7QTZqiNA\njp/73+kVwNb61KGzjvzF0TzC/juqV+yPN5syjxP71e2LeDXe5C1lExZGCMZieWRI\nI4UCkMa1lSapFWMh/VxbhdjyT8l4Y7oE7y34cTSGEa06CDbE7jITvuU5YHafQhDp\nLsqbPq7SENqo6Ag7K50Gin6pFt+C3mn/JLV0nYMlaQKBgQDsgYbZ5AXOnuEtECft\n3WT4/BLu+3lysszVX0WTCtJN3GMvcjJq2YhrIPwYoH7uY1cCVHqfmmNjDQXkA1Jx\ngnm2G8ZfMDm6LZeDGx1T8KpCGXf2WO0ommT/RHpL3LkupnIWl2o8bsZKMAhOjvqb\nr11nXpQdrcJlFEKOgm+Io4q1PwKBgQDMb8aHnNLsn87i69OEJ04JeTvuW7oMg7u3\n6SrX4beCdeDqXi6z2XosbYadqW6/J4vaCZpwHINLCmQ8o4x6/jbfOJygOmcGRrUa\nWfXkddHIszPG7gRuJA+qNcra4ctujOWeIfuYlLnejOd0RUCGHUvh/BAR7Ow2/NHv\nhUJxLrU4VwKBgAbbSnmOrsxqtsSDr2SqAn9lb3cWO1Mj8+RLusykh6xSM13wxZ1r\naRUSA70DCisHHkKnCFcQNslsWztdDUrVKYoqC/o+f63yHG5kntkMJSN9cYjm0xlW\nQI9WAOWqJIRBtxUIlr/hxkXoVpVQd9uDngWdLFYf737Ws4dGKM2hUCgpAoGAbzT2\nZ9q1GiasYeAqxR6kYp7iLP0Ura4TNS3PMnQEYSFCYfstqIPK49QIgEckiTM37jl/\nGzFHclCKyjmlN1qF+tNO0BI07MMVzOnWypoUrfpdVf8vxcI0C0ELwhlFkjNuzKBr\nvkpY+WjoluT8/nd9ScbV7wpUTG0mvgZdaDgiOC0CgYB4V53yb/+DDLvz0ln1M2pm\nJEgxyGOdE2HUSCTce6ncFYZa+PU1e+R29BGfpa/5zGmVF1oCMvHIQNgcBxYo0y17\nOv9Gn8HqOCZy9y2Kgu2gi6Akym8Mmrhoei0QuXHmnmWX33mloTgeSJsLygl8hOkW\nADg+1XEeFZ5RmbWHXR1zaw==\n-----END PRIVATE KEY-----\n`
};

const firebaseConfig = {
  apiKey: "AIzaSyAk3Sg9xLMHTFniteRXsVK8zGdpcqWKhVw",
  authDomain: "ipindiaonline-1cb21.firebaseapp.com",
  projectId: "ipindiaonline-1cb21",
  storageBucket: "ipindiaonline-1cb21.firebasestorage.app",
  messagingSenderId: "689492433909",
  appId: "1:689492433909:web:9a14d617147435369d9ebc"
};

// Initialize Firebase Admin SDK (Server-Side)
if (!getAdminApps().length) {
  try {
    initAdminApp({
      credential: cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (err) {
    console.error('Firebase Admin SDK init error:', err);
  }
}

const adminDb = getAdminApps().length ? getAdminFirestore() : null;

// Initialize Client SDK (Fallback)
const clientApp = getClientApps().length > 0 ? getClientApp() : initClientApp(firebaseConfig);
export const clientDb = getClientFirestore(clientApp);

const COLLECTION_NAME = 'cms_portal';
const DOC_NAME = 'portal_data';

export async function fetchFirebaseData(): Promise<FullPortalData | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));

  const fetchPromise = (async () => {
    // 1. Try Firebase Admin SDK first (bypasses security rules cleanly)
    if (adminDb) {
      try {
        const docSnap = await adminDb.collection(COLLECTION_NAME).doc(DOC_NAME).get();
        if (docSnap.exists) {
          return docSnap.data() as FullPortalData;
        }
      } catch (error) {
        console.error('Admin SDK fetch error:', error);
      }
    }

    // 2. Fallback to Client SDK
    try {
      const docRef = doc(clientDb, COLLECTION_NAME, DOC_NAME);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as FullPortalData;
      }
    } catch (error) {
      console.error('Client SDK fetch error:', error);
    }

    return null;
  })();

  return Promise.race([fetchPromise, timeout]);
}

function sanitizeForFirestore(data: FullPortalData): any {
  const copy = JSON.parse(JSON.stringify(data));
  if (copy.portalSettings) {
    if (typeof copy.portalSettings.logo === 'string' && copy.portalSettings.logo.length > 50000) {
      copy.portalSettings.logo = '/images/ip-india-logo.svg';
    }
    if (typeof copy.portalSettings.emblemImage === 'string' && copy.portalSettings.emblemImage.length > 50000) {
      copy.portalSettings.emblemImage = '/images/ashoka-emblem.svg';
    }
  }
  return copy;
}

export async function saveFirebaseData(data: FullPortalData): Promise<boolean> {
  const cleanData = sanitizeForFirestore(data);

  // 1. Try Firebase Admin SDK first
  if (adminDb) {
    try {
      await adminDb.collection(COLLECTION_NAME).doc(DOC_NAME).set(cleanData, { merge: true });
      return true;
    } catch (error) {
      console.error('Admin SDK save error:', error);
    }
  }

  // 2. Fallback to Client SDK
  try {
    const docRef = doc(clientDb, COLLECTION_NAME, DOC_NAME);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error) {
    console.error('Client SDK save error:', error);
    return false;
  }
}
