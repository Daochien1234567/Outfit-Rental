import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const authController = {
  register: async (req, res) => {
    try {
      const { email, password, full_name, phone, address } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }

      // Mã hóa mật khẩu
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Tạo user mới
      const userId = await User.create({
        email,
        password_hash,
        full_name,
        phone,
        address
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: { id: userId }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Tìm user
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Kiểm tra trạng thái tài khoản
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        });
      }

      // So sánh mật khẩu
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Ẩn password_hash trước khi trả về
      const { password_hash, ...userData } = user;

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: userData
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  logout: async (req, res) => {
    // Với JWT stateless, logout chỉ cần xóa token ở client
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { full_name, phone, address } = req.body;
      const updated = await User.update(req.user.id, {
        full_name,
        phone,
        address
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Cập nhật thất bại'
        });
      }

      const user = await User.findById(req.user.id);
      res.json({
        success: true,
        message: 'Cập nhật thành công',
        data: user
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      // Lấy thông tin user
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Kiểm tra mật khẩu hiện tại
      const isValid = await bcrypt.compare(current_password, user.password_hash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Mã hóa mật khẩu mới
      const salt = await bcrypt.genSalt(10);
      const new_password_hash = await bcrypt.hash(new_password, salt);

      // Cập nhật mật khẩu
      const updated = await User.updatePassword(req.user.id, new_password_hash);
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Đổi mật khẩu thất bại'
        });
      }

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server'
      });
    }
  }
};

export default authController;