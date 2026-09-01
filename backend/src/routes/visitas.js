// src/routes/visitas.js
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const PDFDocument = require('pdfkit');
const path = require('path');

// Helper: mapea fila DB → objeto frontend
function mapVisita(v) {
  return {
    id: v.id,
    paciente: v.paciente_nombre,
    nombreVisitante: v.nombre_visitante,
    apellidoVisitante: v.apellido_visitante,
    dni: v.dni,
    telefono: v.telefono,
    domicilio: v.domicilio,
    parentesco: v.parentesco,
    fecha: v.fecha ? v.fecha.toISOString().split('T')[0] : '',
    horaIngreso: v.hora_ingreso || '',
    horaSalida: v.hora_salida || '',
    tipo: v.tipo,
    observaciones: v.observaciones || '',
    foto: v.foto || '',
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
    console.error('GET /visitas/:id error:', err.message);
    res.status(500).json({ error: 'Error al obtener visita' });
  }
});

// POST /api/visitas — crear
router.post('/', async (req, res) => {
  const { paciente, nombreVisitante, apellidoVisitante, dni, telefono,
    domicilio, parentesco, fecha, horaIngreso, horaSalida, tipo, observaciones, foto } = req.body;

  console.log("Tipo recibido:", tipo);

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }

  try {
    // Evitar visitas duplicadas para el mismo paciente en la misma fecha
    const visitaExistente = await pool.query(
      `SELECT id
       FROM visitas
       WHERE paciente_nombre = $1
       AND fecha = $2
       LIMIT 1`,
      [paciente, fecha]
    );

    if (visitaExistente.rows.length > 0) {
      return res.status(400).json({
        error: `Este paciente ya tiene una visita registrada para esa fecha.`
      });
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

    // Validar máximo de 2 visitantes temporales
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
          error: "Máximo permitido: 2 visitantes temporales por paciente."
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO visitas
        (paciente_nombre, nombre_visitante, apellido_visitante, dni, telefono,
         domicilio, parentesco, fecha, hora_ingreso, hora_salida, tipo, observaciones, foto)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [paciente, nombreVisitante, apellidoVisitante, dni, telefono || null,
        domicilio, parentesco || null, fecha || null,
        horaIngreso || null, horaSalida || null,
        tipo || 'Temporal', observaciones || null, foto || null]
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
    domicilio, parentesco, fecha, horaIngreso, horaSalida, tipo, observaciones, foto } = req.body;

  if (!paciente || !nombreVisitante || !apellidoVisitante || !dni || !domicilio) {
    return res.status(400).json({ error: 'paciente, nombre, apellido, dni y domicilio son obligatorios' });
  }

  try {
    const result = await pool.query(
      `UPDATE visitas SET
        paciente_nombre=$1, nombre_visitante=$2, apellido_visitante=$3, dni=$4,
        telefono=$5, domicilio=$6, parentesco=$7, fecha=$8,
        hora_ingreso=$9, hora_salida=$10, tipo=$11, observaciones=$12, foto=$13
       WHERE id=$14
       RETURNING *`,
      [paciente, nombreVisitante, apellidoVisitante, dni, telefono || null,
        domicilio, parentesco || null, fecha || null,
        horaIngreso || null, horaSalida || null,
        tipo || 'Temporal', observaciones || null, foto || null, req.params.id]
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
function getLunes(dateStr) {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const dia = date.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(date);
  lunes.setDate(date.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function getDomingo(lunes) {
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return domingo;
}

// GET /api/visitas/informe-semanal
router.get('/informe-semanal', async (req, res) => {
  try {
    const lunes = getLunes(req.query.inicio);
    const domingo = getDomingo(lunes);

    const result = await pool.query(
      `SELECT * FROM visitas WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha ASC, hora_ingreso ASC`,
      [lunes.toISOString().split('T')[0], domingo.toISOString().split('T')[0]]
    );

    const visitas = result.rows.map(mapVisita);
    const pacientesUnicos = new Set(visitas.map(v => v.paciente)).size;

    res.json({
      fechaInicio: lunes.toISOString().split('T')[0],
      fechaFin: domingo.toISOString().split('T')[0],
      totalVisitas: visitas.length,
      pacientesUnicos,
      visitas,
    });
  } catch (err) {
    console.error('GET /visitas/informe-semanal error:', err.message);
    res.status(500).json({ error: 'Error al generar informe semanal' });
  }
});

// GET /api/visitas/informe-semanal/pdf
router.get('/informe-semanal/pdf', async (req, res) => {
  try {
    const lunes = getLunes(req.query.inicio);
    const domingo = getDomingo(lunes);

    const result = await pool.query(
      `SELECT * FROM visitas WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha ASC, hora_ingreso ASC`,
      [lunes.toISOString().split('T')[0], domingo.toISOString().split('T')[0]]
    );
    const visitas = result.rows.map(mapVisita);
    const pacientesUnicos = new Set(visitas.map(v => v.paciente)).size;

    const formatFecha = (iso) => {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=informe-semanal-${lunes.toISOString().split('T')[0]}.pdf`
    );
    doc.pipe(res);

    const logoPath = path.join(__dirname, '../assets/logo.jpeg');
    try {
      doc.image(logoPath, 40, 35, { width: 55 });
    } catch (e) {
      console.warn('No se pudo cargar el logo:', e.message);
    }

    doc.fontSize(14).fillColor('#0c447c').text('Hospital Luis A. Güemes', 105, 40);
    doc.fontSize(10).fillColor('#4a4a4a').text('MediVisit - Informe semanal de visitas', 105, 58);
    doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#185fa5').lineWidth(2).stroke();

    doc.fontSize(10).fillColor('#4a4a4a')
      .text(`Semana: ${formatFecha(lunes.toISOString().split('T')[0])} - ${formatFecha(domingo.toISOString().split('T')[0])}`, 40, 112)
      .text(`Generado: ${formatFecha(new Date().toISOString().split('T')[0])}`, 400, 112);

    doc.fontSize(11).fillColor('#0c447c')
      .text(`Visitas totales: ${visitas.length}`, 40, 135)
      .text(`Pacientes distintos: ${pacientesUnicos}`, 250, 135);

    let y = 165;
    const col = { paciente: 40, visitante: 190, fecha: 340, ingreso: 420, tipo: 490 };

    doc.rect(40, y, 515, 20).fill('#185fa5');
    doc.fontSize(10).fillColor('#ffffff')
      .text('Paciente', col.paciente + 5, y + 5)
      .text('Visitante', col.visitante + 5, y + 5)
      .text('Fecha', col.fecha + 5, y + 5)
      .text('Ingreso', col.ingreso + 5, y + 5)
      .text('Tipo', col.tipo + 5, y + 5);
    y += 20;

    visitas.forEach((v, i) => {
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
      if (i % 2 === 0) doc.rect(40, y, 515, 20).fill('#f7f7f7');
      doc.fillColor('#1a1a1a').fontSize(9)
        .text(v.paciente, col.paciente + 5, y + 6, { width: 145 })
        .text(`${v.nombreVisitante} ${v.apellidoVisitante}`, col.visitante + 5, y + 6, { width: 145 })
        .text(formatFecha(v.fecha), col.fecha + 5, y + 6, { width: 75 })
        .text(v.horaIngreso || '-', col.ingreso + 5, y + 6, { width: 65 })
        .text(v.tipo, col.tipo + 5, y + 6, { width: 60 });
      y += 20;
    });

    if (visitas.length === 0) {
      doc.fontSize(10).fillColor('#6b6b6b').text('Sin visitas registradas esta semana.', 40, y + 10);
    }

    doc.fontSize(8).fillColor('#9a9a9a')
      .text('Documento generado automáticamente por MediVisit', 40, 800, { align: 'center', width: 515 });

    doc.end();
  } catch (err) {
    console.error('GET /visitas/informe-semanal/pdf error:', err.message);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});
module.exports = router;