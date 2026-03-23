const express = require('express');
const router = express.Router();
const db = require('../db/index');
const crypto = require('crypto');

// Get interviewer's rooms
router.get('/', (req, res) => {
  if (req.user.role !== 'interviewer') return res.status(403).json({ error: 'Only interviewers can view rooms' });

  const stmt = db.prepare('SELECT * FROM rooms WHERE interviewer_id = ? ORDER BY created_at DESC');
  const rooms = stmt.all(req.user.id);
  res.json(rooms);
});

// Create room
router.post('/', (req, res) => {
  if (req.user.role !== 'interviewer') return res.status(403).json({ error: 'Only interviewers can create rooms' });

  const slug = crypto.randomBytes(4).toString('hex');
  const stmt = db.prepare('INSERT INTO rooms (slug, interviewer_id, status) VALUES (?, ?, ?)');
  const result = stmt.run(slug, req.user.id, 'active');

  res.json({ id: result.lastInsertRowid, slug, status: 'active' });
});

// Get room detail
router.get('/:slug', (req, res) => {
  const stmt = db.prepare('SELECT * FROM rooms WHERE slug = ?');
  const room = stmt.get(req.params.slug);

  if (!room) return res.status(404).json({ error: 'Room not found' });

  res.json(room);
});

module.exports = router;
