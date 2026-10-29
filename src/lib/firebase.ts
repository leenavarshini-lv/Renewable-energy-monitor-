import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  writeBatch,
  collection,
  getDocs,
  limit,
  query
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { collectionsData } from '../data/allCollections';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

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
        auth.currentUser?.providerData?.map(provider => ({
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
export async function testConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    // Attempt a light server fetch to test connection
    await getDocFromServer(doc(db, '_health', 'status')).catch(() => null);
    return {
      connected: true,
      message: `Connected to Cloud Firestore (${firebaseConfig.firestoreDatabaseId})`,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { connected: false, message: 'Client offline or database unreachable' };
    }
    return { connected: true, message: `Active connection to ${firebaseConfig.projectId}` };
  }
}

// Direct Live Firestore Ingestion Function (Client-side Batch Commits)
export async function seedLiveFirestore(
  onProgress?: (collectionName: string, count: number, total: number) => void
): Promise<{ totalUploaded: number; summary: Record<string, number> }> {
  const BATCH_LIMIT = 400; // Under Firestore 500 ops limit
  const idFields: Record<string, string> = {
    plants: 'plantId',
    equipment: 'equipmentId',
    batteries: 'batteryId',
    generation: 'genId',
    consumers: 'consumerId',
    meters: 'meterId',
    readings: 'readingId',
    bills: 'billId',
    alerts: 'alertId',
    auditLogs: 'logId',
    tariffs: 'tariffId',
    config: 'key',
    users: 'userId',
  };

  const summary: Record<string, number> = {};
  let grandTotal = 0;

  for (const [colName, docs] of Object.entries(collectionsData)) {
    const idField = idFields[colName];
    let colUploaded = 0;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const chunk = (docs as any[]).slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const docId = String(item[idField]);
        const docRef = doc(db, colName, docId);
        batch.set(docRef, item);
      }

      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, colName);
      }

      colUploaded += chunk.length;
      grandTotal += chunk.length;
      if (onProgress) {
        onProgress(colName, colUploaded, docs.length);
      }
    }

    summary[colName] = colUploaded;
  }

  return { totalUploaded: grandTotal, summary };
}
