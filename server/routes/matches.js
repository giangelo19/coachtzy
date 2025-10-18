const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM matches ORDER BY id DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { date, opponent, result, notes } = req.body;
  const stmt = db.prepare('INSERT INTO matches (date, opponent, result, notes) VALUES (?, ?, ?, ?)');
  const info = stmt.run(date || null, opponent || null, result || null, notes || null);
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(match);
});

router.get('/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'not found' });
  res.json(m);
});

module.exports = router;
