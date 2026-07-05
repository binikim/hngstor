import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.resolve(__dirname, '../database.sqlite');

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
      paymentMethodLabel TEXT,
      paymentInfo TEXT, -- JSON String
      status TEXT DEFAULT 'ordered',
      trackingNumber TEXT,
      deliveryCompany TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);

  db.all("PRAGMA table_info(orders)", (err, cols) => {
    if (!err && cols) {
      const columnNames = cols.map(c => c.name);
      if (!columnNames.includes('paymentMethodLabel')) {
        db.run("ALTER TABLE orders ADD COLUMN paymentMethodLabel TEXT", (alterErr) => {
          if (alterErr) console.error("Error adding paymentMethodLabel column to orders:", alterErr);
          else console.log("Added paymentMethodLabel column to orders table.");
        });
      }
      if (!columnNames.includes('paymentInfo')) {
        db.run("ALTER TABLE orders ADD COLUMN paymentInfo TEXT", (alterErr) => {
          if (alterErr) console.error("Error adding paymentInfo column to orders:", alterErr);
          else console.log("Added paymentInfo column to orders table.");
        });
      }
    }
  });

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
