const errorHandler = {
  // Middleware xử lý lỗi 404
  notFound: (req, res, next) => {
    const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
    res.status(404);
    next(error);
  },

  // Middleware xử lý tất cả lỗi
  errorHandler: (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  },

  // Middleware xử lý lỗi async
  asyncHandler: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  },

  // Middleware xử lý lỗi database
  handleDatabaseError: (err, req, res, next) => {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đã tồn tại'
      });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu tham chiếu không tồn tại'
      });
    }

    next(err);
  }
};

export default errorHandler;