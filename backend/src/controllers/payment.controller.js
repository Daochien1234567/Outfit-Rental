import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Rental from '../models/Rental.js';
import pool from '../config/database.js';

const paymentController = {
  createPayment: async (req, res) => {
    try {
      const { rental_id, payment_method } = req.body;
      
      // Lấy thông tin đơn thuê
      const rental = await Rental.findById(rental_id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra trạng thái thanh toán
      if (rental.payment_status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Đơn thuê đã được thanh toán'
        });
      }

      // Tạo payment_id
      const payment_id = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // Tạo payment URL dựa trên phương thức thanh toán
      let payment_url = null;
      let payment_data = null;

      switch(payment_method) {
        case 'momo':
          payment_url = await createMomoPayment(rental, payment_id);
          break;
        case 'vnpay':
          payment_url = await createVNPayPayment(rental, payment_id);
          break;
        case 'zalopay':
          payment_url = await createZaloPayPayment(rental, payment_id);
          break;
        case 'banking':
          payment_data = await createBankTransferPayment(rental, payment_id);
          break;
        case 'cash':
          // Thanh toán tiền mặt
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Phương thức thanh toán không hỗ trợ'
          });
      }

      // Lưu payment vào database
      await Payment.create({
        id: payment_id,
        rental_id,
        user_id: req.user.id,
        amount: rental.total_amount_paid,
        payment_method,
        payment_type: 'rental_fee',
        status: 'success'
      });

      // Cập nhật payment_id trong rental
      await pool.execute(
        'UPDATE rentals SET payment_id = ?, payment_method = ? WHERE id = ?',
        [payment_id, payment_method, rental_id]
      );

      res.json({
        success: true,
        data: {
          payment_id,
          payment_url,
          payment_data,
          amount: rental.total_amount_paid,
          payment_method
        }
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  handlePaymentWebhook: async (req, res) => {
    try {
      const { payment_method } = req.params;
      const payload = req.body;

      // Xác thực webhook
      const isValid = verifyWebhook(payment_method, payload);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const { payment_id, status, amount, transaction_id } = payload;

      // Cập nhật trạng thái payment
      await Payment.updateStatus(payment_id, status, transaction_id);

      // Nếu thanh toán thành công
      if (status === 'success') {
        // Lấy rental_id từ payment
        const payment = await Payment.findById(payment_id);
        if (payment) {
          // Cập nhật rental status
          await Rental.updatePaymentStatus(
            payment.rental_id, 
            'paid', 
            new Date()
          );

          // Cập nhật rental status thành confirmed
          await Rental.updateStatus(payment.rental_id, 'confirmed');
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  checkPaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giao dịch'
        });
      }

      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('Check payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  processRefund: async (req, res) => {
    try {
      const { rental_id, amount, reason } = req.body;

      // Lấy thông tin đơn thuê
      const rental = await Rental.findById(rental_id);
      if (!rental) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn thuê'
        });
      }

      // Kiểm tra quyền (chỉ admin)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền thực hiện hoàn tiền'
        });
      }

      // Tạo payment refund
      const refund_id = `REF${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      await Payment.create({
        id: refund_id,
        rental_id,
        user_id: req.user.id,
        amount: -amount, // Số âm để chỉ hoàn tiền
        payment_method: rental.payment_method,
        payment_type: 'refund',
        status: 'pending'
      });

      // Cập nhật rental
      await pool.execute(
        `UPDATE rentals 
         SET deposit_refund = ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [amount, rental_id]
      );

      // TODO: Gọi API hoàn tiền của payment gateway

      res.json({
        success: true,
        message: 'Yêu cầu hoàn tiền đã được gửi',
        data: { refund_id }
      });
    } catch (error) {
      console.error('Refund error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }
};

// Helper functions
async function createMomoPayment(rental, payment_id) {
  // TODO: Triển khai Momo payment integration
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  
  const amount = rental.total_amount_paid;
  const orderInfo = `Thanh toán đơn thuê ${rental.id}`;
  const returnUrl = `${process.env.BASE_URL}/payment/callback/momo`;
  const notifyUrl = `${process.env.BASE_URL}/api/payments/webhook/momo`;
  const extraData = '';
  
  // Tạo signature
  const rawSignature = `partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${payment_id}
  &amount=${amount}&orderId=${rental.id}&orderInfo=${orderInfo}&returnUrl=${returnUrl}
  &notifyUrl=${notifyUrl}&extraData=${extraData}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');
  
  // Trả về payment URL
  return `https://test-payment.momo.vn/gw_payment/transactionProcessor?partnerCode=${partnerCode}
  &accessKey=${accessKey}&requestId=${payment_id}&amount=${amount}&orderId=${rental.id}
  &orderInfo=${orderInfo}&returnUrl=${returnUrl}&notifyUrl=${notifyUrl}&extraData=${extraData}
  &signature=${signature}`;
}

async function createVNPayPayment(rental, payment_id) {
  // TODO: Triển khai VNPay integration
  return null;
}

async function createZaloPayPayment(rental, payment_id) {
  // TODO: Triển khai ZaloPay integration
  return null;
}

async function createBankTransferPayment(rental, payment_id) {
  const bankInfo = {
    bank_name: process.env.BANK_NAME || 'Ngân hàng ABC',
    account_number: process.env.BANK_ACCOUNT || '1234567890',
    account_name: process.env.BANK_ACCOUNT_NAME || 'Công ty cho thuê trang phục',
    amount: rental.total_amount_paid,
    content: `THUERENTAL ${rental.id}`
  };
  
  return bankInfo;
}

function verifyWebhook(gateway, payload) {
  // TODO: Triển khai xác thực webhook
  return true;
}

export default paymentController;