const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    timezone: '+05:30'
});

(async () => {
    try {
        const [rows] = await pool.execute('SELECT 1 as test');
        console.log('Connected to MySQL database');
    } catch (err) {
        console.error('DB Connection failed:', err);
    }
})();

module.exports = pool;