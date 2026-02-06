import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'outfit-rental',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

try {
  const connection = await pool.getConnection();
  console.log(' Kết nối database thành công!');
  connection.release();
} catch (err) {
  console.error(' Lỗi kết nối database:', err);
}

export default pool;