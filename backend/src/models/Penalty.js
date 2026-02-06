import pool from '../config/database.js';

class Penalty {

  // 
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT *
       FROM penalty_config
       WHERE status = 'active'
       ORDER BY penalty_type, id`
    );
    return rows;
  }

  
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM penalty_config
       WHERE id = ?`,
      [id] // 
    );
    return rows[0];
  }

  
  static async findByType(penaltyType) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM penalty_config
       WHERE penalty_type = ?
         AND status = 'active'`,
      [penaltyType]
    );
    return rows;
  }

  
  static async create(penaltyData) {
    const {
      penalty_type,
      name,
      description,
      calculation_type,
      value,
      reference_field,
      min_amount = 0,
      max_amount = null
    } = penaltyData;

    const [result] = await pool.execute(
      `INSERT INTO penalty_config (
        penalty_type,
        name,
        description,
        calculation_type,
        value,
        reference_field,
        min_amount,
        max_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        penalty_type,
        name,
        description,
        calculation_type,
        Number(value),
        reference_field,
        Number(min_amount),
        max_amount !== null ? Number(max_amount) : null
      ]
    );

    return result.insertId;
  }

  // UPDATE 
  static async update(id, penaltyData) {
    const fields = [];
    const params = [];

    Object.entries(penaltyData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(
          ['value', 'min_amount', 'max_amount'].includes(key)
            ? (value !== null ? Number(value) : null)
            : value
        );
      }
    });

    if (!fields.length) return false;

    params.push(id); // 

    const [result] = await pool.execute(
      `UPDATE penalty_config
       SET ${fields.join(', ')},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  //  DELETE (SOFT) 
  static async delete(id) {
    const [result] = await pool.execute(
      `UPDATE penalty_config
       SET status = 'inactive',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id] //
    );
    return result.affectedRows > 0;
  }

  // ================= CALCULATE LATE FEE =================
  static async calculateLateFee(rentalDays, dailyPrice, overdueDays) {
    rentalDays = Number(rentalDays);
    dailyPrice = Number(dailyPrice);
    overdueDays = Number(overdueDays);

    if (overdueDays <= 0) return 0;

    const penalties = await this.findByType('late');
    let totalLateFee = 0;

    for (const penalty of penalties) {
      let fee = 0;

      switch (penalty.calculation_type) {
        case 'fixed':
        case 'daily_rate':
          fee = Number(penalty.value) * overdueDays;
          break;

        case 'percentage':
          fee = rentalDays * dailyPrice * Number(penalty.value) / 100;
          break;
      }

      if (penalty.min_amount !== null && fee < penalty.min_amount) {
        fee = penalty.min_amount;
      }
      if (penalty.max_amount !== null && fee > penalty.max_amount) {
        fee = penalty.max_amount;
      }

      totalLateFee += fee;
    }

    return totalLateFee;
  }

  // ================= CALCULATE DAMAGE FEE =================
  static async calculateDamageFee(damageType, originalValue) {
    originalValue = Number(originalValue);
    if (originalValue <= 0) return 0;

    const penalties = await this.findByType(`damage_${damageType}`);
    let damageFee = 0;

    for (const penalty of penalties) {
      let fee = 0;

      switch (penalty.calculation_type) {
        case 'fixed':
          fee = Number(penalty.value);
          break;

        case 'percentage':
          fee = originalValue * Number(penalty.value) / 100;
          break;

        case 'by_value':
          fee = originalValue * Number(penalty.value);
          break;
      }

      if (penalty.min_amount !== null && fee < penalty.min_amount) {
        fee = penalty.min_amount;
      }
      if (penalty.max_amount !== null && fee > penalty.max_amount) {
        fee = penalty.max_amount;
      }

      damageFee += fee;
    }

    return damageFee;
  }

  // ================= CALCULATE LOST FEE =================
  static async calculateLostFee(originalValue) {
    originalValue = Number(originalValue);
    if (originalValue <= 0) return 0;

    const penalties = await this.findByType('lost');
    let lostFee = originalValue;

    for (const penalty of penalties) {
      switch (penalty.calculation_type) {
        case 'percentage':
          lostFee = originalValue * Number(penalty.value) / 100;
          break;

        case 'fixed':
          lostFee = Number(penalty.value);
          break;
      }

      if (penalty.min_amount !== null && lostFee < penalty.min_amount) {
        lostFee = penalty.min_amount;
      }
      if (penalty.max_amount !== null && lostFee > penalty.max_amount) {
        lostFee = penalty.max_amount;
      }
    }

    return lostFee;
  }
}

export default Penalty;
