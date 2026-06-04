const { User, UserAuth } = require('../models/user.model');
const { generateOTP } = require('../utils/otp.util');
const { sendOtpEmail } = require('../services/email.service');

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không tồn tại' }]
      });
    }

    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    if (!userAuth) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Tài khoản không tồn tại' }]
      });
    }

    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await userAuth.update({ otp_code: otpCode, otp_expiry: otpExpiry });
    await sendOtpEmail(email, otpCode);

    console.log(`[INFO] OTP sent to ${email} at ${new Date().toISOString()}`);

    return res.status(200).json({ message: 'OTP đã được gửi đến email của bạn' });

  } catch (error) {
    console.error(`[ERROR] Send OTP failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi gửi email, vui lòng thử lại' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp_code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Email không tồn tại' }]
      });
    }

    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    if (!userAuth) {
      return res.status(400).json({
        violations: [{ field: 'email', message: 'Tài khoản không tồn tại' }]
      });
    }

    if (userAuth.otp_code !== otp_code) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Mã OTP không đúng' }]
      });
    }

    if (new Date() > userAuth.otp_expiry) {
      return res.status(400).json({
        violations: [{ field: 'otp_code', message: 'Mã OTP đã hết hạn' }]
      });
    }

    await userAuth.update({ is_verified: true, otp_code: null, otp_expiry: null });

    console.log(`[INFO] OTP verified for ${email} at ${new Date().toISOString()}`);

    return res.status(200).json({ message: 'Xác thực tài khoản thành công' });

  } catch (error) {
    console.error(`[ERROR] Verify OTP failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi xác thực OTP' });
  }
};

module.exports = { sendOtp, verifyOtp };