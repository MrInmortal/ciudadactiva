const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('Falta la variable DATABASE_URL en el entorno.');
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
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