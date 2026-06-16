const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản mới
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               name: { type: string, example: "Duy Loi" }
 *               email: { type: string, example: "duyloi@gmail.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       201: { description: Đăng ký thành công, gửi OTP về email }
 *       400: { description: Validation lỗi }
 *
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "duyloi@gmail.com" }
 *               password: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Đăng nhập thành công, trả về JWT token }
 *       401: { description: Sai thông tin đăng nhập }
 *
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy thông tin profile (cần đăng nhập)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Thông tin user }
 *       401: { description: Chưa đăng nhập }
 *
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng xuất (vô hiệu hóa token)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Đăng xuất thành công }
 */

// Challenge 3: Đăng ký & Đăng nhập
router.post('/register', register);
router.post('/login', login);

// Challenge 5: Profile (auth required) & Logout
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

module.exports = router;
