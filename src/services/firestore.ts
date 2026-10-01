import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
  orderBy,
  type Unsubscribe,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import type { SavedMemory } from '../types';

// Read config from Vite environment variables (for GitHub Secrets / Vercel) or fallback
const firebaseConfig = firebaseConfigRaw as Record<string, string | undefined>;

const apiKey =
  (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ||
  firebaseConfig.apiKey ||
  '';
const projectId =
  (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ||
  firebaseConfig.projectId ||
  '';
const appId =
  (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ||
  firebaseConfig.appId ||
  '';
const authDomain =
  (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ||
  firebaseConfig.authDomain ||
  '';
const firestoreDatabaseId =
  (import.meta.env.VITE_FIREBASE_DATABASE_ID as string | undefined) ||
  firebaseConfig.firestoreDatabaseId ||
  '(default)';
const storageBucket =
  (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ||
  firebaseConfig.storageBucket ||
  '';
const messagingSenderId =
  (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ||
  firebaseConfig.messagingSenderId ||
  '';

// When apiKey is absent, the app runs in pure offline / local-first mode (100% safe for GitHub public repos!)
export const isFirebaseConfigured: boolean = Boolean(apiKey && apiKey.trim().length > 0);

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    const config = {
      apiKey,
      projectId,
      appId,
      authDomain,
      storageBucket,
      messagingSenderId,
      firestoreDatabaseId,
    };
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    db = getFirestore(app, firestoreDatabaseId);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase init error (running in local storage mode):', err);
  }
}

const googleProvider = new GoogleAuthProvider();

// Error Handling Specification as required by skill
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
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on app boot if configured
export async function testConnection(): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
    return false;
  }
}

if (isFirebaseConfigured) {
  testConnection();
}

// Sign In with Google
export const signInWithGoogle = async (): Promise<User> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Aplikasi berjalan dalam Mode Lokal (Tanpa API Key). Semua hasil foto strip tersimpan aman di perangkat Anda (LocalStorage)!');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
};

// Log Out
export const logoutUser = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
};

// Listen to Auth State
export const onAuthChange = (callback: (user: User | null) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Real-time synchronization listener for user memories in Cloud Firestore
 */
export const subscribeToUserMemories = (
  userId: string,
  onUpdate: (memories: SavedMemory[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const colPath = `users/${userId}/memories`;
  const q = query(collection(db, colPath), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedMemory[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          title: data.title || '',
          caption: data.caption || '',
          coupleNames: data.coupleNames || '',
          city1: data.city1 || '',
          city2: data.city2 || '',
          distanceKm: data.distanceKm,
          dateStr: data.dateStr || '',
          imageDataUrl: data.imageDataUrl || '',
          layout: data.layout || 'strip3',
          theme: data.theme || 'blush',
          createdAt: data.createdAt || Date.now(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.error('Error listening to user memories:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, colPath);
    }
  );
};

/**
 * Save memory to Cloud Firestore
 */
export const saveMemoryToCloud = async (userId: string, memory: SavedMemory): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;

  const docPath = `users/${userId}/memories/${memory.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'memories', memory.id);
    const payload = {
      id: memory.id,
      userId,
      title: memory.title || 'Momen Pasangan',
      caption: memory.caption || '',
      coupleNames: memory.coupleNames || 'Pasangan',
      city1: memory.city1 || '',
      city2: memory.city2 || '',
      distanceKm: memory.distanceKm || 0,
      dateStr: memory.dateStr || '',
      imageDataUrl: memory.imageDataUrl,
      layout: memory.layout,
      theme: memory.theme,
      createdAt: memory.createdAt,
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
};

/**
 * Delete memory from Cloud Firestore
 */
export const deleteMemoryFromCloud = async (userId: string, memoryId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;

  const docPath = `users/${userId}/memories/${memoryId}`;
  try {
    const docRef = doc(db, 'users', userId, 'memories', memoryId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
};
