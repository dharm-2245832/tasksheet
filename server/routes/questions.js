const express = require('express');
const router = express.Router();
const db = require('../db/index');

// List questions
router.get('/', (req, res) => {
  const stmt = db.prepare('SELECT * FROM questions ORDER BY id DESC');
  const questions = stmt.all();
  res.json(questions);
});

// Create question
router.post('/', (req, res) => {
  if (req.user.role !== 'interviewer') return res.status(403).json({ error: 'Only interviewers can create questions' });

  const { title, description, difficulty, tags } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

  const stmt = db.prepare('INSERT INTO questions (title, description, difficulty, tags, created_by) VALUES (?, ?, ?, ?, ?)');
  const result = stmt.run(title, description, difficulty, tags, req.user.id);

  res.json({ id: result.lastInsertRowid, title, description, difficulty, tags });
});

module.exports = router;
