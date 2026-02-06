import pool from '../config/database.js';

class Payment {

  //  CREATE 
  static async create(paymentData) {
    const {
      id,
      rental_id,
      user_id,
      amount,
      payment_method,
      payment_type,
      gateway_status = null,
      gateway_response = null
    } = paymentData;

    const [result] = await pool.execute(
      `INSERT INTO payments (
        id,
        rental_id,
        user_id,
        amount,
        payment_method,
        payment_type,
        gateway_status,
        gateway_response,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'success')`,
      [
        id,
        (rental_id),
        (user_id),
        (amount),
        payment_method,
        payment_type,
        gateway_status,
        gateway_response ? JSON.stringify(gateway_response) : null
      ]
    );

    return result.insertId;
  }

  // FIND BY ID 
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT 
         p.*, 
         r.id AS rental_id,
         r.total_amount_paid
       FROM payments p
       LEFT JOIN rentals r ON p.rental_id = r.id
       WHERE p.id = ?`,
      [id]
    );

    return rows[0];
  }

  // UPDATE STATUS 
  static async updateStatus(id, status, gatewayStatus = null) {
    const [result] = await pool.execute(
      `UPDATE payments
       SET status = ?,
           gateway_status = ?,
           paid_at = IF(? = 'success', CURRENT_TIMESTAMP, paid_at),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, gatewayStatus, status, id]
    );

    return result.affectedRows > 0;
  }

  //  FIND BY RENTAL 
  static async findByRentalId(rental_id) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM payments
       WHERE rental_id = ?
       ORDER BY created_at DESC`,
      [Number(rental_id)]
    );

    return rows;
  }

  //  STATS 
  static async getStats() {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_payments,
        SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS total_received,
        SUM(
          CASE 
            WHEN status = 'success' AND payment_type = 'refund'
            THEN ABS(amount)
            ELSE 0
          END
        ) AS total_refunded,
        payment_method,
        DATE(created_at) AS date
      FROM payments
      GROUP BY payment_method, DATE(created_at)
      ORDER BY date DESC
    `);

    return rows;
  }
}

export default Payment;
