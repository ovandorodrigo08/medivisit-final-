// src/db/pool.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.URL_NEON
    ? {
        connectionString: process.env.URL_NEON,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
      }
);

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