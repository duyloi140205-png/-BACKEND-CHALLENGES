const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, UserAuth } = require('../models/user.model');
const { generateOTP } = require('../utils/otp.util');
const { sendOtpEmail } = require('../services/email.service');
const { addToBlacklist } = require('../services/token.service');


// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const violations = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      violations.push({ field: 'email', message: 'Email không hợp lệ' });
    }
    if (!password || password.length < 6) {
      violations.push({ field: 'password', message: 'Password phải có ít nhất 6 ký tự' });
    }
    if (violations.length > 0) {
      return res.status(400).json({ violations });
    }

    // Kiểm tra email trùng lặp
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email đã được sử dụng' }]
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo User và UserAuth
    const user = await User.create({ name, email });
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
    await UserAuth.create({
      user_id: user.id,
      password_hash: passwordHash,
      otp_code: otpCode,
      otp_expiry: otpExpiry
    });

    // Tự động gửi OTP ngay sau register
    try {
      await sendOtpEmail(email, otpCode);
      console.log(`[INFO] OTP auto-sent after register to ${email} at ${new Date().toISOString()}`);
    } catch (emailError) {
      console.error(`[ERROR] Auto-send OTP failed: ${emailError.message}`);
      // Không fail toàn bộ request nếu email lỗi, user vẫn được tạo
    }

    console.log(`[INFO] User registered: ${email} at ${new Date().toISOString()}`);

    return res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực OTP.',
      data: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error(`[ERROR] Register failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const violations = [];
    if (!email) violations.push({ field: 'email', message: 'Email là bắt buộc' });
    if (!password) violations.push({ field: 'password', message: 'Password là bắt buộc' });
    if (violations.length > 0) {
      return res.status(400).json({ violations });
    }

    // Tìm user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        violations: [{ field: 'email', message: 'Email hoặc password không đúng' }]
      });
    }

    // Tìm auth record
    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    if (!userAuth) {
      return res.status(401).json({ message: 'Tài khoản không hợp lệ' });
    }

    // So sánh password
    const isMatch = await bcrypt.compare(password, userAuth.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        violations: [{ field: 'password', message: 'Email hoặc password không đúng' }]
      });
    }

    // Kiểm tra tài khoản đã xác thực chưa
    if (!userAuth.is_verified) {
      console.warn(`[WARN] Login blocked - account not verified: ${email} at ${new Date().toISOString()}`);
      return res.status(403).json({
        violations: [{ field: 'email', message: 'Tài khoản chưa được xác thực. Vui lòng xác thực OTP.' }]
      });
    }

    // Sinh JWT Access Token (hạn 1 giờ)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`[INFO] User logged in: ${email} (role: ${user.role}) at ${new Date().toISOString()}`);

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      access_token: token
    });

  } catch (error) {
    console.error(`[ERROR] Login failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// GET /api/auth/profile  (protected)
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'name', 'email', 'created_at']
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    return res.status(200).json({
      message: 'Lấy profile thành công',
      data: user
    });

  } catch (error) {
    console.error(`[ERROR] Get profile failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      addToBlacklist(token);
      console.log(`[INFO] User logged out: ${req.user.email} at ${new Date().toISOString()}`);
    }

    return res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error(`[ERROR] Logout failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { register, login, getProfile, logout };
