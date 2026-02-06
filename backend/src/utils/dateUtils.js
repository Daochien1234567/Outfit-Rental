const dateUtils = {
  // Format date thành YYYY-MM-DD
  formatDate: (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Tính số ngày giữa hai ngày
  getDaysBetween: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Kiểm tra có phải ngày trong tương lai không
  isFutureDate: (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate >= today;
  },

  // Kiểm tra có phải ngày trong quá khứ không
  isPastDate: (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    return checkDate < today;
  },

  // Thêm ngày vào một ngày
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Lấy ngày đầu tháng
  getFirstDayOfMonth: (date = new Date()) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  // Lấy ngày cuối tháng
  getLastDayOfMonth: (date = new Date()) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  // Format thành string hiển thị
  formatDisplayDate: (date, includeTime = false) => {
    if (!date) return '';
    const d = new Date(date);
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('vi-VN', options);
  }
};

export default dateUtils;