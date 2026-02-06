import crypto from 'crypto';

const generateId = {
  // Tạo mã đơn thuê: RENT + YYMMDD + 6 ký tự random
  generateRentalId: () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `RENT${year}${month}${day}${random}`;
  },

  // Tạo mã thanh toán
  generatePaymentId: () => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `PAY${timestamp}${random}`;
  },

  // Tạo mã hoàn tiền
  generateRefundId: () => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `REF${timestamp}${random}`;
  },

  // Tạo mã đánh giá
  generateReviewId: () => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `REV${timestamp}${random}`;
  }
};

export default generateId;