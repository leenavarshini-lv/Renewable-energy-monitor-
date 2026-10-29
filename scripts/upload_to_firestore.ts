import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function uploadNewCollections() {
  console.log(`Targeting Firestore DB: ${config.firestoreDatabaseId}`);

  // 1. Tariffs
  const tariffs = JSON.parse(fs.readFileSync('seed_data/tariffs.json', 'utf8'));
  const batch1 = writeBatch(db);
  for (const item of tariffs) {
    batch1.set(doc(db, 'tariffs', item.tariffId), item);
  }
  await batch1.commit();
  console.log(`Seeded ${tariffs.length} tariffs to Firestore!`);

  // 2. Config
  const configs = JSON.parse(fs.readFileSync('seed_data/config.json', 'utf8'));
  const batch2 = writeBatch(db);
  for (const item of configs) {
    batch2.set(doc(db, 'config', item.key), item);
  }
  await batch2.commit();
  console.log(`Seeded ${configs.length} config documents to Firestore!`);

  // 3. Users (Chunked batch)
  const users = JSON.parse(fs.readFileSync('seed_data/users.json', 'utf8'));
  const BATCH_SIZE = 400;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const chunk = users.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.set(doc(db, 'users', item.userId), item);
    }
    await batch.commit();
    console.log(`Seeded chunk of ${chunk.length} users to Firestore!`);
  }

  // 4. Remove / clean up carbonCredits collection
  console.log('Cleaning up carbonCredits collection...');
  try {
    const ccSnapshot = await getDocs(collection(db, 'carbonCredits'));
    if (!ccSnapshot.empty) {
      const deleteBatch = writeBatch(db);
      ccSnapshot.docs.forEach(d => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
      console.log(`Cleaned up ${ccSnapshot.docs.length} documents from carbonCredits.`);
    }
  } catch (err: any) {
    console.log('carbonCredits cleanup status:', err.message);
  }

  console.log('All updates applied to Firestore successfully!');
  process.exit(0);
}

uploadNewCollections().catch(e => {
  console.error('Upload error:', e);
  process.exit(1);
});
