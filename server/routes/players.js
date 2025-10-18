const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM players ORDER BY id DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, role, mmr, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const stmt = db.prepare('INSERT INTO players (name, role, mmr, notes) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, role || null, mmr || null, notes || null);
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(player);
});

router.get('/:id', (req, res) => {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  if (!player) return res.status(404).json({ error: 'not found' });
  res.json(player);
});

router.delete('/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM players WHERE id = ?');
  const info = stmt.run(req.params.id);
  res.json({ deleted: info.changes });
});

module.exports = router;
