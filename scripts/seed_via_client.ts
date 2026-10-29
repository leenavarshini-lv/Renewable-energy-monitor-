import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const collections = [
  { name: 'plants', file: 'plants.json', id: 'plantId' },
  { name: 'equipment', file: 'equipment.json', id: 'equipmentId' },
  { name: 'batteries', file: 'batteries.json', id: 'batteryId' },
  { name: 'generation', file: 'generation.json', id: 'genId' },
  { name: 'consumers', file: 'consumers.json', id: 'consumerId' },
  { name: 'meters', file: 'meters.json', id: 'meterId' },
  { name: 'readings', file: 'readings.json', id: 'readingId' },
  { name: 'bills', file: 'bills.json', id: 'billId' },
  { name: 'alerts', file: 'alerts.json', id: 'alertId' },
  { name: 'carbonCredits', file: 'carbonCredits.json', id: 'creditId' },
];

async function seed() {
  console.log(`Starting live seeding to Project: ${config.projectId}, Database: ${config.firestoreDatabaseId}...`);
  for (const col of collections) {
    const filePath = path.resolve('seed_data', col.file);
    const docs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Uploading ${docs.length} documents into collection "${col.name}"...`);

    const batch = writeBatch(db);
    for (const item of docs) {
      const docRef = doc(db, col.name, String(item[col.id]));
      batch.set(docRef, item);
    }
    await batch.commit();
    console.log(`Committed ${docs.length} docs to "${col.name}"!`);
  }
  console.log('ALL 10 COLLECTIONS SEEDED SUCCESSFULLY!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
