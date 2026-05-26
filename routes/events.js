const express = require('express');
const { pool } = require('../db/connection');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['workshop', 'bootcamp', 'hackathon', 'seminar'];

// Public: list events (supports ?q=search & ?category=filter) — used by Exp 7 AJAX.
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const params = [];
    let where = '1 = 1';
    if (q) {
      where += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (category && CATEGORIES.includes(category)) {
      where += ' AND category = ?';
      params.push(category);
    }
    const [rows] = await pool.query(
      `SELECT id, title, description, category, event_date, location, capacity, image_url, created_at
       FROM events
       WHERE ${where}
       ORDER BY event_date ASC`,
      params
    );
    res.json({ events: rows });
  } catch (err) {
    next(err);
  }
});

// Public: single event
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
});

function validateEventPayload(body) {
  const { title, description, category, event_date, location, capacity, image_url } = body || {};
  if (!title || !description || !category || !event_date || !location) {
    return 'title, description, category, event_date and location are required';
  }
  if (!CATEGORIES.includes(category)) {
    return `category must be one of: ${CATEGORIES.join(', ')}`;
  }
  if (title.length > 180) return 'title too long';
  if (location.length > 180) return 'location too long';
  if (image_url && image_url.length > 500) return 'image_url too long';
  const cap = capacity != null ? Number(capacity) : 100;
  if (!Number.isInteger(cap) || cap < 1) return 'capacity must be a positive integer';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return 'event_date must be YYYY-MM-DD';
  return null;
}

// Admin: create
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const error = validateEventPayload(req.body);
    if (error) return res.status(400).json({ error });
    const { title, description, category, event_date, location, capacity, image_url } = req.body;
    const [result] = await pool.query(
      `INSERT INTO events (title, description, category, event_date, location, capacity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description.trim(), category, event_date, location.trim(), Number(capacity) || 100, image_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Admin: update
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const error = validateEventPayload(req.body);
    if (error) return res.status(400).json({ error });
    const { title, description, category, event_date, location, capacity, image_url } = req.body;
    const [result] = await pool.query(
      `UPDATE events
       SET title=?, description=?, category=?, event_date=?, location=?, capacity=?, image_url=?
       WHERE id=?`,
      [title.trim(), description.trim(), category, event_date, location.trim(), Number(capacity) || 100, image_url || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    res.json({ event: rows[0] });
  } catch (err) {
    next(err);
  }
});

// Admin: delete
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Event not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
