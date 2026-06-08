const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout } = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Challenge 3: Đăng ký & Đăng nhập
router.post('/register', register);
router.post('/login', login);

// Challenge 5: Profile (auth required) & Logout
router.get('/profile', authMiddleware, getProfile);
router.post('/logout', authMiddleware, logout);

module.exports = router;
