import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Kiểm tra admin đã tồn tại chưa
    const existingAdmin = await User.findByEmail(adminEmail);
    if (existingAdmin) {
      console.log(' Admin đã tồn tại, bỏ qua seed');
      return;
    }

    // 2. Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(adminPassword, salt);

    // 3. Tạo admin
    const adminId = await User.create({
      email: adminEmail,
      password_hash,
      full_name: 'Administrator',
      phone: '0000000000',
      address: 'System',
      role: 'admin' 
    });

    console.log(` Tạo admin thành công (ID: ${adminId})`);
  } catch (error) {
    console.error(' Lỗi tạo admin:', error);
  }
};

export default createAdmin;
