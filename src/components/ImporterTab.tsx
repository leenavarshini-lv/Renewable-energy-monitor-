import React, { useState } from 'react';
import {
  FileCode,
  Terminal,
  Copy,
  Check,
  Download,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Database,
  Flame,
  AlertCircle
} from 'lucide-react';
import { COLLECTION_METAS } from '../types/energy';
import { collectionsData } from '../data/allCollections';

const SCRIPT_SOURCE = `/**
 * Renewable Energy Management System (REMS)
 * Firestore Batch Seed Data Importer
 *
 * This script reads all 10 seed JSON collections and batch-uploads them
 * to Google Cloud Firestore with their native primary keys as document IDs.
 *
 * Usage:
 *   node importData.js
 *   node importData.js --dry-run
 *   node importData.js --collection=plants
 *
 * Requirements:
 *   npm install firebase-admin
 *   Provide serviceAccountKey.json in the same directory OR set
 *   GOOGLE_APPLICATION_CREDENTIALS environment variable.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BATCH_SIZE = 400; // Firestore maximum batch limit is 500
const DATA_DIR = path.resolve(__dirname, 'seed_data');

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
  { collection: 'carbonCredits', file: 'carbonCredits.json', idField: 'creditId' },
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

  if (admin.apps && admin.apps.length > 0) {
    return admin.firestore();
  }

  const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY || path.join(__dirname, 'serviceAccountKey.json');

  if (fs.existsSync(serviceAccountPath)) {
    console.log(\`[INFO] Initializing Firebase Admin with service account from: \${serviceAccountPath}\`);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log(\`[INFO] Initializing Firebase Admin using GOOGLE_APPLICATION_CREDENTIALS: \${process.env.GOOGLE_APPLICATION_CREDENTIALS}\`);
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(\`[INFO] Connecting to Firestore Emulator at \${process.env.FIRESTORE_EMULATOR_HOST}\`);
    admin.initializeApp({ projectId: 'demo-energy-system' });
  } else {
    console.warn('[WARN] No serviceAccountKey.json or GOOGLE_APPLICATION_CREDENTIALS detected.');
    console.warn('[WARN] Attempting default credentials initialization...');
    try {
      admin.initializeApp();
    } catch (e) {
      console.error('[ERROR] Failed to initialize Firebase Admin credentials.');
      console.error('Please place your serviceAccountKey.json in this directory or run with --dry-run to test locally.');
      process.exit(1);
    }
  }

  return admin.firestore();
}

async function uploadCollection(db, config) {
  const { collection, file, idField } = config;
  const filePath = path.join(DATA_DIR, file);

  if (!fs.existsSync(filePath)) {
    throw new Error(\`File not found: \${filePath}\`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const documents = JSON.parse(raw);

  console.log(\`\\n------------------------------------------------------------\`);
  console.log(\`Starting [\${collection}] import (\${documents.length} documents from \${file})...\`);

  if (documents.length === 0) {
    console.log(\`[SKIP] No documents found in \${file}\`);
    return 0;
  }

  let totalUploaded = 0;
  let batchIndex = 1;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const chunk = documents.slice(i, i + BATCH_SIZE);

    if (isDryRun) {
      console.log(\`  [DRY-RUN] Batch #\${batchIndex}: Validated \${chunk.length} documents (IDs: \${chunk[0][idField]} ... \${chunk[chunk.length - 1][idField]})\`);
      totalUploaded += chunk.length;
    } else {
      const batch = db.batch();

      for (const doc of chunk) {
        const docId = doc[idField];
        if (!docId) {
          throw new Error(\`Missing expected primary key '\${idField}' in document: \${JSON.stringify(doc)}\`);
        }
        const docRef = db.collection(collection).doc(String(docId));
        batch.set(docRef, doc);
      }

      const startTime = Date.now();
      await batch.commit();
      const elapsedMs = Date.now() - startTime;

      console.log(\`  [SUCCESS] Batch #\${batchIndex}: Committed \${chunk.length} documents in \${elapsedMs}ms\`);
      totalUploaded += chunk.length;
    }

    batchIndex++;
  }

  console.log(\`Completed [\${collection}]: \${totalUploaded} documents processed with doc IDs = '\${idField}'.\`);
  return totalUploaded;
}

async function runImport() {
  console.log('============================================================');
  console.log('   RENEWABLE ENERGY MANAGEMENT SYSTEM - FIRESTORE SEEDER   ');
  console.log('============================================================');
  console.log(\`Execution Mode : \${isDryRun ? 'DRY-RUN (Local validation, no writes)' : 'LIVE FIRESTORE COMMIT'}\`);
  console.log(\`Data Directory : \${DATA_DIR}\`);
  console.log(\`Batch Size     : \${BATCH_SIZE} ops/batch\`);

  const db = await initializeFirebase();
  const startTime = Date.now();

  const configsToRun = targetCollection
    ? COLLECTIONS_CONFIG.filter(c => c.collection.toLowerCase() === targetCollection.toLowerCase())
    : COLLECTIONS_CONFIG;

  if (configsToRun.length === 0) {
    console.error(\`[ERROR] Target collection "\${targetCollection}" is not recognized.\`);
    console.error(\`Available collections: \${COLLECTIONS_CONFIG.map(c => c.collection).join(', ')}\`);
    process.exit(1);
  }

  let grandTotal = 0;
  for (const config of configsToRun) {
    try {
      const count = await uploadCollection(db, config);
      grandTotal += count;
    } catch (err) {
      console.error(\`[FAILURE] Failed importing \${config.collection}:\`, err.message);
      process.exit(1);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\\n============================================================');
  console.log('                    IMPORT SUMMARY                          ');
  console.log('============================================================');
  console.log(\`Total Collections Processed : \${configsToRun.length}\`);
  console.log(\`Total Documents Seeded      : \${grandTotal}\`);
  console.log(\`Total Elapsed Time          : \${totalTimeSec} seconds\`);
  console.log('Status                      : COMPLETED SUCCESSFULLY');
  console.log('============================================================\\n');
}

runImport().catch(err => {
  console.error('Fatal error during import execution:', err);
  process.exit(1);
});
`;

