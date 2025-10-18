const fs = require('fs');
const path = require('path');
const db = require('./db');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

db.exec(`
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  mmr INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT,
  opponent TEXT,
  result TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  players TEXT, -- json list of player ids
  picks TEXT,   -- json representation of draft
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

console.log('Migration completed. DB at', path.join(dataDir, 'coachtzy.db'));
