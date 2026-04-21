const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.promise().getConnection();
    console.log('Connexion MySQL établie avec succès');
    connection.release();
  } catch (error) {
    console.error('Erreur de connexion MySQL :', error.message);
  }
})();

module.exports = pool.promise();
