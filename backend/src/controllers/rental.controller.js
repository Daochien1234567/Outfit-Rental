import Rental from '../models/Rental.js';
import Costume from '../models/Costume.js';
import Penalty from '../models/Penalty.js';
import pool from '../config/database.js';
import generateId from '../utils/generateId.js';

const rentalController = {
  calculateRental: async (req, res) => {
    try {
      const { items, rental_days, start_date } = req.body;
      const userId = req.user.id;

      // Kiểm tra dữ liệu đầu vào
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất một trang phục'
        });
      }

      if (!rental_days || rental_days < 1) {
        return res.status(400).json({
          success: false,
          message: 'Số ngày thuê phải lớn hơn 0'
        });
      }

      if (!start_date) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ngày bắt đầu thuê'
        });
      }

      let totalRentalFee = 0;
      let totalDeposit = 0;
      const due_date = new Date(start_date);
      due_date.setDate(due_date.getDate() + parseInt(rental_days));

      // Kiểm tra từng item
      const itemDetails = [];
      for (const item of items) {
        const costume = await Costume.findById(item.costume_id);
        if (!costume) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy trang phục ID: ${item.costume_id}`
          });
        }

        // Kiểm tra số lượng có sẵn
        if (costume.available_quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Trang phục "${costume.name}" chỉ còn ${costume.available_quantity} cái`
          });
        }

        // Tính phí cho item
        const rentalFee = costume.daily_price * rental_days * item.quantity;
        const itemDeposit = costume.deposit_amount * item.quantity;

        totalRentalFee += rentalFee;
        totalDeposit += itemDeposit;

        itemDetails.push({
          costume_id: costume.id,
          costume_name: costume.name,
          quantity: item.quantity,
          daily_price: costume.daily_price,
          deposit_amount: costume.deposit_amount,
          rental_fee: rentalFee,
          item_deposit: itemDeposit
        });
      }

      const totalAmount = totalRentalFee + totalDeposit;

      res.json({
        success: true,
        data: {
          summary: {
            total_items: items.length,
            rental_days: parseInt(rental_days),
            start_date,
            due_date: due_date.toISOString().split('T')[0],
            total_rental_fee: totalRentalFee,
            total_deposit: totalDeposit,
            total_amount: totalAmount
          },
          items: itemDetails
        }
      });
    } catch (error) {
      console.error('Calculate rental error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  createRental: async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { items, rental_days, start_date, payment_method } = req.body;
    const userId = req.user.id;

    console.log('Request body:', req.body); // DEBUG

    // ========== VALIDATION & TÍNH TOÁN ==========
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một trang phục');
    }

    if (!rental_days || rental_days < 1) {
      throw new Error('Số ngày thuê phải lớn hơn 0');
    }

    if (!start_date) {
      throw new Error('Vui lòng chọn ngày bắt đầu thuê');
    }

    if (!payment_method) {
      throw new Error('Vui lòng chọn phương thức thanh toán');
    }

    let totalRentalFee = 0;
    let totalDeposit = 0;
    const due_date = new Date(start_date);
    due_date.setDate(due_date.getDate() + parseInt(rental_days));

    // Kiểm tra và tính toán từng item
    const itemDetails = [];
    for (const item of items) {
      // Validate item
      if (!item.costume_id || !item.quantity || item.quantity < 1) {
        throw new Error('Thông tin trang phục không hợp lệ');
      }

      const [costumeRows] = await connection.execute(
        'SELECT * FROM costumes WHERE id = ? FOR UPDATE',
        [item.costume_id]
      );
      
      if (costumeRows.length === 0) {
        throw new Error(`Không tìm thấy trang phục ID: ${item.costume_id}`);
      }

      const costume = costumeRows[0];

      if (costume.available_quantity < item.quantity) {
        throw new Error(`Trang phục "${costume.name}" chỉ còn ${costume.available_quantity} cái`);
      }

      const rentalFee = costume.daily_price * rental_days * item.quantity;
      const itemDeposit = costume.deposit_amount * item.quantity;

      totalRentalFee += rentalFee;
      totalDeposit += itemDeposit;

      itemDetails.push({
        costume_id: costume.id,
        costume_name: costume.name,
        quantity: item.quantity,
        daily_price: costume.daily_price,
        deposit_amount: costume.deposit_amount,
        rental_fee: rentalFee,
        item_deposit: itemDeposit
      });
    }

    const totalAmount = totalRentalFee + totalDeposit;

    // ========== TẠO ĐƠN THUÊ ==========
    const rentalId = generateId.generateRentalId();

    // Xử lý giá trị payment_method
    const safePaymentMethod = payment_method || 'cash'; // Default value

    console.log('Insert rental with params:', {
      rentalId, userId, items: items.length, rental_days, start_date,
      due_date: due_date.toISOString().split('T')[0],
      totalRentalFee, totalDeposit, totalAmount,
      payment_method: safePaymentMethod
    });

    // Tạo đơn thuê
    const [rentalResult] = await connection.execute(
      `INSERT INTO rentals (
        id, user_id, total_items, rental_days, start_date, due_date,
        total_rental_fee, total_deposit, total_amount_paid,
        payment_status, rental_status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
      [
        rentalId, 
        userId, 
        items.length, 
        rental_days, 
        start_date, 
        due_date.toISOString().split('T')[0],
        totalRentalFee, 
        totalDeposit, 
        totalAmount,
        safePaymentMethod
      ]
    );

    // ========== TẠO RENTAL ITEMS ==========
    for (const item of itemDetails) {
      console.log('Insert rental item:', item); // DEBUG
      
      await connection.execute(
        `INSERT INTO rental_items 
         (rental_id, costume_id, quantity, daily_price, deposit_amount, rental_fee, item_deposit)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          rentalId, 
          item.costume_id, 
          item.quantity, 
          item.daily_price, 
          item.deposit_amount, 
          item.rental_fee, 
          item.item_deposit
        ]
      );

      // Update số lượng
      await connection.execute(
        `UPDATE costumes 
         SET available_quantity = available_quantity - ? 
         WHERE id = ?`,
        [item.quantity, item.costume_id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Đơn thuê đã được tạo thành công',
      data: {
        rental_id: rentalId,
        total_amount: totalAmount,
        payment_method: safePaymentMethod
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create rental error:', error);
    
    // Phân loại lỗi
    let statusCode = 500;
    let message = error.message || 'Lỗi server';
    
    if (error.message.includes('Không tìm thấy')) {
      statusCode = 404;
    } else if (error.message.includes('chỉ còn') || 
               error.message.includes('Vui lòng chọn') ||
               error.message.includes('Số ngày thuê') ||
               error.message.includes('phương thức thanh toán') ||
               error.message.includes('không hợp lệ')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: message
    });
  } finally {
    connection.release();
  }
},


  getUserRentals: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const userId = req.user.id;

      const result = await Rental.findByUserId(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get user rentals error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  getRentalById: async (req, res) => {
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

  cancelRental: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const rentalId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin đơn thuê
      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra quyền
      if (req.user.role !== 'admin' && rental.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền hủy đơn'
        });
      }

      // Kiểm tra trạng thái có thể hủy
      const canCancel = ['pending', 'confirmed'].includes(rental.rental_status);
      if (!canCancel) {
        return res.status(400).json({
          success: false,
          message: 'Đơn thuê không thể hủy ở trạng thái hiện tại'
        });
      }

      // Hủy đơn thuê
      await Rental.updateStatus(rentalId, 'cancelled');

      // Hoàn trả số lượng trang phục
      const [rentalItems] = await connection.execute(
        'SELECT costume_id, quantity FROM rental_items WHERE rental_id = ?',
        [rentalId]
      );

      for (const item of rentalItems) {
        await Costume.updateAvailability(item.costume_id, item.quantity);
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Đã hủy đơn thuê thành công'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Cancel rental error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    } finally {
      connection.release();
    }
  },

  extendRental: async (req, res) => {
    try {
      const { additional_days } = req.body;
      const rentalId = req.params.id;

      if (!additional_days || additional_days < 1) {
        return res.status(400).json({
          success: false,
          message: 'Số ngày gia hạn phải lớn hơn 0'
        });
      }

      // Lấy thông tin đơn thuê
      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra trạng thái
      if (rental.rental_status !== 'renting') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể gia hạn đơn thuê đang trong thời gian thuê'
        });
      }

      // Tính phí gia hạn
      const [rentalItems] = await pool.execute(
        'SELECT * FROM rental_items WHERE rental_id = ?',
        [rentalId]
      );

      let extensionFee = 0;
      for (const item of rentalItems) {
        extensionFee += item.daily_price * additional_days * item.quantity;
      }

      // Cập nhật đơn thuê
      const newDueDate = new Date(rental.due_date);
      newDueDate.setDate(newDueDate.getDate() + parseInt(additional_days));

      await pool.execute(
        `UPDATE rentals 
         SET rental_days = rental_days + ?, 
             due_date = ?,
             total_rental_fee = total_rental_fee + ?,
             total_amount_paid = total_amount_paid + ?,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [additional_days, newDueDate, extensionFee, extensionFee, rentalId]
      );

      res.json({
        success: true,
        message: 'Gia hạn thành công',
        data: {
          additional_days,
          extension_fee: extensionFee,
          new_due_date: newDueDate.toISOString().split('T')[0]
        }
      });
    } catch (error) {
      console.error('Extend rental error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  requestReturn: async (req, res) => {
    try {
      const rentalId = req.params.id;

      const rental = await Rental.findById(rentalId);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra trạng thái
      if (rental.rental_status !== 'renting' && rental.rental_status !== 'overdue') {
        return res.status(400).json({
          success: false,
          message: 'Đơn thuê không ở trạng thái có thể trả'
        });
      }

      // Cập nhật trạng thái
      await Rental.updateStatus(rentalId, 'returned');

      res.json({
        success: true,
        message: 'Đã gửi yêu cầu trả đồ thành công'
      });
    } catch (error) {
      console.error('Request return error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }
};

export default rentalController;