const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { fullName, email, password, studentId, department } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'fullName, email, password are required' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    if (fullName.length > 120) {
      return res.status(400).json({ error: 'Full name too long' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, student_id, department, role)
       VALUES (?, ?, ?, ?, ?, 'student')`,
      [fullName.trim(), email.toLowerCase().trim(), hash, studentId || null, department || null]
    );

    // Auto-login after signup
    req.session.userId = result.insertId;
    req.session.role = 'student';
    req.session.email = email.toLowerCase();

    res.status(201).json({
      user: {
        id: result.insertId,
        fullName,
        email: email.toLowerCase(),
        role: 'student',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    // Same error for missing user vs wrong password — avoids user-enumeration leaks.
    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.role = user.role;
      req.session.email = user.email;
      res.json({
        user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
      });
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (!req.session) return res.json({ ok: true });
  req.session.destroy(() => {
    res.clearCookie('iilm.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, student_id, department FROM users WHERE id = ?',
      [req.session.userId]
    );
    if (rows.length === 0) {
      return req.session.destroy(() => res.status(401).json({ error: 'Session invalid' }));
    }
    const u = rows[0];
    res.json({
      user: {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        studentId: u.student_id,
        department: u.department,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
