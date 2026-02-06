import { body, param, query, validationResult } from 'express-validator';

const validationMiddleware = {
  // Validation cho register
  validateRegister: [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('full_name')
      .notEmpty()
      .withMessage('Họ tên không được để trống'),
    body('phone')
      .optional()
      .matches(/^[0-9]{10,11}$/)
      .withMessage('Số điện thoại không hợp lệ'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validation cho login
  validateLogin: [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validation cho tạo trang phục
  validateCreateCostume: [
    body('name').notEmpty().withMessage('Tên trang phục không được để trống'),
    body('category_id').isInt().withMessage('Danh mục không hợp lệ'),
    body('size')
      .isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'])
      .withMessage('Size không hợp lệ'),
    body('daily_price').isFloat({ min: 0 }).withMessage('Giá thuê phải lớn hơn 0'),
    body('deposit_amount').isFloat({ min: 0 }).withMessage('Tiền cọc phải lớn hơn 0'),
    body('original_value').isFloat({ min: 0 }).withMessage('Giá trị gốc phải lớn hơn 0'),
    body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
    body('item_condition').optional().isIn(['new', 'like_new', 'good', 'fair']),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validation cho tạo đơn thuê
  validateCreateRental: [
    body('items').isArray({ min: 1 }).withMessage('Phải có ít nhất một trang phục'),
    body('items.*.costume_id').isInt().withMessage('ID trang phục không hợp lệ'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
    body('rental_days').isInt({ min: 1 }).withMessage('Số ngày thuê phải lớn hơn 0'),
    body('start_date').isDate().withMessage('Ngày bắt đầu không hợp lệ'),
    body('payment_method').isIn(['cash', 'banking', 'momo', 'zalopay', 'vnpay']),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // Validation cho review
  validateReview: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1-5'),
    body('comment').optional().isString().isLength({ max: 1000 }),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }
      next();
    }
  ],

  // VALIDATION + ÉP KIỂU PAGINATION (QUAN TRỌNG)
  validatePagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page phải lớn hơn 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit phải từ 1-100'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // 👉 ÉP KIỂU TẠI ĐÂY
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

      req.query.page = page;
      req.query.limit = limit;

      // dùng chung nếu cần
      req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit
      };

      next();
    }
  ],

  // Middleware xử lý lỗi validation
  handleValidationErrors: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
};

export default validationMiddleware;