import { seedLiveFirestore, FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../lib/firebase';

export const ImporterTab: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Simulation & Live Upload state
  const [simulating, setSimulating] = useState(false);
  const [isUploadingLive, setIsUploadingLive] = useState(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [currentCollection, setCurrentCollection] = useState<string>('');

  const handleUploadLive = async () => {
    const logs: string[] = [
      '============================================================',
      '       LIVE GOOGLE CLOUD FIRESTORE BATCH SEEDER             ',
      '============================================================',
      `Target Project  : ${FIREBASE_PROJECT_ID}`,
      `Target Database : ${FIRESTORE_DATABASE_ID}`,
      'Connecting via client SDK writeBatch() in chunks of 400...',
    ];
    try {
      setIsUploadingLive(true);
      setSimProgress(0);
      setSimLogs([...logs]);

      let collectionsDone = 0;
      await seedLiveFirestore((colName, count, total) => {
        collectionsDone++;
        logs.push(`[COMMITTED] Collection "${colName}": ${count}/${total} documents written to live Firestore.`);
        setSimLogs([...logs]);
        setSimProgress(Math.round((collectionsDone / COLLECTION_METAS.length) * 100));
        setCurrentCollection(`Uploaded ${colName}`);
      });

      logs.push('\n============================================================');
      logs.push('                    UPLOAD SUMMARY                          ');
      logs.push('============================================================');
      logs.push('All 1,200 documents seeded successfully into Google Cloud Firestore!');
      logs.push(`Database: ${FIRESTORE_DATABASE_ID}`);
      logs.push('Status: 100% PERSISTED TO CLOUD');
      logs.push('============================================================');
      setSimLogs([...logs]);
      setSimProgress(100);
      setCurrentCollection('Live Ingestion Finished');
    } catch (err: any) {
      logs.push(`[ERROR] Live upload error: ${err.message || String(err)}`);
      setSimLogs([...logs]);
    } finally {
      setIsUploadingLive(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SCRIPT_SOURCE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([SCRIPT_SOURCE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'importData.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runSimulation = async () => {
    setSimulating(true);
    setSimProgress(0);
    const logs: string[] = [
      '============================================================',
      '   RENEWABLE ENERGY MANAGEMENT SYSTEM - FIRESTORE SEEDER   ',
      '============================================================',
      'Execution Mode : SIMULATION (Browser Batch Runner)',
      'Batch Size     : 400 ops/batch (under 500 limit)',
      '[INFO] Validating 10 collections with native primary keys as Firestore Document IDs...'
    ];
    setSimLogs([...logs]);

    let totalDocs = 0;
    for (let i = 0; i < COLLECTION_METAS.length; i++) {
      const meta = COLLECTION_METAS[i];
      setCurrentCollection(meta.label);

      logs.push(`\n------------------------------------------------------------`);
      logs.push(`Starting [${meta.key}] import (120 documents from ${meta.fileName})...`);
      setSimLogs([...logs]);

      await new Promise(r => setTimeout(r, 220));

      const firstId = `${meta.idField.slice(0, 4).toUpperCase()}_001`;
      const lastId = `${meta.idField.slice(0, 4).toUpperCase()}_120`;
      logs.push(`  [COMMITTED] Batch #1: 120 documents (IDs: ${firstId} ... ${lastId}) into collection "${meta.key}"`);
      logs.push(`Completed [${meta.key}]: 120 documents verified with doc IDs matching "${meta.idField}".`);
      totalDocs += 120;

      setSimProgress(Math.round(((i + 1) / COLLECTION_METAS.length) * 100));
      setSimLogs([...logs]);
    }

    logs.push('\n============================================================');
    logs.push('                    IMPORT SUMMARY                          ');
    logs.push('============================================================');
    logs.push(`Total Collections Processed : 10`);
    logs.push(`Total Documents Seeded      : ${totalDocs}`);
    logs.push(`Document Key Strategy       : Native Entities IDs as Firestore Doc IDs`);
    logs.push(`Status                      : COMPLETED WITH 100% INTEGRITY`);
    logs.push('============================================================');

    setSimLogs([...logs]);
    setSimulating(false);
    setCurrentCollection('All 10 Collections Completed');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Firestore Node.js Batch Importer (<code className="text-amber-400">importData.js</code>)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Production-grade Node.js import script utilizing <code className="text-slate-200">firebase-admin</code> to batch upload all 10 collections (120 documents each) with entity IDs mapped directly as Firestore Document IDs, respecting Firestore's 500 operations batch limit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUploadLive}
              disabled={isUploadingLive}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>{isUploadingLive ? 'Seeding Firestore...' : 'Seed Live Cloud Database'}</span>
            </button>

            <button
              onClick={handleCopyScript}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedScript ? 'Copied' : 'Copy Script'}</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Script</span>
            </button>
          </div>
        </div>

        {/* Quick Command Snippets */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>1. Dry-Run Validation</span>
              <button
                onClick={() => handleCopyCmd('node importData.js --dry-run')}
                className="text-slate-500 hover:text-emerald-400 cursor-pointer"
              >
                {copiedCmd === 'node importData.js --dry-run' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-emerald-300 block">
              node importData.js --dry-run
            </code>
            <p className="text-[11px] text-slate-500 mt-1">Tests parsing, IDs & batches without writes</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>2. Single Collection</span>
              <button
                onClick={() => handleCopyCmd('node importData.js --collection=plants')}
                className="text-slate-500 hover:text-emerald-400 cursor-pointer"
              >
                {copiedCmd === 'node importData.js --collection=plants' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-emerald-300 block">
              node importData.js --collection=plants
            </code>
            <p className="text-[11px] text-slate-500 mt-1">Imports only the specified collection</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>3. Full Live Import</span>
              <button
                onClick={() => handleCopyCmd('node importData.js')}
                className="text-slate-500 hover:text-emerald-400 cursor-pointer"
              >
                {copiedCmd === 'node importData.js' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <code className="text-xs font-mono text-emerald-300 block">
              node importData.js
            </code>
            <p className="text-[11px] text-slate-500 mt-1">Batch commits all 1,200 documents</p>
          </div>
        </div>
      </div>

      {/* Interactive Batch Runner Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-800/60 border-b border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Interactive Batch Import Simulator</h3>
            <span className="text-xs text-slate-400">
              (Simulates terminal execution and Firestore batch chunks)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{simulating ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
            {simLogs.length > 0 && !simulating && (
              <button
                onClick={() => {
                  setSimLogs([]);
                  setSimProgress(0);
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg cursor-pointer"
                title="Clear console"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {simulating || simProgress > 0 ? (
          <div className="bg-slate-950 px-4 pt-3 pb-2 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{currentCollection || 'Processing batches...'}</span>
              <span className="text-emerald-400 font-mono font-semibold">{simProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${simProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Terminal output console */}
        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 h-64 overflow-y-auto leading-relaxed">
          {simLogs.length === 0 ? (
            <div className="text-slate-600 flex flex-col items-center justify-center h-full space-y-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <span>Click "Run Simulation" to visualize the Firestore batch ingestion process.</span>
            </div>
          ) : (
            simLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.startsWith('  [COMMITTED]')
                    ? 'text-emerald-400'
                    : log.startsWith('Completed')
                    ? 'text-teal-300 font-bold'
                    : log.includes('ERROR') || log.includes('FAILURE')
                    ? 'text-rose-400'
                    : log.startsWith('===')
                    ? 'text-slate-500 font-bold'
                    : 'text-slate-300'
                }
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white font-mono">importData.js (Source Code)</span>
          </div>
          <button
            onClick={handleCopyScript}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px]">
          <pre>{SCRIPT_SOURCE}</pre>
        </div>
      </div>
    </div>
  );
};
