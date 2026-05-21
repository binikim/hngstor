import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve('database.sqlite');
const db = new sqlite3.Database(dbPath);

const emailToDelete = 'sa1229@naver.com';

db.run('DELETE FROM users WHERE email = ?', [emailToDelete], function(err) {
  if (err) {
    console.error('Error deleting user:', err.message);
  } else {
    console.log(`Successfully deleted ${this.changes} user(s) with email: ${emailToDelete}`);
  }
  db.close();
});
