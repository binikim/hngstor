import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT,
      displayName TEXT,
      phoneNumber TEXT,
      role TEXT DEFAULT 'user',
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Migrate: add password column if it doesn't exist
  db.all("PRAGMA table_info(users)", (err, cols) => {
    if (!err && cols) {
      const hasPassword = cols.some(c => c.name === 'password');
      if (!hasPassword) {
        db.run("ALTER TABLE users ADD COLUMN password TEXT", (alterErr) => {
          if (alterErr) console.error("Error adding password column to users:", alterErr);
          else console.log("Added password column to users table.");
        });
      }
    }
  });

  // Products Table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      stock INTEGER DEFAULT 0,
      image TEXT,
      description TEXT,
      badge TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Orders Table
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userEmail TEXT NOT NULL,
      items TEXT NOT NULL, -- JSON String
      totalPrice INTEGER NOT NULL,
      totalItems INTEGER NOT NULL,
      shippingInfo TEXT NOT NULL, -- JSON String
      paymentMethod TEXT,
      status TEXT DEFAULT 'ordered',
      trackingNumber TEXT,
      deliveryCompany TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  // Site Content Table (Key-Value pair essentially)
  db.run(`
    CREATE TABLE IF NOT EXISTS siteContent (
      id TEXT PRIMARY KEY, -- e.g., 'footer', 'home', 'about'
      content TEXT NOT NULL, -- JSON String
      updatedAt TEXT
    )
  `);
});

export default db;
