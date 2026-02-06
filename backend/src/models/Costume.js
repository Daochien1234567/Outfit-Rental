import pool from '../config/database.js';

class Costume {

  //  GET ALL 
  static async findAll(filters = {}, page = 1, limit = 20) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;

    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, cat.name AS category_name, cat.parent_id AS category_parent_id
      FROM costumes c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.status != 'deleted'
    `;
    const params = [];

    if (filters.category_id) {
      query += ' AND c.category_id = ?';
      params.push(Number(filters.category_id));
    }

    if (filters.status) {
      query += ' AND c.status = ?';
      params.push(filters.status);
    }

    if (filters.available_only) {
      query += ' AND c.available_quantity > 0';
    }

    if (filters.min_price) {
      query += ' AND c.daily_price >= ?';
      params.push(Number(filters.min_price));
    }

    if (filters.max_price) {
      query += ' AND c.daily_price <= ?';
      params.push(Number(filters.max_price));
    }

    if (filters.sizes && Array.isArray(filters.sizes) && filters.sizes.length > 0) {
      query += ` AND c.size IN (${filters.sizes.map(() => '?').join(',')})`;
      params.push(...filters.sizes);
    }

    if (filters.search) {
      query += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.brand LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }

    const sortMap = {
      newest: 'c.created_at DESC',
      price_asc: 'c.daily_price ASC',
      price_desc: 'c.daily_price DESC',
      popular: 'c.rental_count DESC',
      name_asc: 'c.name ASC'
    };

    query += ` ORDER BY ${sortMap[filters.sort_by] || 'c.created_at DESC'}`;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    
    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM costumes WHERE status != 'deleted'`
    );

    const total = Number(countRows[0].total);

    return {
      costumes: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // ================= FIND BY ID =================
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT c.*, cat.name AS category_name, cat.parent_id AS category_parent_id
       FROM costumes c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = ? AND c.status != 'deleted'`,
      [Number(id)]
    );
    return rows[0];
  }

  // CREATE 
  static async create(costumeData) {
    const {
      name, description, category_id, brand, size, color, material,
      daily_price, deposit_amount, original_value, quantity,
      item_condition = 'good', images = null
    } = costumeData;

    const [result] = await pool.execute(
      `INSERT INTO costumes (
        name, description, category_id, brand, size, color, material,
        daily_price, deposit_amount, original_value, quantity,
        available_quantity, item_condition, images, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        Number(category_id),
        brand,
        size,
        color,
        material,
        Number(daily_price),
        Number(deposit_amount),
        Number(original_value),
        Number(quantity),
        Number(quantity),
        item_condition,
        images ? JSON.stringify(images) : null,
        'available'
      ]
    );

    return result.insertId;
  }

  //  UPDATE 
  static async update(id, costumeData) {
    const fields = [];
    const params = [];

    Object.entries(costumeData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (!fields.length) return false;

    params.push(Number(id));

    const [result] = await pool.execute(
      `UPDATE costumes
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  // AVAILABILITY 
  static async updateAvailability(id, quantityChange) {
    quantityChange = Number(quantityChange);

    const [result] = await pool.execute(
      `UPDATE costumes
       SET available_quantity = available_quantity + ?, rental_count = rental_count + 1
       WHERE id = ? AND available_quantity + ? >= 0`,
      [quantityChange, Number(id), quantityChange]
    );

    return result.affectedRows > 0;
  }

  // DELETE 
  static async delete(id) {
    const [result] = await pool.execute(
      `UPDATE costumes
       SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [Number(id)]
    );
    return result.affectedRows > 0;
  }

  // RELATED 
  static async findRelated(costumeId, categoryId, limit = 4) {
    limit = Number(limit);
    if (!Number.isInteger(limit) || limit < 1) limit = 4;

    
    const [rows] = await pool.query(
      `SELECT *
       FROM costumes
       WHERE category_id = ? AND id != ? AND status = 'available'
       ORDER BY rental_count DESC
       LIMIT ?`,
      [Number(categoryId), Number(costumeId), limit]
    );

    return rows;
  }

  //  SEARCH
  static async search(keyword, page = 1, limit = 20) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;

    const offset = (page - 1) * limit;
    const searchTerm = `%${keyword}%`;

    
    const [rows] = await pool.query(
      `SELECT *
       FROM costumes
       WHERE (name LIKE ? OR description LIKE ? OR brand LIKE ?)
       AND status = 'available'
       ORDER BY rental_count DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM costumes
       WHERE (name LIKE ? OR description LIKE ? OR brand LIKE ?)
       AND status = 'available'`,
      [searchTerm, searchTerm, searchTerm]
    );

    return {
      costumes: rows,
      total: Number(countRows[0].total),
      page,
      limit
    };
  }

  // STATS 
  static async getStats() {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) AS total_costumes,
        SUM(quantity) AS total_items,
        SUM(available_quantity) AS available_items,
        SUM(rental_count) AS total_rentals,
        AVG(daily_price) AS avg_price
      FROM costumes
      WHERE status != 'deleted'
    `);
    return rows[0];
  }
}

export default Costume;
