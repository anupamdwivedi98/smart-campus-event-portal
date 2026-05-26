const express = require('express');
const { pool } = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const PHONE_RE = /^[+\d][\d\s\-()]{6,20}$/;

// Register current user for an event
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { eventId, phone, notes } = req.body || {};
    const id = Number(eventId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Valid eventId is required' });
    }
    if (phone && !PHONE_RE.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (notes && notes.length > 1000) {
      return res.status(400).json({ error: 'Notes too long (max 1000 chars)' });
    }

    // Confirm event exists & capacity isn't exhausted (simple check — race-safe enough for lab scope).
    const [events] = await pool.query(
      `SELECT e.id, e.capacity,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status != 'cancelled') AS taken
       FROM events e WHERE e.id = ?`,
      [id]
    );
    if (events.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (events[0].taken >= events[0].capacity) {
      return res.status(409).json({ error: 'Event is full' });
    }

    try {
      const [result] = await pool.query(
        `INSERT INTO registrations (user_id, event_id, phone, notes, status)
         VALUES (?, ?, ?, ?, 'confirmed')`,
        [req.session.userId, id, phone || null, notes || null]
      );
      res.status(201).json({ registrationId: result.insertId });
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'You are already registered for this event' });
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
});

// My registrations
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.event_id, r.status, r.created_at,
              e.title, e.event_date, e.location, e.category
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.session.userId]
    );
    res.json({ registrations: rows });
  } catch (err) {
    next(err);
  }
});

// Cancel my registration
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const [result] = await pool.query(
      `DELETE FROM registrations WHERE id = ? AND user_id = ?`,
      [id, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Registration not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Admin: all registrations (for the dashboard — Experiment 5)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.status, r.phone, r.notes, r.created_at,
              u.id AS user_id, u.full_name, u.email, u.student_id, u.department,
              e.id AS event_id, e.title AS event_title, e.event_date, e.category
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       JOIN events e ON e.id = r.event_id
       ORDER BY r.created_at DESC`
    );
    res.json({ registrations: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
