const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../services/token.service');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[WARN] Auth failed - no token: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
      return res.status(401).json({
        message: 'Không có token xác thực. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Kiểm tra token đã bị logout chưa
    if (isBlacklisted(token)) {
      console.warn(`[WARN] Auth failed - token blacklisted: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
      return res.status(401).json({
        violations: [{ message: 'Token không hợp lệ. Vui lòng đăng nhập lại.' }]
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, iat, exp }

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn(`[WARN] Auth failed - token expired: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
      return res.status(401).json({
        violations: [{ message: 'Token đã hết hạn, vui lòng đăng nhập lại' }]
      });
    }
    console.warn(`[WARN] Auth failed - invalid token: ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
    return res.status(401).json({
      violations: [{ message: 'Token không hợp lệ' }]
    });
  }
};

module.exports = authMiddleware;
