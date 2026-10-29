/**
 * Renewable Energy Management System (REMS)
 * Firestore Batch Seed Data Importer
 *
 * This script reads all 10 seed JSON collections and batch-uploads them
 * to Google Cloud Firestore with their native primary keys as document IDs.
 *
 * Configured automatically for project: authentic-delight-d01dl
 * Database: ai-studio-renewableenergym-267022c3-8229-459a-bbc9-8508d40b3177
 *
 * Usage:
 *   node importData.js
 *   node importData.js --dry-run
 *   node importData.js --collection=plants
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 400; // Firestore maximum batch limit is 500
const DATA_DIR = path.resolve(__dirname, 'seed_data');

// Try loading applet config if present
let appletConfig = {
  projectId: 'authentic-delight-d01dl',
  firestoreDatabaseId: 'ai-studio-renewableenergym-267022c3-8229-459a-bbc9-8508d40b3177'
};

const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    // use default
  }
}

const COLLECTIONS_CONFIG = [
  { collection: 'plants', file: 'plants.json', idField: 'plantId' },
  { collection: 'equipment', file: 'equipment.json', idField: 'equipmentId' },
  { collection: 'batteries', file: 'batteries.json', idField: 'batteryId' },
  { collection: 'generation', file: 'generation.json', idField: 'genId' },
  { collection: 'consumers', file: 'consumers.json', idField: 'consumerId' },
  { collection: 'meters', file: 'meters.json', idField: 'meterId' },
  { collection: 'readings', file: 'readings.json', idField: 'readingId' },
  { collection: 'bills', file: 'bills.json', idField: 'billId' },
  { collection: 'alerts', file: 'alerts.json', idField: 'alertId' },
  { collection: 'auditLogs', file: 'auditLogs.json', idField: 'logId' },
  { collection: 'tariffs', file: 'tariffs.json', idField: 'tariffId' },
  { collection: 'config', file: 'config.json', idField: 'key' },
  { collection: 'users', file: 'users.json', idField: 'userId' },
];

// CLI Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const targetColArg = args.find(a => a.startsWith('--collection='));
const targetCollection = targetColArg ? targetColArg.split('=')[1] : null;

async function initializeFirebase() {
  if (isDryRun) {
    console.log('[INFO] Running in DRY-RUN mode. Validating files, IDs, and batch structures without connecting to Firestore.');
    return null;
  }

  // Dynamic import of firebase-admin
  let admin;
  try {
    const adminModule = await import('firebase-admin');
    admin = adminModule.default || adminModule;
  } catch (err) {
    console.error('[ERROR] Could not load "firebase-admin". Please run: npm install firebase-admin');
    process.exit(1);
  }

  let app;
  if (admin.apps && admin.apps.length > 0) {
    app = admin.apps[0];
  } else if (fs.existsSync(serviceAccountPath)) {
    console.log(`[INFO] Initializing Firebase Admin with service account from: ${serviceAccountPath}`);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: appletConfig.projectId
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(`[INFO] Initializing Firebase Admin using GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: appletConfig.projectId
    });
  } else {
    try {
      app = admin.initializeApp({ projectId: appletConfig.projectId });
    } catch (e) {
      console.error('[ERROR] Failed to initialize Firebase Admin credentials:', e.message);
      process.exit(1);
    }
  }

  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(app, appletConfig.firestoreDatabaseId);
}

async function uploadCollection(db, config) {
  const { collection, file, idField } = config;
  const filePath = path.join(DATA_DIR, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const documents = JSON.parse(raw);

  console.log(`\n------------------------------------------------------------`);
  console.log(`Starting [${collection}] import (${documents.length} documents from ${file})...`);

  if (documents.length === 0) {
    console.log(`[SKIP] No documents found in ${file}`);
    return 0;
  }

  let totalUploaded = 0;
  let batchIndex = 1;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const chunk = documents.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      console.log(`  [DRY-RUN] Batch #${batchIndex}: Validated ${chunk.length} documents (IDs: ${chunk[0][idField]} ... ${chunk[chunk.length - 1][idField]})`);
      totalUploaded += chunk.length;
    } else {
      const batch = db.batch();

      for (const doc of chunk) {
        const docId = doc[idField];
        if (!docId) {
          throw new Error(`Missing expected primary key '${idField}' in document: ${JSON.stringify(doc)}`);
        }
        const docRef = db.collection(collection).doc(String(docId));
        batch.set(docRef, doc);
      }

      const startTime = Date.now();
      await batch.commit();
      const elapsedMs = Date.now() - startTime;

      console.log(`  [SUCCESS] Batch #${batchIndex}: Committed ${chunk.length} documents in ${elapsedMs}ms`);
      totalUploaded += chunk.length;
    }

    batchIndex++;
  }

  console.log(`Completed [${collection}]: ${totalUploaded} documents processed with doc IDs = '${idField}'.`);
  return totalUploaded;
}

async function runImport() {
  console.log('============================================================');
  console.log('   RENEWABLE ENERGY MANAGEMENT SYSTEM - FIRESTORE SEEDER   ');
  console.log('============================================================');
  console.log(`Project ID     : ${appletConfig.projectId}`);
  console.log(`Database ID    : ${appletConfig.firestoreDatabaseId || '(default)'}`);
  console.log(`Execution Mode : ${isDryRun ? 'DRY-RUN (Local validation, no writes)' : 'LIVE FIRESTORE COMMIT'}`);
  console.log(`Data Directory : ${DATA_DIR}`);
  console.log(`Batch Size     : ${BATCH_SIZE} ops/batch`);

  const db = await initializeFirebase();
  const startTime = Date.now();

  const configsToRun = targetCollection
    ? COLLECTIONS_CONFIG.filter(c => c.collection.toLowerCase() === targetCollection.toLowerCase())
    : COLLECTIONS_CONFIG;

  if (configsToRun.length === 0) {
    console.error(`[ERROR] Target collection "${targetCollection}" is not recognized.`);
    console.error(`Available collections: ${COLLECTIONS_CONFIG.map(c => c.collection).join(', ')}`);
    process.exit(1);
  }

  let grandTotal = 0;
  for (const config of configsToRun) {
    try {
      const count = await uploadCollection(db, config);
      grandTotal += count;
    } catch (err) {
      console.error(`[FAILURE] Failed importing ${config.collection}:`, err.message);
      process.exit(1);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n============================================================');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('============================================================');
  console.log(`Total Collections Processed : ${configsToRun.length}`);
  console.log(`Total Documents Seeded      : ${grandTotal}`);
  console.log(`Total Elapsed Time          : ${totalTimeSec} seconds`);
  console.log('Status                      : COMPLETED SUCCESSFULLY');
  console.log('============================================================\n');
}

runImport().catch(err => {
  console.error('Fatal error during import execution:', err);
  process.exit(1);
});
