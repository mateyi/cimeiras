// src/controllers/userController.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../config/db');
const { sendVerificationEmail } = require('../services/emailService');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ════════════════════════════════════════════════════════════
//  POST /api/users/register
// ════════════════════════════════════════════════════════════
const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const password_hash      = await bcrypt.hash(password, 12);
    const verification_token = crypto.randomBytes(32).toString('hex');
    const token_expires_at   = new Date(Date.now() + 60 * 60 * 1000);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, is_verified, verification_token, token_expires_at)
       VALUES ($1, $2, $3, FALSE, $4, $5)
       RETURNING id, name, email, is_verified, created_at`,
      [name, email, password_hash, verification_token, token_expires_at]
    );

    const user = rows[0];

    try {
      await sendVerificationEmail(email, name, verification_token);
    } catch (emailErr) {
      console.error('[register] Error enviando email:', emailErr.message);
    }

    return res.status(201).json({
      message: 'Cuenta creada. Revisá tu email para verificar tu cuenta.',
      user,
      needsVerification: true,
    });

  } catch (err) {
    console.error('[register]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ════════════════════════════════════════════════════════════
//  POST /api/users/login
// ════════════════════════════════════════════════════════════
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

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Debés verificar tu email antes de ingresar.',
        needsVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user.id);
    res.cookie('cimeiras_token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    const { password_hash: _omit, verification_token: _t, ...safeUser } = user;
    return res.json({ user: safeUser, token });

  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ════════════════════════════════════════════════════════════
//  GET /api/users/verify-email?token=xxx
// ════════════════════════════════════════════════════════════
const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token requerido' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE verification_token = $1', [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'La cuenta ya fue verificada' });
    }

    if (new Date() > new Date(user.token_expires_at)) {
      return res.status(400).json({
        error: 'El token expiró. Solicitá uno nuevo.',
        expired: true,
        email: user.email,
      });
    }

    await db.query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    return res.json({ message: '¡Cuenta verificada! Ya podés iniciar sesión.' });

  } catch (err) {
    console.error('[verifyEmail]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ════════════════════════════════════════════════════════════
//  POST /api/users/resend-verification
// ════════════════════════════════════════════════════════════
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (rows.length === 0) {
      return res.json({ message: 'Si el email existe, recibirás un nuevo enlace.' });
    }

    const user = rows[0];
    if (user.is_verified) {
      return res.status(400).json({ error: 'Esta cuenta ya está verificada' });
    }

    const verification_token = crypto.randomBytes(32).toString('hex');
    const token_expires_at   = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `UPDATE users SET verification_token = $1, token_expires_at = $2 WHERE id = $3`,
      [verification_token, token_expires_at, user.id]
    );

    await sendVerificationEmail(user.email, user.name, verification_token);
    return res.json({ message: 'Email de verificación reenviado.' });

  } catch (err) {
    console.error('[resendVerification]', err.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ════════════════════════════════════════════════════════════
//  GET /api/users/me
// ════════════════════════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1`,
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

module.exports = { register, login, getMe, verifyEmail, resendVerification };