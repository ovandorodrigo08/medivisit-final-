// src/db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || process.env.PGHOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || process.env.PGPORT) || 5432,
  database: process.env.DB_NAME     || process.env.PGDATABASE || 'medivisit',
  user:     process.env.DB_USER     || process.env.PGUSER     || 'postgres',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.error('   Verificá que el archivo .env tenga los datos correctos.');
  } else {
    console.log('✅ Conectado a PostgreSQL correctamente');
    release();
  }
});

module.exports = pool;
