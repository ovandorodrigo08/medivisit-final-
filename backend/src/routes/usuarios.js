// src/routes/usuarios.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/usuarios/sync — crea o actualiza el usuario según su firebase_uid
router.post('/sync', async (req, res) => {
  const { firebaseUid, nombre, email } = req.body;

  if (!firebaseUid || !email) {
    return res.status(400).json({ error: 'firebaseUid y email son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO usuarios (firebase_uid, nombre, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (firebase_uid)
       DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email
       RETURNING *`,
      [firebaseUid, nombre || null, email]
    );
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('POST /usuarios/sync error:', err.message);
    res.status(500).json({ error: 'Error al guardar usuario' });
  }
});

// GET /api/usuarios — listar todos (útil para ver la tabla desde el panel más adelante, si querés)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, email, fecha_registro FROM usuarios ORDER BY fecha_registro DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('GET /usuarios error:', err.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;