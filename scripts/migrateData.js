import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Read Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../firebase-applet-config.json'), 'utf8'));

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. Connect to SQLite
const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

async function migrateCollection(collectionName, insertQuery, mapRowFunc) {
  console.log(`Starting migration for ${collectionName}...`);
  const snapshot = await getDocs(collection(firestore, collectionName));
  console.log(`Found ${snapshot.docs.length} documents in ${collectionName}.`);

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(insertQuery);
      
      let count = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        const values = mapRowFunc(doc.id, data);
        stmt.run(values, (err) => {
          if (err) console.error(`Error inserting ${doc.id} into ${collectionName}:`, err.message);
        });
        count++;
      });
      
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) {
          console.error(`Error committing ${collectionName}:`, err.message);
          reject(err);
        } else {
          console.log(`Successfully migrated ${count} documents for ${collectionName}.`);
          resolve();
        }
      });
    });
  });
}

async function runMigration() {
  try {
    // Migrate Users
    await migrateCollection(
      'users',
      `INSERT OR REPLACE INTO users (uid, email, displayName, phoneNumber, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      (id, data) => [id, data.email, data.displayName, data.phoneNumber, data.role || 'user', data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()]
    );

    // Migrate Products
    await migrateCollection(
      'products',
      `INSERT OR REPLACE INTO products (id, name, category, price, stock, image, description, badge, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      (id, data) => [id, data.name, data.category, data.price, data.stock || 0, data.image, data.description, data.badge, data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()]
    );

    // Migrate Orders
    await migrateCollection(
      'orders',
      `INSERT OR REPLACE INTO orders (id, userId, userEmail, items, totalPrice, totalItems, shippingInfo, paymentMethod, status, trackingNumber, deliveryCompany, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      (id, data) => [
        id, 
        data.userId, 
        data.userEmail, 
        JSON.stringify(data.items || []), 
        data.totalPrice, 
        data.totalItems, 
        JSON.stringify(data.shippingInfo || {}), 
        data.paymentMethod, 
        data.status || 'ordered', 
        data.trackingNumber, 
        data.deliveryCompany, 
        data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      ]
    );

    // Migrate Site Content
    await migrateCollection(
      'siteContent',
      `INSERT OR REPLACE INTO siteContent (id, content, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`,
      (id, data) => [id, JSON.stringify(data.content || {})]
    );

    console.log('Migration completed successfully! You can now use the SQLite database.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
