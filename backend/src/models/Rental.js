import pool from '../config/database.js';

class Rental {
  //  CREATE 
  static async create(rentalData) {
    const {
      id,
      user_id,
      total_items,
      rental_days,
      start_date,
      due_date,
      total_rental_fee,
      total_deposit,
      total_amount_paid
    } = rentalData;

    const [result] = await pool.execute(
      `INSERT INTO rentals (
        id, user_id, total_items, rental_days, start_date, due_date,
        total_rental_fee, total_deposit, total_amount_paid,
        payment_status, rental_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
      [
        id, // ✅ STRING
        Number(user_id),
        Number(total_items),
        Number(rental_days),
        start_date,
        due_date,
        Number(total_rental_fee),
        Number(total_deposit),
        Number(total_amount_paid)
      ]
    );

    return result.insertId;
  }

  //  FIND BY ID 
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.*, 
        u.email, u.full_name, u.phone, u.address,
        GROUP_CONCAT(DISTINCT ri.costume_id) AS costume_ids
       FROM rentals r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN rental_items ri ON r.id = ri.rental_id
       WHERE r.id = ?
       GROUP BY r.id`,
      [id] 
    );

    return rows[0];
  }

  //  FIND BY USER 
  static async findByUserId(userId, page = 1, limit = 10) {
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT r.*, COUNT(ri.id) AS item_count
       FROM rentals r
       LEFT JOIN rental_items ri ON r.id = ri.rental_id
       WHERE r.user_id = ?
       GROUP BY r.id
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(userId), limit, offset]
    );

    const [countRows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM rentals WHERE user_id = ?',
      [Number(userId)]
    );

    return {
      rentals: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        pages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  //  FIND ALL (ADMIN) 
  static async findAll(filters = {}, page = 1, limit = 20) {
    page = Number(page);
    limit = Number(limit);
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, 
        u.email, u.full_name, u.phone,
        COUNT(ri.id) AS item_count
      FROM rentals r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rental_items ri ON r.id = ri.rental_id
      WHERE 1=1
    `;

    const params = [];

    if (filters.status) {
      query += ' AND r.rental_status = ?';
      params.push(filters.status);
    }

    if (filters.payment_status) {
      query += ' AND r.payment_status = ?';
      params.push(filters.payment_status);
    }

    if (filters.search) {
      query += ' AND (r.id LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }

    query += ' GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM rentals r
       LEFT JOIN users u ON r.user_id = u.id`,
      []
    );

    return {
      rentals: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        pages: Math.ceil(countRows[0].total / limit)
      }
    };
  }

  
  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      `UPDATE rentals 
       SET rental_status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, id] 
    );
    return result.affectedRows > 0;
  }

  
  static async updatePaymentStatus(id, paymentStatus, paidAt = null) {
    const [result] = await pool.execute(
      `UPDATE rentals 
       SET payment_status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [paymentStatus, paidAt, id] 
    );
    return result.affectedRows > 0;
  }

  
  static async addPenalty(id, penaltyData) {
    const late_fee = Number(penaltyData.late_fee || 0);
    const damage_fee = Number(penaltyData.damage_fee || 0);
    const other_fees = Number(penaltyData.other_fees || 0);

    const total_fine = late_fee + damage_fee + other_fees;

    const [result] = await pool.execute(
      `UPDATE rentals 
       SET late_fee = ?, damage_fee = ?, other_fees = ?, total_fine = ?,
           total_amount_paid = total_amount_paid + ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        late_fee,
        damage_fee,
        other_fees,
        total_fine,
        total_fine,
        id 
      ]
    );

    return result.affectedRows > 0;
  }

  
  static async completeReturn(id, returnDate, depositRefund, additionalCharge) {
    const [result] = await pool.execute(
      `UPDATE rentals 
       SET return_date = ?, deposit_refund = ?, additional_charge = ?,
           rental_status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        returnDate,
        Number(depositRefund),
        Number(additionalCharge),
        id 
      ]
    );

    return result.affectedRows > 0;
  }

  
  static async getRentalWithItems(rentalId) {
    const [rows] = await pool.execute(
      `SELECT r.*, 
        u.email, u.full_name, u.phone, u.address,
        ri.*,
        c.name AS costume_name, c.brand, c.size, c.color
       FROM rentals r
       JOIN users u ON r.user_id = u.id
       JOIN rental_items ri ON r.id = ri.rental_id
       JOIN costumes c ON ri.costume_id = c.id
       WHERE r.id = ?`,
      [rentalId] 
    );

    return rows;
  }

  
  static async getStats() {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_rentals,
        SUM(total_amount_paid) AS total_revenue,
        SUM(total_deposit) AS total_deposit,
        SUM(total_fine) AS total_fines,
        AVG(rental_days) AS avg_rental_days,
        COUNT(CASE WHEN rental_status = 'renting' THEN 1 END) AS active_rentals,
        COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) AS overdue_rentals
      FROM rentals
    `);

    return rows[0];
  }
}

export default Rental;
