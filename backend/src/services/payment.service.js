import axios from 'axios';
import crypto from 'crypto';

class PaymentService {
  constructor() {
    this.config = {
      momo: {
        partnerCode: process.env.MOMO_PARTNER_CODE,
        accessKey: process.env.MOMO_ACCESS_KEY,
        secretKey: process.env.MOMO_SECRET_KEY,
        endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create'
      },
      vnpay: {
        tmnCode: process.env.VNPAY_TMN_CODE,
        hashSecret: process.env.VNPAY_HASH_SECRET,
        endpoint: process.env.VNPAY_ENDPOINT || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
      },
      zalopay: {
        appId: process.env.ZALOPAY_APP_ID,
        key1: process.env.ZALOPAY_KEY1,
        key2: process.env.ZALOPAY_KEY2,
        endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create'
      }
    };
  }

  async createMomoPayment(orderId, amount, orderInfo, returnUrl, notifyUrl) {
    try {
      const { partnerCode, accessKey, secretKey, endpoint } = this.config.momo;
      
      const requestId = orderId;
      const extraData = '';
      
      // Tạo raw signature
      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=captureWallet`;
      
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');
      
      const requestBody = {
        partnerCode,
        accessKey,
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl: returnUrl,
        ipnUrl: notifyUrl,
        extraData,
        requestType: 'captureWallet',
        signature,
        lang: 'vi'
      };
      
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.resultCode === 0) {
        return {
          success: true,
          payment_url: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Momo payment error:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo thanh toán Momo'
      };
    }
  }

  async createVNPayPayment(orderId, amount, orderInfo, returnUrl) {
    try {
      const { tmnCode, hashSecret, endpoint } = this.config.vnpay;
      
      const createDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const expireDate = new Date(Date.now() + 15 * 60 * 1000) // 15 phút
        .toISOString().replace(/[-:]/g, '').split('.')[0];
      
      let vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: amount * 100, 
        vnp_CreateDate: createDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: '127.0.0.1',
        vnp_Locale: 'vn',
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: returnUrl,
        vnp_TxnRef: orderId,
        vnp_ExpireDate: expireDate
      };
      
      // Sắp xếp tham số theo thứ tự alphabet
      const sortedParams = Object.keys(vnpParams)
        .sort()
        .reduce((acc, key) => {
          acc[key] = vnpParams[key];
          return acc;
        }, {});
      
      // Tạo chuỗi hash
      const signData = Object.entries(sortedParams)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha512', hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      
      // Tạo payment URL
      const paymentUrl = `${endpoint}?${Object.entries(vnpParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')}&vnp_SecureHash=${signed}`;
      
      return {
        success: true,
        payment_url: paymentUrl
      };
    } catch (error) {
      console.error('VNPay payment error:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo thanh toán VNPay'
      };
    }
  }

  async verifyPayment(gateway, data) {
    try {
      switch (gateway) {
        case 'momo':
          return this.verifyMomoPayment(data);
        case 'vnpay':
          return this.verifyVNPayPayment(data);
        case 'zalopay':
          return this.verifyZaloPayPayment(data);
        default:
          return { success: false, message: 'Gateway không được hỗ trợ' };
      }
    } catch (error) {
      console.error('Verify payment error:', error);
      return { success: false, message: 'Lỗi xác thực thanh toán' };
    }
  }

  async verifyMomoPayment(data) {
    const { secretKey } = this.config.momo;
    const {
      amount, extraData, message, orderId, orderInfo,
      orderType, partnerCode, payType, requestId,
      responseTime, resultCode, transId, signature
    } = data;
    
    // Tạo raw signature để verify
    const rawSignature = `accessKey=${this.config.momo.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');
    
    if (signature === expectedSignature && resultCode === 0) {
      return {
        success: true,
        transaction_id: transId,
        amount: parseInt(amount),
        order_id: orderId
      };
    } else {
      return {
        success: false,
        message: 'Xác thực chữ ký thất bại'
      };
    }
  }

  async verifyVNPayPayment(data) {
    const { hashSecret } = this.config.vnpay;
    const secureHash = data.vnp_SecureHash;
    
    // Loại bỏ secure hash để tính toán
    delete data.vnp_SecureHash;
    delete data.vnp_SecureHashType;
    
    // Sắp xếp tham số
    const sortedParams = Object.keys(data)
      .sort()
      .filter(key => key.startsWith('vnp_'))
      .reduce((acc, key) => {
        acc[key] = data[key];
        return acc;
      }, {});
    
    // Tạo chuỗi hash
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const hmac = crypto.createHmac('sha512', hashSecret);
    const expectedSignature = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
    
    if (secureHash === expectedSignature && data.vnp_ResponseCode === '00') {
      return {
        success: true,
        transaction_id: data.vnp_TransactionNo,
        amount: parseInt(data.vnp_Amount) / 100, // Chia 100 để về đơn vị gốc
        order_id: data.vnp_TxnRef
      };
    } else {
      return {
        success: false,
        message: 'Xác thực VNPay thất bại'
      };
    }
  }

  async createBankTransferInfo(orderId, amount) {
    return {
      bank_name: process.env.BANK_NAME || 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
      account_number: process.env.BANK_ACCOUNT || '1234567890',
      account_name: process.env.BANK_ACCOUNT_NAME || 'CÔNG TY TNHH CHO THUÊ TRANG PHỤC',
      branch: process.env.BANK_BRANCH || 'Chi nhánh Hà Nội',
      amount: amount,
      content: `THUE${orderId}`,
      note: `Vui lòng chuyển khoản với nội dung: THUE${orderId}. Sau khi chuyển khoản, vui lòng liên hệ với chúng tôi để xác nhận thanh toán.`
    };
  }
}

export default new PaymentService();