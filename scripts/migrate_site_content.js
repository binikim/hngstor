import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import sqlite3 from 'sqlite3';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const sqliteDb = new sqlite3.Database('./database.sqlite');

async function migrateSiteContent() {
  console.log('Fetching siteContent from Firebase...');
  const snapshot = await getDocs(collection(db, 'siteContent'));
  
  sqliteDb.serialize(() => {
    let count = 0;
    snapshot.forEach((doc) => {
      const id = doc.id;
      const data = doc.data();
      const content = JSON.stringify(data.content || data);
      
      const sql = `
        INSERT INTO siteContent (id, content, updatedAt) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET content = excluded.content, updatedAt = CURRENT_TIMESTAMP
      `;
      sqliteDb.run(sql, [id, content], (err) => {
        if (err) console.error('Error saving ' + id, err);
        else console.log('Successfully migrated siteContent: ' + id);
      });
      count++;
    });
    console.log(`Finished migrating ${count} siteContent documents.`);
  });
}

migrateSiteContent();
