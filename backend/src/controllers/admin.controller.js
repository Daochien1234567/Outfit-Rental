import User from '../models/User.js';
import Costume from '../models/Costume.js';
import Rental from '../models/Rental.js';
import Penalty from '../models/Penalty.js';
import pool from '../config/database.js';
import upload from '../config/upload.js';

const adminController = {
  // QUẢN LÝ TRANG PHỤC 
  getAllCostumes: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {};

      if (req.query.category_id) filters.category_id = req.query.category_id;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.search) filters.search = req.query.search;

      const result = await Costume.findAll(filters, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Admin get costumes error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  // THIẾU: Lấy chi tiết trang phục
  getCostumeDetail: async (req, res) => {
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


  createCostume: [
    upload.array('images', 5),
    async (req, res) => {
      try {
        const {
          name, description, category_id, brand, size, color, material,
          daily_price, deposit_amount, original_value, quantity,
          item_condition = 'good'
        } = req.body;

        // Xử lý ảnh
        const images = req.files ? req.files.map(file => ({
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          originalname: file.originalname
        })) : [];

        // Tạo trang phục mới
        const costumeId = await Costume.create({
          name,
          description,
          category_id,
          brand,
          size,
          color,
          material,
          daily_price: parseFloat(daily_price),
          deposit_amount: parseFloat(deposit_amount),
          original_value: parseFloat(original_value),
          quantity: parseInt(quantity),
          item_condition,
          images
        });

        res.status(201).json({
          success: true,
          message: 'Tạo trang phục thành công',
          data: { id: costumeId }
        });
      } catch (error) {
        console.error('Create costume error:', error);
        res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }
    }
  ],

  updateCostume: [
    upload.array('images', 5),
    async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Xử lý ảnh nếu có upload mới
        if (req.files && req.files.length > 0) {
          const images = req.files.map(file => ({
            url: `/uploads/${file.filename}`,
            filename: file.filename,
            originalname: file.originalname
          }));
          updateData.images = JSON.stringify(images);
        }

        // Xóa trường rỗng
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === '' || updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Chuyển đổi kiểu dữ liệu số
        if (updateData.daily_price) updateData.daily_price = parseFloat(updateData.daily_price);
        if (updateData.deposit_amount) updateData.deposit_amount = parseFloat(updateData.deposit_amount);
        if (updateData.original_value) updateData.original_value = parseFloat(updateData.original_value);
        if (updateData.quantity) {
          updateData.quantity = parseInt(updateData.quantity);
          // Cập nhật available_quantity tương ứng
          updateData.available_quantity = updateData.quantity;
        }

        const updated = await Costume.update(id, updateData);
        if (!updated) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy trang phục'
          });
        }

        res.json({
          success: true,
          message: 'Cập nhật thành công'
        });
      } catch (error) {
        console.error('Update costume error:', error);
        res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }
    }
  ],

  deleteCostume: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Costume.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy trang phục'
        });
      }

      res.json({
        success: true,
        message: 'Đã xóa trang phục'
      });
    } catch (error) {
      console.error('Delete costume error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  // ========== QUẢN LÝ ĐƠN THUÊ ==========
  getAllRentals: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {};

      if (req.query.status) filters.status = req.query.status;
      if (req.query.payment_status) filters.payment_status = req.query.payment_status;
      if (req.query.start_date) filters.start_date = req.query.start_date;
      if (req.query.end_date) filters.end_date = req.query.end_date;
      if (req.query.search) filters.search = req.query.search;

      const result = await Rental.findAll(filters, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Admin get rentals error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getRentalDetail: async (req, res) => {
   try {
      const rental = await Rental.findById(req.params.id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra quyền truy cập
      if (req.user.role !== 'admin' && req.user.id !== rental.user_id) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      const rentalItems = await Rental.getRentalWithItems(req.params.id);

      res.json({
        success: true,
        data: {
          rental,
          items: rentalItems
        }
      });
    } catch (error) {
      console.error('Get rental error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },



  confirmRentalDelivery: async (req, res) => {
    try {
      const { id } = req.params;
      
      const updated = await Rental.updateStatus(id, 'out_for_delivery');
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      res.json({
        success: true,
        message: 'Đã xác nhận giao đơn thuê'
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  confirmDelivery: async (req, res) => {
    try {
      const { id } = req.params;
      
      const updated = await Rental.updateStatus(id, 'renting');
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      res.json({
        success: true,
        message: 'Đã xác nhận nhận đơn thuê'
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  completeReturn: async (req, res) => {
    try {
      const { id } = req.params;
      
      const updated = await Rental.updateStatus(id, 'overdue');
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      res.json({
        success: true,
        message: 'Đã xác nhận quá hạn đơn thuê'
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  completeRental: async (req, res) => {
    try {
      const { id } = req.params;
      
      const updated = await Rental.updateStatus(id, 'completed');
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      res.json({
        success: true,
        message: 'Đã xác nhận trả đơn thuê'
      });
    } catch (error) {
      console.error('Confirm delivery error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  processReturn: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const { items, return_date, admin_notes } = req.body;

      // Lấy thông tin đơn thuê
      const rentalItems = await Rental.getRentalWithItems(id);
      if (rentalItems.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      const rental = rentalItems[0];
      
      // Kiểm tra trạng thái
      if (!['returned', 'overdue'].includes(rental.rental_status)) {
        return res.status(400).json({
          success: false,
          message: 'Đơn thuê chưa được yêu cầu trả'
        });
      }

      let totalLateFee = 0;
      let totalDamageFee = 0;
      const today = new Date();

      // Xử lý từng item
      for (const item of rentalItems) {
        const itemData = items.find(i => i.costume_id === item.costume_id);
        
        if (!itemData) {
          throw new Error(`Thiếu thông tin trả cho trang phục: ${item.costume_name}`);
        }

        // Tính phí trễ hạn
        const returnDate = new Date(return_date || today);
        const dueDate = new Date(rental.due_date);
        
        if (returnDate > dueDate) {
          const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
          const lateFee = await Penalty.calculateLateFee(
            item.rental_days,
            item.daily_price,
            overdueDays
          );
          totalLateFee += lateFee;

          await connection.execute(
            'UPDATE rental_items SET late_fee = ? WHERE id = ?',
            [lateFee, item.id]
          );
        }

        // Tính phí hư hỏng
        if (itemData.return_condition === 'minor_damage' || itemData.return_condition === 'major_damage') {
          const damageType = itemData.return_condition.split('_')[0]; // minor hoặc major
          const damageFee = await Penalty.calculateDamageFee(
            damageType,
            item.original_value || item.deposit_amount * 2
          );
          totalDamageFee += damageFee;

          await connection.execute(
            `UPDATE rental_items 
             SET return_condition = ?, damage_description = ?, damage_fee = ?
             WHERE id = ?`,
            [itemData.return_condition, itemData.damage_description, damageFee, item.id]
          );
        }

        // Nếu bị mất
        if (itemData.return_condition === 'lost') {
          const lostFee = await Penalty.calculateLostFee(
            item.original_value || item.deposit_amount * 2
          );
          totalDamageFee += lostFee;

          await connection.execute(
            `UPDATE rental_items 
             SET return_condition = 'lost', damage_fee = ?
             WHERE id = ?`,
            [lostFee, item.id]
          );
        }

        // Cập nhật số lượng có sẵn nếu không bị mất
        if (itemData.return_condition !== 'lost') {
          await Costume.updateAvailability(item.costume_id, item.quantity);
        }
      }

      // Tính tổng phí và hoàn cọc
      const totalFine = totalLateFee + totalDamageFee;
      const depositRefund = Math.max(0, rental.total_deposit - totalDamageFee);
      const additionalCharge = Math.max(0, totalFine - rental.total_deposit);

      // Cập nhật đơn thuê
      await Rental.addPenalty(id, {
        late_fee: totalLateFee,
        damage_fee: totalDamageFee
      });

      await Rental.completeReturn(
        id,
        return_date || today.toISOString().split('T')[0],
        depositRefund,
        additionalCharge
      );

      // Cập nhật admin notes
      if (admin_notes) {
        await connection.execute(
          'UPDATE rentals SET admin_notes = ? WHERE id = ?',
          [admin_notes, id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Đã xử lý trả đồ thành công',
        data: {
          total_late_fee: totalLateFee,
          total_damage_fee: totalDamageFee,
          total_fine: totalFine,
          deposit_refund: depositRefund,
          additional_charge: additionalCharge
        }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Process return error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi server'
      });
    } finally {
      connection.release();
    }
  },

  applyPenalty: async (req, res) => {
    try {
      const { id } = req.params;
      const { penalty_type, amount, description } = req.body;

      const rental = await Rental.findById(id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Thêm phí phạt
      const penaltyData = {};
      if (penalty_type === 'late') penaltyData.late_fee = amount;
      if (penalty_type === 'damage') penaltyData.damage_fee = amount;
      if (penalty_type === 'other') penaltyData.other_fees = amount;

      await Rental.addPenalty(id, penaltyData);

      // Ghi chú
      if (description) {
        const currentNotes = rental.admin_notes || '';
        await pool.execute(
          'UPDATE rentals SET admin_notes = ? WHERE id = ?',
          [`${currentNotes}\n[Phạt: ${penalty_type}] ${description}`, id]
        );
      }

      res.json({
        success: true,
        message: 'Đã áp dụng phí phạt'
      });
    } catch (error) {
      console.error('Apply penalty error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  // ========== QUẢN LÝ PHẠT & CỌC ==========
  getPenaltyConfig: async (req, res) => {
    try {
      const penalties = await Penalty.findAll();
      
      res.json({
        success: true,
        data: penalties
      });
    } catch (error) {
      console.error('Get penalty config error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  updatePenaltyConfig: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await Penalty.update(id, updateData);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cấu hình phạt'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật thành công'
      });
    } catch (error) {
      console.error('Update penalty error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getDepositHistory: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const [deposits] = await pool.query(
        `SELECT r.id as rental_id, r.total_deposit, r.deposit_refund,
                r.created_at, r.return_date, u.full_name, u.email,
                (r.total_deposit - COALESCE(r.deposit_refund, 0)) as pending_refund
         FROM rentals r
         JOIN users u ON r.user_id = u.id
         WHERE r.payment_status = 'paid'
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const [countRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM rentals WHERE payment_status = "paid"'
      );

      res.json({
        success: true,
        data: {
          deposits,
          pagination: {
            page,
            limit,
            total: countRows[0].total,
            pages: Math.ceil(countRows[0].total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get deposit history error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  processDepositRefund: async (req, res) => {
    try {
      const { rental_id, refund_amount, method, notes } = req.body;

      const rental = await Rental.findById(rental_id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra số tiền có thể hoàn
      const maxRefund = rental.total_deposit - (rental.damage_fee || 0);
      if (refund_amount > maxRefund) {
        return res.status(400).json({
          success: false,
          message: `Số tiền hoàn vượt quá giới hạn. Tối đa: ${maxRefund}`
        });
      }

      // Cập nhật deposit_refund
      await pool.execute(
        'UPDATE rentals SET deposit_refund = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [refund_amount, rental_id]
      );

      // Tạo payment record cho hoàn tiền
      const refund_id = `REF${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      await pool.execute(
        `INSERT INTO payments (id, rental_id, user_id, amount, payment_method, payment_type, status)
         VALUES (?, ?, ?, ?, ?, 'refund', 'pending')`,
        [refund_id, rental_id, rental.user_id, -refund_amount, method]
      );

      res.json({
        success: true,
        message: 'Đã xử lý hoàn cọc',
        data: { refund_id }
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  // ========== BÁO CÁO ==========
  getOverviewReport: async (req, res) => {
    try {
      const [costumeStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_costumes,
          SUM(available_quantity) as available_items,
          SUM(rental_count) as total_rentals,
          SUM(quantity * original_value) as total_inventory_value
        FROM costumes 
        WHERE status != 'deleted'
      `);

      const [rentalStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_rentals,
          SUM(total_amount_paid) as total_revenue,
          SUM(total_deposit) as total_deposit_collected,
          COUNT(CASE WHEN rental_status = 'renting' THEN 1 END) as active_rentals,
          COUNT(CASE WHEN rental_status = 'overdue' THEN 1 END) as overdue_rentals,
          AVG(total_amount_paid) as avg_rental_value
        FROM rentals
        WHERE payment_status = 'paid'
      `);

      const [userStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'customer' THEN 1 END) as total_customers,
          SUM(total_spent) as total_customer_spending,
          AVG(total_spent) as avg_customer_spending
        FROM users
        WHERE status = 'active'
      `);

      // Thống kê theo ngày (7 ngày gần nhất)
      const [dailyStats] = await pool.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as rentals_count,
          SUM(total_amount_paid) as daily_revenue,
          AVG(total_amount_paid) as avg_per_rental
        FROM rentals
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND payment_status = 'paid'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      res.json({
        success: true,
        data: {
          costumes: costumeStats[0],
          rentals: rentalStats[0],
          users: userStats[0],
          daily_stats: dailyStats
        }
      });
    } catch (error) {
      console.error('Get overview report error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getRevenueReport: async (req, res) => {
    try {
      const { period = 'month', start_date, end_date } = req.query;
      
      let dateFormat, groupBy;
      switch (period) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          groupBy = 'DATE(created_at)';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          groupBy = 'YEARWEEK(created_at)';
          break;
        case 'month':
        default:
          dateFormat = '%Y-%m';
          groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
          break;
      }

      let query = `
        SELECT 
          DATE_FORMAT(created_at, ?) as period,
          COUNT(*) as rental_count,
          SUM(total_rental_fee) as rental_revenue,
          SUM(total_deposit) as deposit_collected,
          SUM(total_fine) as fine_revenue,
          SUM(total_amount_paid) as total_revenue,
          AVG(total_amount_paid) as avg_rental_value
        FROM rentals
        WHERE payment_status = 'paid'
      `;
      
      const params = [dateFormat];

      if (start_date) {
        query += ' AND created_at >= ?';
        params.push(start_date);
      }
      if (end_date) {
        query += ' AND created_at <= ?';
        params.push(end_date);
      }

      query += ` GROUP BY ${groupBy} ORDER BY period DESC`;

      const [revenueData] = await pool.execute(query, params);

      // Thống kê theo phương thức thanh toán
      const [paymentMethodStats] = await pool.execute(`
        SELECT 
          payment_method,
          COUNT(*) as transaction_count,
          SUM(total_amount_paid) as total_amount
        FROM rentals
        WHERE payment_status = 'paid'
        GROUP BY payment_method
        ORDER BY total_amount DESC
      `);

      res.json({
        success: true,
        data: {
          revenue_by_period: revenueData,
          payment_methods: paymentMethodStats
        }
      });
    } catch (error) {
      console.error('Get revenue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getTopCostumes: async (req, res) => {
    try {
      const { limit = 10, period = 'all' } = req.query;
      
      let dateCondition = '';
      if (period === 'month') {
        dateCondition = 'AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
      } else if (period === 'week') {
        dateCondition = 'AND r.created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
      }

      const [topCostumes] = await pool.query(`
        SELECT 
          c.id,
          c.name,
          c.brand,
          c.daily_price,
          c.rental_count,
          COUNT(DISTINCT r.id) as rental_times,
          SUM(r.total_amount_paid) as total_revenue,
          AVG(r.total_amount_paid) as avg_rental_value
        FROM costumes c
        LEFT JOIN rental_items ri ON c.id = ri.costume_id
        LEFT JOIN rentals r ON ri.rental_id = r.id
        WHERE c.status != 'deleted'
          ${dateCondition}
        GROUP BY c.id
        ORDER BY rental_times DESC, total_revenue DESC
        LIMIT ?
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: topCostumes
      });
    } catch (error) {
      console.error('Get top costumes error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getTopCustomers: async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const [topCustomers] = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.full_name,
          u.phone,
          u.total_rentals,
          u.total_spent,
          COUNT(DISTINCT r.id) as completed_rentals,
          MAX(r.created_at) as last_rental_date,
          AVG(r.total_amount_paid) as avg_spent_per_rental
        FROM users u
        LEFT JOIN rentals r ON u.id = r.user_id AND r.payment_status = 'paid'
        WHERE u.role = 'customer' AND u.status = 'active'
        GROUP BY u.id
        ORDER BY u.total_spent DESC, completed_rentals DESC
        LIMIT ?
      `, [parseInt(limit)]);

      res.json({
        success: true,
        data: topCustomers
      });
    } catch (error) {
      console.error('Get top customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  // ========== QUẢN LÝ NGƯỜI DÙNG ==========
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {};

      if (req.query.role) filters.role = req.query.role;
      if (req.query.status) filters.status = req.query.status;
      if (req.query.search) filters.search = req.query.search;

      const result = await User.findAll(page, limit, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['active', 'banned', 'inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      const updated = await User.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái người dùng thành: ${status}`
      });
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }
};

export default adminController;