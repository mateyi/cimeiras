// src/controllers/userController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');
const { sendWelcomeEmail } = require('../services/emailService');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash]
    );

    const user  = rows[0];
    const token = generateToken(user.id);

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail(email, name, user.id);
    } catch (emailErr) {
      console.error('[register] Error enviando email:', emailErr.message);
    }

    res.cookie('cimeiras_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ user, token });

  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user.id);

    res.cookie('cimeiras_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash: _omit, ...safeUser } = user;
    return res.json({ user: safeUser, token });

  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[getMe]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, login, getMe };