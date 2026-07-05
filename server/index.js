import express from 'express';
import cors from 'cors';
import db from './db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support base64 image uploads

// ----------------------------------------------------
// Users API
// ----------------------------------------------------
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/users/:uid', (req, res) => {
  db.get('SELECT * FROM users WHERE uid = ?', [req.params.uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

app.post('/api/users', (req, res) => {
  const { uid, email, displayName, phoneNumber, role, createdAt } = req.body;
  const sql = `INSERT INTO users (uid, email, displayName, phoneNumber, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [uid, email, displayName, phoneNumber, role || 'user', createdAt || new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, uid });
  });
});

app.put('/api/users/:uid', (req, res) => {
  const updates = req.body;
  const keys = Object.keys(updates).filter(k => k !== 'uid');
  if (keys.length === 0) return res.json({ success: true });
  
  const setString = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(req.params.uid);

  const sql = `UPDATE users SET ${setString}, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/users/:uid', (req, res) => {
  db.run('DELETE FROM users WHERE uid = ?', [req.params.uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ----------------------------------------------------
// Products API
// ----------------------------------------------------
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });
    res.json(row);
  });
});

app.post('/api/products', (req, res) => {
  const { id: reqId, name, category, price, stock, image, description, badge, createdAt } = req.body;
  const id = reqId || crypto.randomUUID();
  const sql = `INSERT INTO products (id, name, category, price, stock, image, description, badge, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, name, category, price, stock || 0, image, description, badge, createdAt || new Date().toISOString()], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/products/:id', (req, res) => {
  const updates = req.body;
  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length === 0) return res.json({ success: true });
  
  const setString = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);
  values.push(req.params.id);

  const sql = `UPDATE products SET ${setString}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ----------------------------------------------------
// Orders API
// ----------------------------------------------------
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Parse JSON strings back to objects
    const formatted = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
      shippingInfo: JSON.parse(r.shippingInfo || '{}'),
      paymentInfo: JSON.parse(r.paymentInfo || '{}')
    }));
    res.json(formatted);
  });
});

app.get('/api/orders/user/:userId', (req, res) => {
  db.all('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
      shippingInfo: JSON.parse(r.shippingInfo || '{}'),
      paymentInfo: JSON.parse(r.paymentInfo || '{}')
    }));
    res.json(formatted);
  });
});

app.post('/api/orders', (req, res) => {
  const { id: reqId, userId, userEmail, items, totalPrice, totalItems, shippingInfo, paymentMethod, paymentMethodLabel, paymentInfo, status, createdAt } = req.body;
  const id = reqId || crypto.randomUUID();
  const sql = `INSERT INTO orders (id, userId, userEmail, items, totalPrice, totalItems, shippingInfo, paymentMethod, paymentMethodLabel, paymentInfo, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [
    id, userId, userEmail, 
    JSON.stringify(items || []), totalPrice, totalItems, 
    JSON.stringify(shippingInfo || {}), paymentMethod, paymentMethodLabel || paymentMethod, JSON.stringify(paymentInfo || {}), status || 'ordered', 
    createdAt || new Date().toISOString()
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/orders/:id', (req, res) => {
  console.log(`[Backend] PUT /api/orders/${req.params.id} called with updates:`, req.body);
  const updates = req.body;
  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length === 0) {
    console.log("[Backend] No fields to update");
    return res.json({ success: true });
  }
  
  const setString = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    if (k === 'items' || k === 'shippingInfo' || k === 'paymentInfo') return JSON.stringify(updates[k]);
    return updates[k];
  });
  values.push(req.params.id);

  const sql = `UPDATE orders SET ${setString}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  console.log("[Backend] Executing SQL:", sql, "with values:", values);
  db.run(sql, values, function(err) {
    if (err) {
      console.error("[Backend] SQL Error updating order:", err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[Backend] Successfully updated order ${req.params.id}. Rows affected: ${this.changes}`);
    res.json({ success: true });
  });
});

app.delete('/api/orders/:id', (req, res) => {
  db.run('DELETE FROM orders WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ----------------------------------------------------
// Site Content API
// ----------------------------------------------------
app.get('/api/content/:id', (req, res) => {
  db.get('SELECT * FROM siteContent WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Content not found' });
    res.json({ id: row.id, content: JSON.parse(row.content || '{}') });
  });
});

app.put('/api/content/:id', (req, res) => {
  const { content } = req.body;
  const sql = `
    INSERT INTO siteContent (id, content, updatedAt) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updatedAt = CURRENT_TIMESTAMP
  `;
  db.run(sql, [req.params.id, JSON.stringify(content)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ----------------------------------------------------
// Authentication API (SQLite)
// ----------------------------------------------------
app.post('/api/auth/signup', (req, res) => {
  const { email, password, displayName, phoneNumber } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = email.toLowerCase();
  
  // Check if user already exists
  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [emailLower], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Email already in use' });

    const uid = crypto.randomUUID();
    const hashedPassword = hashPassword(password);
    const defaultAdminEmail = (process.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
    const role = (emailLower === defaultAdminEmail) ? 'admin' : 'user';
    const createdAt = new Date().toISOString();

    const sql = `INSERT INTO users (uid, email, password, displayName, phoneNumber, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [uid, email, hashedPassword, displayName || email.split('@')[0], phoneNumber || '', role, createdAt], function(insertErr) {
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      res.json({ uid, email, displayName, role, createdAt });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = email.toLowerCase();
  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [emailLower], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: 'User not found' });

    const hashedPassword = hashPassword(password);
    
    // Auto-initialize password for migrated users whose password field is NULL in SQLite
    if (row.password === null || row.password === '') {
      db.run('UPDATE users SET password = ? WHERE uid = ?', [hashedPassword, row.uid], (updateErr) => {
        if (updateErr) console.error("Error setting password for migrated user:", updateErr);
      });
      row.password = hashedPassword;
    }

    if (row.password !== hashedPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    res.json({
      uid: row.uid,
      email: row.email,
      displayName: row.displayName,
      phoneNumber: row.phoneNumber,
      role: row.role,
      createdAt: row.createdAt
    });
  });
});

app.post('/api/auth/change-password', (req, res) => {
  const { uid, currentPassword, newPassword } = req.body;
  if (!uid || !newPassword) {
    return res.status(400).json({ error: 'UID and new password are required' });
  }

  db.get('SELECT * FROM users WHERE uid = ?', [uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });

    // Verify current password if provided
    if (currentPassword) {
      const currentHashed = hashPassword(currentPassword);
      if (row.password !== currentHashed) {
        return res.status(400).json({ error: 'Invalid current password' });
      }
    }

    const newHashed = hashPassword(newPassword);
    db.run('UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE uid = ?', [newHashed, uid], function(updateErr) {
      if (updateErr) return res.status(500).json({ error: updateErr.message });
      res.json({ success: true });
    });
  });
});

app.post('/api/auth/delete-account', (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ error: 'UID is required' });
  }

  db.run('DELETE FROM users WHERE uid = ?', [uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Simulate sending reset email
  res.json({ success: true, message: 'Password reset link sent' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API Server running on port ${PORT}`);
});
