-- ══════════════════════════════════════════════
--  MediVisit — Crear base de datos y tablas
--  Ejecutar en psql o pgAdmin antes de iniciar
-- ══════════════════════════════════════════════

-- 1. Crear la base de datos (solo si no existe)
-- CREATE DATABASE medivisit;
-- \c medivisit

-- ── Tabla pacientes ───────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
  id               SERIAL        PRIMARY KEY,
  nombre           VARCHAR(150)  NOT NULL,
  documento        VARCHAR(20)   NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  genero           VARCHAR(20),
  sangre           VARCHAR(5),
  telefono         VARCHAR(30),
  email            VARCHAR(100),
  direccion        VARCHAR(200)  NOT NULL,
  habitacion       VARCHAR(10),
  cama             VARCHAR(5),
  alergias         TEXT,
  notas            TEXT,
  created_at       TIMESTAMP     DEFAULT NOW()
);

-- ── Tabla visitas ─────────────────────────────
CREATE TABLE IF NOT EXISTS visitas (
  id                  SERIAL        PRIMARY KEY,
  paciente_nombre     VARCHAR(150)  NOT NULL,
  nombre_visitante    VARCHAR(100)  NOT NULL,
  apellido_visitante  VARCHAR(100)  NOT NULL,
  dni                 VARCHAR(20)   NOT NULL,
  telefono            VARCHAR(30),
  domicilio           VARCHAR(200)  NOT NULL,
  parentesco          VARCHAR(50),
  fecha               DATE,
  hora_ingreso        TIME,
  hora_salida         TIME,
  tipo                VARCHAR(20)   DEFAULT 'Temporal',
  observaciones       TEXT,
  created_at          TIMESTAMP     DEFAULT NOW()
);

-- ── Datos de ejemplo ─────────────────────────
INSERT INTO pacientes (nombre, documento, fecha_nacimiento, genero, sangre, telefono, email, direccion, habitacion, cama)
VALUES
  ('Maria García López',      '17356098', '1975-03-12', 'Femenino',  'A+',  '+54 3873 215476', 'maria@email.com',   'Av. San Martín 123, Aguaray', '201', 'A'),
  ('Carlos Rodríguez Martín', '35754226', '1990-07-24', 'Masculino', 'O+',  '+54 3873 672210', 'carlos@email.com',  'Calle Belgrano 456, Aguaray', '202', 'B'),
  ('Ana Fernández Torres',    '40276998', '1995-11-05', 'Femenino',  'B-',  '+54 3873 568760', 'ana@email.com',     'Ruta 34 Km 12, Aguaray',     '203', 'A'),
  ('Pedro Sánchez Ruiz',      '45181112', '1998-02-18', 'Masculino', 'AB+', '+54 3873 567443', 'pedro@email.com',   'Av. Independencia 789',      '204', 'B'),
  ('Laura Díaz Moreno',       '56235114', '2001-09-30', 'Femenino',  'O-',  '+54 3873 216789', 'laura@email.com',   'Calle Rivadavia 22, Aguaray','205', 'A')
ON CONFLICT (documento) DO NOTHING;

INSERT INTO visitas (paciente_nombre, nombre_visitante, apellido_visitante, dni, telefono, domicilio, parentesco, fecha, tipo)
VALUES
  ('Maria García López',      'Juan',  'Pérez', '35123456', '+54 3873 111111', 'Av. San Martín 10, Aguaray', 'Hermano', '2026-06-23', 'Temporal'),
  ('Carlos Rodríguez Martín', 'Laura', 'Gómez', '40234567', '+54 3873 222222', 'Calle Paz 55, Aguaray',      'Madre',   '2026-06-24', 'Permanente');
