const express = require('express');
const db = require('../db');
const router = express.Router();

// simple draft simulator: split players into two teams randomly
router.post('/simulate', (req, res) => {
  const { playerIds } = req.body; // optional list; if not provided, use all players
  let players;
  if (Array.isArray(playerIds) && playerIds.length) {
    const placeholders = playerIds.map(() => '?').join(',');
    players = db.prepare(`SELECT * FROM players WHERE id IN (${placeholders})`).all(...playerIds);
  } else {
    players = db.prepare('SELECT * FROM players').all();
  }

  // shuffle
  for (let i = players.length -1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  const half = Math.ceil(players.length / 2);
  const teamA = players.slice(0, half);
  const teamB = players.slice(half);

  const draft = { teamA, teamB };
  const stmt = db.prepare('INSERT INTO drafts (players, picks) VALUES (?, ?)');
  stmt.run(JSON.stringify(players.map(p => p.id)), JSON.stringify(draft));

  res.json(draft);
});

module.exports = router;
