import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
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
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId per skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Messaging instance
let messagingInstance: any = null;

export async function getFCMInstance() {
  if (messagingInstance) return messagingInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    }
  } catch (err) {
    console.warn('Firebase Messaging not supported in this environment:', err);
  }
  return null;
}

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

// Ensure active Firebase Auth session for Firestore security rules compliance
export async function ensureFirebaseAuthSession() {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('Anonymous Firebase auth fallback error:', err);
    return null;
  }
}
ensureFirebaseAuthSession();

// Subtle Web Audio alert beep/chime for high-threat notifications
export function playAlertChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3); // drop to A4
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

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

export async function voteSpotInFirestore(spotId: number | string, isUp: boolean) {
  const collectionPath = 'spots';
  const spotDocId = String(spotId);
  try {
    const spotRef = doc(db, collectionPath, spotDocId);
    await updateDoc(spotRef, {
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${spotDocId}`);
  }
}

export function subscribeToFirestoreAlerts(
  onUpdate: (alerts: any[]) => void,
  onError?: (err: any) => void
) {
  const collectionPath = 'alerts';
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
        console.warn('Firestore alerts error:', error.message);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

export async function broadcastCommunityAlert(alertData: {
  title: string;
  message: string;
  lat: number;
  lng: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  creatorName?: string;
  district?: string;
  spotId?: number | string;
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

// ==========================================
// Firebase Cloud Messaging (FCM) & Web Push
// ==========================================

export async function requestFCMPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const messaging = await getFCMInstance();
    if (!messaging) return null;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
        });
        return token;
      } catch (swErr) {
        console.warn('Service worker registration / FCM token warning:', swErr);
      }
    }
  } catch (err) {
    console.warn('FCM permission error:', err);
  }
  return null;
}

export async function setupFCMForegroundListener(onMessageReceived: (payload: any) => void) {
  const messaging = await getFCMInstance();
  if (messaging) {
    return onMessage(messaging, (payload) => {
      onMessageReceived(payload);
    });
  }
  return () => {};
}

/**
 * Triggers a real-time district push alert when a new high-threat spot is reported
 */
export async function triggerDistrictPushAlert(spot: {
  name: string;
  division: string;
  area: string;
  rate: string;
  unit: string;
  coords: [number, number];
  id: number;
  status: string;
}) {
  const title = `🚨 [${spot.division} বিভাগ] নতুন রেড জোন চাঁদাবাজি সতর্কতা!`;
  const message = `${spot.name} (${spot.area}) স্পটে ৳ ${spot.rate} (${spot.unit}) হারে জোরপূর্বক চাঁদা আদায়ের অভিযোগ রিপোর্ট করা হয়েছে। সতর্ক থাকুন।`;

  // 1. Broadcast to Firestore alerts collection for all users in the district
  await broadcastCommunityAlert({
    title,
    message,
    lat: spot.coords[0],
    lng: spot.coords[1],
    severity: 'CRITICAL',
    creatorName: 'জাতীয় সিভিক ডিফেন্স সেল',
    district: spot.division,
    spotId: spot.id,
  });

  // 2. Play alert chime if enabled
  if (typeof window !== 'undefined' && localStorage.getItem('civic_push_sound') !== 'false') {
    playAlertChime();
  }

  // 3. Trigger Web Push Notification via Service Worker or Notification API if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const notificationOptions = {
      body: message,
      icon: 'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg',
      badge: 'https://i.ibb.co.com/vCMSKN3d/user-icon-simple-design-free-vector.jpg',
      tag: `spot_alert_${spot.id}`,
      data: { spotId: spot.id, division: spot.division },
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, notificationOptions);
        })
        .catch(() => {
          try {
            new Notification(title, notificationOptions);
          } catch (e) {
            console.warn('Native notification fallback error:', e);
          }
        });
    } else {
      try {
        new Notification(title, notificationOptions);
      } catch (e) {
        console.warn('Native notification trigger:', e);
      }
    }
  }
}



