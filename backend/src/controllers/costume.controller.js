import Costume from '../models/Costume.js';
import pool from '../config/database.js';

const costumeController = {
  // GET ALL 
  getAllCostumes: async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const filters = {};

      if (req.query.category_id) filters.category_id = req.query.category_id;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.available_only === 'true') filters.available_only = true;
      if (req.query.min_price) filters.min_price = Number(req.query.min_price);
      if (req.query.max_price) filters.max_price = Number(req.query.max_price);
      if (req.query.sizes) filters.sizes = req.query.sizes.split(',');
      if (req.query.search) filters.search = req.query.search;
      if (req.query.sort_by) filters.sort_by = req.query.sort_by;

      const result = await Costume.findAll(filters, page, limit);

      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Get costumes error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET BY ID
  getCostumeById: async (req, res) => {
    try {
      const costume = await Costume.findById(req.params.id);
      if (!costume) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy trang phục'
        });
      }

      // LIMIT 10 CỐ ĐỊNH → execute OK
      const [reviews] = await pool.execute(
        `
        SELECT r.*, u.full_name, u.email 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.costume_id = ? AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT 10
        `,
        [req.params.id]
      );

      const [ratingStats] = await pool.execute(
        `
        SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
        FROM reviews 
        WHERE costume_id = ? AND status = 'approved'
        `,
        [req.params.id]
      );

      res.json({
        success: true,
        data: {
          ...costume,
          reviews,
          rating: ratingStats[0] || { avg_rating: 0, total_reviews: 0 }
        }
      });
    } catch (error) {
      console.error('Get costume error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // SEARCH 
  searchCostumes: async (req, res) => {
    try {
      const q = req.query.q?.trim();
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập từ khóa tìm kiếm'
        });
      }

      const result = await Costume.search(q, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // RELATED 
  getRelatedCostumes: async (req, res) => {
    try {
      const costume = await Costume.findById(req.params.id);
      if (!costume) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy trang phục'
        });
      }

      const related = await Costume.findRelated(
        req.params.id,
        costume.category_id,
        4
      );

      res.json({ success: true, data: related });
    } catch (error) {
      console.error('Get related error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // GET REVIEWS 
  getReviews: async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // DÙNG query vì có LIMIT / OFFSET
      const [reviews] = await pool.query(
        `
        SELECT r.*, u.full_name, u.email 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.costume_id = ? AND r.status = 'pending'
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `,
        [req.params.id]
      );

      const [totalRows] = await pool.execute(
        `
        SELECT COUNT(*) as total
        FROM reviews
        WHERE costume_id = ? AND status = 'pending'
        `,
        [req.params.id]
      );

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            total: totalRows[0].total,
            pages: Math.ceil(totalRows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  },

  // CREATE REVIEW 
  createReview: async (req, res) => {
    try {
      const { rating, comment, images } = req.body;
      const userId = req.user.id;
      const costumeId = req.params.id;

      const [rentalCheck] = await pool.execute(
        `
        SELECT COUNT(*) as has_rented
        FROM rental_items ri
        JOIN rentals r ON ri.rental_id = r.id
        WHERE ri.costume_id = ? 
          AND r.user_id = ? 
          AND r.rental_status = 'completed'
        `,
        [costumeId, userId]
      );

      if (rentalCheck[0].has_rented === 0) {
        return res.status(403).json({
          success: false,
          message: 'Bạn cần thuê trang phục này trước khi đánh giá'
        });
      }

      const [existingReview] = await pool.execute(
        'SELECT id FROM reviews WHERE user_id = ? AND costume_id = ?',
        [userId, costumeId]
      );

      if (existingReview.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đánh giá trang phục này rồi'
        });
      }

      const [latestRental] = await pool.execute(
        `
        SELECT ri.rental_id
        FROM rental_items ri
        JOIN rentals r ON ri.rental_id = r.id
        WHERE ri.costume_id = ?
          AND r.user_id = ?
          AND r.rental_status = 'completed'
        ORDER BY r.created_at DESC
        LIMIT 1
        `,
        [costumeId, userId]
      );

      const rental_id = latestRental[0]?.rental_id || null;

      const [result] = await pool.execute(
        `
        INSERT INTO reviews
        (user_id, costume_id, rental_id, rating, comment, images, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `,
        [userId, costumeId, rental_id, rating, comment, JSON.stringify(images)]
      );

      res.status(201).json({
        success: true,
        message: 'Đánh giá đã được gửi',
        data: { id: result.insertId }
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
};

export default costumeController;