import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId per skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client offline, falling back gracefully');
    }
  }
}
testConnection();

// Google Sign-In
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

export async function signOutUser() {
  return fbSignOut(auth);
}

// ==========================================
// Real-time Firestore Sync Helpers
// ==========================================

export function subscribeToFirestoreSpots(
  onUpdate: (spots: any[]) => void,
  onError?: (err: any) => void
) {
  const collectionPath = 'spots';
  try {
    return onSnapshot(
      collection(db, collectionPath),
      (snapshot) => {
        const loaded: any[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() });
        });
        onUpdate(loaded);
      },
      (error) => {
        console.warn('Firestore spots snapshot error:', error.message);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

export async function saveSpotToFirestore(spotData: any) {
  const collectionPath = 'spots';
  const spotDocId = String(spotData.id || `spot_${Date.now()}`);
  try {
    const spotRef = doc(db, collectionPath, spotDocId);
    await setDoc(spotRef, {
      ...spotData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return spotDocId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${spotDocId}`);
  }
}

export async function broadcastCommunityAlert(alertData: {
  title: string;
  message: string;
  lat: number;
  lng: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  creatorName?: string;
}) {
  const collectionPath = 'alerts';
  const alertId = `alert_${Date.now()}`;
  try {
    const alertRef = doc(db, collectionPath, alertId);
    await setDoc(alertRef, {
      ...alertData,
      createdBy: auth.currentUser?.uid || 'anon_citizen',
      creatorName: alertData.creatorName || 'সচেতন নাগরিক',
      createdAt: new Date().toISOString(),
    });
    return alertId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${alertId}`);
  }
}

