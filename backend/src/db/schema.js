const pool = require('./pool');

const setupDatabase = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS pacientes (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      documento VARCHAR(20) NOT NULL UNIQUE,
      fecha_nacimiento DATE,
      genero VARCHAR(20),
      sangre VARCHAR(5),
      telefono VARCHAR(30) UNIQUE,
      email VARCHAR(100) UNIQUE,
      direccion VARCHAR(200) NOT NULL,
      habitacion VARCHAR(10),
      cama VARCHAR(5),
      alergias TEXT,
      notas TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS visitas (
      id SERIAL PRIMARY KEY,
      paciente_nombre VARCHAR(150) NOT NULL,
      nombre_visitante VARCHAR(100) NOT NULL,
      apellido_visitante VARCHAR(100) NOT NULL,
      dni VARCHAR(20) NOT NULL,
      telefono VARCHAR(30) UNIQUE,
      domicilio VARCHAR(200) NOT NULL,
      parentesco VARCHAR(50),
      fecha DATE,
      hora_ingreso TIME,
      hora_salida TIME,
      tipo VARCHAR(20) DEFAULT 'Temporal',
      observaciones TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Tablas verificadas/creadas correctamente');
  } catch (err) {
    console.error('❌ Error al crear las tablas:', err.message);
  }
};

module.exports = setupDatabase;