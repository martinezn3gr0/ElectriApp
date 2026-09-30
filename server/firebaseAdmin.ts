import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: App | undefined;

export function getAdminApp(): App {
  if (!app) {
    if (getApps().length) {
      app = getApps()[0]!;
      return app;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const projectId = firebaseConfig.projectId;

    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    } else {
      // Token verification needs projectId; privileged Firestore writes
      // require FIREBASE_SERVICE_ACCOUNT_JSON or ADC in production.
      app = initializeApp({ projectId });
    }
  }
  return app;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  const databaseId =
    (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';
  return getFirestore(getAdminApp(), databaseId);
}
