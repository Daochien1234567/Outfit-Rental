import jwt from 'jsonwebtoken';

const authMiddleware = {
  // Middleware xác thực JWT
  authenticate: (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy token'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
  },

  // Middleware kiểm tra role
  authorize: (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Chưa xác thực'
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }

      next();
    };
  },

  // Middleware cho admin
  isAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Yêu cầu quyền admin'
      });
    }
    next();
  },

  // Middleware cho staff
  isStaff: (req, res, next) => {
    if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Yêu cầu quyền staff hoặc admin'
      });
    }
    next();
  },

  // Middleware cho customer
  isCustomer: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }
    next();
  }
};

export default authMiddleware;