const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL no está definida en Render');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

pool.connect()
    .then(client => {
        console.log('✅ Base de datos conectada correctamente');
        client.release();
    })
    .catch(err => {
        console.error('❌ Error de conexión DB:', err.message);
        process.exit(1);
    });

module.exports = pool;