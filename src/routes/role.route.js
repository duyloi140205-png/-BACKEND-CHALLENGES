const express = require('express');
const router = express.Router();
const { getRoles, assignRole, getUsersByRole } = require('../controllers/role.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Tất cả routes đều cần auth + admin role
// GET /api/roles - Lấy danh sách roles
router.get('/', authMiddleware, roleMiddleware('admin'), getRoles);

// GET /api/roles/users - Lấy danh sách users theo role
router.get('/users', authMiddleware, roleMiddleware('admin'), getUsersByRole);

// PUT /api/roles/assign - Gán role cho user (admin only)
router.put('/assign', authMiddleware, roleMiddleware('admin'), assignRole);

module.exports = router;
