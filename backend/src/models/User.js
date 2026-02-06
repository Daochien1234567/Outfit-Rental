import pool from '../config/database.js';

class User {
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, phone, address, role, status, total_rentals, total_spent, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  }

  static async create(userData) {
    const { email, password_hash, full_name, phone, address, role = 'customer' } = userData;
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, full_name, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, full_name, phone, address, role]
    );
    return result.insertId;
  }

  static async update(id, userData) {
    const { full_name, phone, address } = userData;
    const [result] = await pool.execute(
      'UPDATE users SET full_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [full_name, phone, address, id]
    );
    return result.affectedRows > 0;
  }

  static async updatePassword(id, password_hash) {
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [password_hash, id]
    );
    return result.affectedRows > 0;
  }

  static async updateStats(userId, rentalCount = 0, spentAmount = 0) {
    const [result] = await pool.execute(
      'UPDATE users SET total_rentals = total_rentals + ?, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [rentalCount, spentAmount, userId]
    );
    return result.affectedRows > 0;
  }

  static async findAll(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, email, full_name, phone, address, role, status, total_rentals, total_spent, created_at FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.search) {
      query += ' AND (email LIKE ? OR full_name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    // Lấy tổng số bản ghi
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const total = countRows[0].total;

    return {
      users: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  }
}

export default User;