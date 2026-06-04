const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, UserAuth } = require('../models/user.model');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validator
    const violations = [];
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      violations.push({ field: 'email', message: 'Email không hợp lệ' });
    }
    if (!password || password.length < 6) {
      violations.push({ field: 'password', message: 'Password tối thiểu 6 ký tự' });
    }
    if (violations.length > 0) {
      return res.status(422).json({ status: 'error', violations });
    }

    // Kiểm tra email tồn tại
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        violations: [{ field: 'email', message: 'Email đã tồn tại' }]
      });
    }

    // Hash password và lưu DB
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email });
    await UserAuth.create({ user_id: user.id, password_hash: passwordHash });

    return res.status(201).json({
      status: 'success',
      data: { id: user.id, name, email }
    });

  } catch (error) {
    console.error('[Register Error]', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('[Login Failed] Email không tồn tại:', email);
      return res.status(401).json({ status: 'error', message: 'Email hoặc password không đúng' });
    }

    const userAuth = await UserAuth.findOne({ where: { user_id: user.id } });
    const isValid = await bcrypt.compare(password, userAuth.password_hash);
    if (!isValid) {
      console.error('[Login Failed] Sai password, email:', email);
      return res.status(401).json({ status: 'error', message: 'Email hoặc password không đúng' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      status: 'success',
      data: { token, user: { id: user.id, name: user.name, email: user.email } }
    });

  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'name', 'email', 'created_at']
    });
    return res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    console.error('[Profile Error]', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = { register, login, getProfile };