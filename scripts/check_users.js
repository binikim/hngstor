import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
});

db.all("PRAGMA table_info(users)", (err, cols) => {
  if (err) {
    console.error("PRAGMA error:", err.message);
    db.close();
    return;
  }
  console.log("Columns in users table:", cols.map(c => c.name).join(", "));
  
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      console.error('Error selecting users:', err.message);
    } else {
      console.log(`--- USERS IN SQLITE (${rows.length} records) ---`);
      rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
        console.log('----------------------');
      });
    }
    db.close();
  });
});
