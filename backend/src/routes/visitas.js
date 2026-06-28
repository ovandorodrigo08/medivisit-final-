// src/routes/visitas.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');

// Helper: mapea fila DB → objeto frontend
function mapVisita(v) {
  return {
    id:                 v.id,
    paciente:           v.paciente_nombre,
    nombreVisitante:    v.nombre_visitante,
    apellidoVisitante:  v.apellido_visitante,
    dni:                v.dni,
    telefono:           v.telefono,
    domicilio:          v.domicilio,
    parentesco:         v.parentesco,
    fecha:              v.fecha ? v.fecha.toISOString().split('T')[0] : '',
    horaIngreso:        v.hora_ingreso  || '',
    horaSalida:         v.hora_salida   || '',
    tipo:               v.tipo,
    observaciones:      v.observaciones || '',
  };
}

// GET /api/visitas — listar todas
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitas ORDER BY created_at DESC');
    res.json(result.rows.map(mapVisita));
  } catch (err) {
    console.error('GET /visitas error:', err.message);
    res.status(500).json({ error: 'Error al obtener visitas' });
  }
});

// GET /api/visitas/:id — obtener una
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitas WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json(mapVisita(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener visita' });
  }
});

// POST /api/visitas — crear
router.post('/', async (req, res) => {
  const { paciente, nombreVisitante, apellidoVisitante, dni, telefono,
          domicilio, parentesco, fecha, horaIngreso, horaSalida, tipo, observaciones } = req.body;
          
console.log("Tipo recibido:", tipo);

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }
  // Validar máximo de 2 visitantes permanentes
if (tipo === "Permanente") {
    const resultado = await pool.query(
        `SELECT COUNT(*) AS total
         FROM visitas
         WHERE paciente_nombre = $1
         AND tipo = 'Permanente'`,
        [paciente]
    );

    if (parseInt(resultado.rows[0].total) >= 2) {
        return res.status(400).json({
            error: "Máximo permitido: 2 visitantes por paciente."
        });
    }
}
//validar maximo de 2 visitantes temporales
if (tipo === "Temporal") {
  const resultado = await pool.query(
     `SELECT COUNT(*) AS total
     FROM visitas
     WHERE paciente_nombre = $1
     AND tipo = 'Temporal'`,
     [paciente]
  );
  if (parseInt(resultado.rows[0].total) >= 2) {
    return res.status(400).json({
      error: "Maximo permitido: 2 visitantes temporales por pacientes."
    });
  }
}

  try {
    const result = await pool.query(
      `INSERT INTO visitas
        (paciente_nombre, nombre_visitante, apellido_visitante, dni, telefono,
         domicilio, parentesco, fecha, hora_ingreso, hora_salida, tipo, observaciones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [paciente, nombreVisitante, apellidoVisitante, dni, telefono || null,
       domicilio, parentesco || null, fecha || null,
       horaIngreso || null, horaSalida || null,
       tipo || 'Temporal', observaciones || null]
    );
    res.status(201).json(mapVisita(result.rows[0]));
  } catch (err) {
    console.error('POST /visitas error:', err.message);
    res.status(500).json({ error: 'Error al crear visita' });
  }
});

// PUT /api/visitas/:id — actualizar
router.put('/:id', async (req, res) => {
  const { paciente, nombreVisitante, apellidoVisitante, dni, telefono,
          domicilio, parentesco, fecha, horaIngreso, horaSalida, tipo, observaciones } = req.body;

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE visitas SET
        paciente_nombre=$1, nombre_visitante=$2, apellido_visitante=$3, dni=$4,
        telefono=$5, domicilio=$6, parentesco=$7, fecha=$8,
        hora_ingreso=$9, hora_salida=$10, tipo=$11, observaciones=$12
       WHERE id=$13
       RETURNING *`,
      [paciente, nombreVisitante, apellidoVisitante, dni, telefono || null,
       domicilio, parentesco || null, fecha || null,
       horaIngreso || null, horaSalida || null,
       tipo || 'Temporal', observaciones || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json({ mensaje: 'Visita actualizada', id: req.params.id });
  } catch (err) {
    console.error('PUT /visitas error:', err.message);
    res.status(500).json({ error: 'Error al actualizar visita' });
  }
});

// DELETE /api/visitas/:id — eliminar
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM visitas WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Visita no encontrada' });
    res.json({ mensaje: 'Visita eliminada', id: req.params.id });
  } catch (err) {
    console.error('DELETE /visitas error:', err.message);
    res.status(500).json({ error: 'Error al eliminar visita' });
  }
});

module.exports = router;
