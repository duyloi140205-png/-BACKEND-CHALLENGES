const { User, UserAuth } = require('../models/user.model');
const { generateOTP } = require('../utils/otp.util');
const { sendOtpEmail } = require('../services/email.service');
const bcrypt = require('bcryptjs');

// POST /api/auth/send-otp
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Validator: format email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không hợp lệ' }]
      });
    }

    // Validator: email tồn tại
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không tồn tại trong hệ thống' }]
      });
    }

    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    if (!userAuth) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Tài khoản không tồn tại' }]
      });
    }

    // Kiểm tra tài khoản đã được xác thực chưa
    if (userAuth.is_verified) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Tài khoản đã được xác thực, không cần gửi lại OTP' }]
      });
    }

    const otpCode = generateOTP();
    const otpHash = await bcrypt.hash(otpCode, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    await userAuth.update({ otp_code: otpHash, otp_expiry: otpExpiry });

    try {
      await sendOtpEmail(email, otpCode);
      console.log(`[INFO] OTP sent to ${email} at ${new Date().toISOString()}`);
    } catch (emailError) {
      console.error(`[ERROR] SendGrid failed: ${emailError.message}`);
      return res.status(500).json({ message: 'Lỗi gửi email, vui lòng thử lại' });
    }

    return res.status(200).json({ message: 'OTP đã được gửi đến email của bạn' });

  } catch (error) {
    console.error(`[ERROR] Send OTP failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    // Validator: format email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không hợp lệ' }]
      });
    }

    // Validator: format OTP (phải là 6 chữ số)
    if (!otp_code || !/^\d{6}$/.test(otp_code)) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Mã OTP phải là 6 chữ số' }]
      });
    }

    // Kiểm tra email tồn tại
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không tồn tại trong hệ thống' }]
      });
    }

    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    if (!userAuth) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Tài khoản không tồn tại' }]
      });
    }

    // Kiểm tra tài khoản đã verified chưa
    if (userAuth.is_verified) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Tài khoản đã được xác thực rồi' }]
      });
    }

    // Kiểm tra OTP có tồn tại không
    if (!userAuth.otp_code) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Chưa có OTP, vui lòng gửi lại OTP' }]
      });
    }

    // Kiểm tra hết hạn TRƯỚC (quan trọng: check expiry trước sai mã)
    if (new Date() > userAuth.otp_expiry) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới' }]
      });
    }

    // Kiểm tra đúng mã
    const isOtpMatch = await bcrypt.compare(otp_code, userAuth.otp_code);
    if (!isOtpMatch) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Mã OTP không đúng' }]
      });
    }

    // Kích hoạt tài khoản
    await userAuth.update({ is_verified: true, otp_code: null, otp_expiry: null });

    console.log(`[INFO] OTP verified for ${email} at ${new Date().toISOString()}`);

    return res.status(200).json({ message: 'Xác thực tài khoản thành công. Tài khoản đã được kích hoạt!' });

  } catch (error) {
    console.error(`[ERROR] Verify OTP failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi xác thực OTP' });
  }
};

module.exports = { sendOtp, verifyOtp };