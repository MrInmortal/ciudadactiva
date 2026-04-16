const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
});

pool.connect()
    .then(client => {
        console.log('✅ Base de datos conectada correctamente');
        client.release();
    })
    .catch(err => {
        console.error('❌ Error de conexión DB:', err.message);
    });

module.exports = pool;