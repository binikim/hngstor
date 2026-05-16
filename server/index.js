import express from 'express';
import cors from 'cors';
import db from './db.js';
import crypto from 'crypto';

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
      shippingInfo: JSON.parse(r.shippingInfo || '{}')
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
      shippingInfo: JSON.parse(r.shippingInfo || '{}')
    }));
    res.json(formatted);
  });
});

app.post('/api/orders', (req, res) => {
  const { id: reqId, userId, userEmail, items, totalPrice, totalItems, shippingInfo, paymentMethod, status, createdAt } = req.body;
  const id = reqId || crypto.randomUUID();
  const sql = `INSERT INTO orders (id, userId, userEmail, items, totalPrice, totalItems, shippingInfo, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [
    id, userId, userEmail, 
    JSON.stringify(items || []), totalPrice, totalItems, 
    JSON.stringify(shippingInfo || {}), paymentMethod, status || 'ordered', 
    createdAt || new Date().toISOString()
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

app.put('/api/orders/:id', (req, res) => {
  const updates = req.body;
  const keys = Object.keys(updates).filter(k => k !== 'id');
  if (keys.length === 0) return res.json({ success: true });
  
  const setString = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => {
    if (k === 'items' || k === 'shippingInfo') return JSON.stringify(updates[k]);
    return updates[k];
  });
  values.push(req.params.id);

  const sql = `UPDATE orders SET ${setString}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API Server running on port ${PORT}`);
});
