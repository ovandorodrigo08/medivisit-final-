// src/routes/pacientes.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// GET /api/pacientes — listar todos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pacientes ORDER BY created_at DESC'
    );
    // Mapear columnas snake_case → camelCase para el frontend
    const pacientes = result.rows.map(p => ({
      id:               p.id,
      nombre:           p.nombre,
      documento:        p.documento,
      fechaNacimiento:  p.fecha_nacimiento ? p.fecha_nacimiento.toISOString().split('T')[0] : '',
      genero:           p.genero,
      sangre:           p.sangre,
      telefono:         p.telefono,
      email:            p.email,
      direccion:        p.direccion,
      habitacion:       p.habitacion,
      cama:             p.cama,
      alergias:         p.alergias,
      notas:            p.notas,
    }));
    res.json(pacientes);
  } catch (err) {
    console.error('GET /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// GET /api/pacientes/:id — obtener uno
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacientes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    const p = result.rows[0];
    res.json({
      id:               p.id,
      nombre:           p.nombre,
      documento:        p.documento,
      fechaNacimiento:  p.fecha_nacimiento ? p.fecha_nacimiento.toISOString().split('T')[0] : '',
      genero:           p.genero,
      sangre:           p.sangre,
      telefono:         p.telefono,
      email:            p.email,
      direccion:        p.direccion,
      habitacion:       p.habitacion,
      cama:             p.cama,
      alergias:         p.alergias,
      notas:            p.notas,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// POST /api/pacientes — crear
router.post('/', async (req, res) => {
  const { nombre, documento, fechaNacimiento, genero, sangre,
          telefono, email, direccion, habitacion, cama, alergias, notas } = req.body;

  if (!nombre || !documento || !direccion) {
    return res.status(400).json({ error: 'nombre, documento y direccion son obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pacientes
        (nombre, documento, fecha_nacimiento, genero, sangre, telefono, email, direccion, habitacion, cama, alergias, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [nombre, documento, fechaNacimiento || null, genero, sangre,
       telefono, email, direccion, habitacion, cama, alergias, notas]
    );
    const p = result.rows[0];
    res.status(201).json({
      id: p.id, nombre: p.nombre, documento: p.documento,
      fechaNacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.toISOString().split('T')[0] : '',
      genero: p.genero, sangre: p.sangre, telefono: p.telefono,
      email: p.email, direccion: p.direccion, habitacion: p.habitacion,
      cama: p.cama, alergias: p.alergias, notas: p.notas,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ya existe un paciente con ese documento' });
    }
    console.error('POST /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// PUT /api/pacientes/:id — actualizar
router.put('/:id', async (req, res) => {
  const { nombre, documento, fechaNacimiento, genero, sangre,
          telefono, email, direccion, habitacion, cama, alergias, notas } = req.body;

  if (!nombre || !documento || !direccion) {
    return res.status(400).json({ error: 'nombre, documento y direccion son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE pacientes SET
        nombre=$1, documento=$2, fecha_nacimiento=$3, genero=$4, sangre=$5,
        telefono=$6, email=$7, direccion=$8, habitacion=$9, cama=$10,
        alergias=$11, notas=$12
       WHERE id=$13
       RETURNING *`,
      [nombre, documento, fechaNacimiento || null, genero, sangre,
       telefono, email, direccion, habitacion, cama, alergias, notas, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente actualizado', id: req.params.id });
  } catch (err) {
    console.error('PUT /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

// DELETE /api/pacientes/:id — eliminar
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pacientes WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente eliminado', id: req.params.id });
  } catch (err) {
    console.error('DELETE /pacientes error:', err.message);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
});

module.exports = router;
