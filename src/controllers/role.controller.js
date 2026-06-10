const { User } = require('../models/user.model');

const VALID_ROLES = ['admin', 'instructor', 'student'];

// GET /api/roles - Lấy danh sách roles (admin only)
const getRoles = async (req, res) => {
  try {
    const roles = VALID_ROLES.map((role) => ({ name: role }));

    console.log(`[INFO] Admin ${req.user.email} listed roles at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách roles thành công',
      data: roles,
    });
  } catch (error) {
    console.error(`[ERROR] Get roles failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// PUT /api/roles/assign - Gán role cho user (admin only)
const assignRole = async (req, res) => {
  try {
    const { user_id, role } = req.body;

    // Validate input
    const violations = [];
    if (!user_id) {
      violations.push({ field: 'user_id', message: 'user_id là bắt buộc' });
    }
    if (!role) {
      violations.push({ field: 'role', message: 'role là bắt buộc' });
    } else if (!VALID_ROLES.includes(role)) {
      violations.push({ field: 'role', message: `role phải là một trong: ${VALID_ROLES.join(', ')}` });
    }
    if (violations.length > 0) {
      return res.status(400).json({ violations });
    }

    // Kiểm tra user tồn tại
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        violations: [{ field: 'user_id', message: 'Người dùng không tồn tại' }],
      });
    }

    // Không cho tự assign role cho chính mình
    if (user_id === req.user.userId) {
      return res.status(400).json({
        violations: [{ field: 'user_id', message: 'Không thể tự thay đổi role của chính mình' }],
      });
    }

    const oldRole = user.role;
    await user.update({ role });

    console.log(`[INFO] Admin ${req.user.email} assigned role "${role}" to user ${user.email} (was: ${oldRole}) at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: `Gán role thành công`,
      data: {
        user_id: user.id,
        name: user.name,
        email: user.email,
        old_role: oldRole,
        new_role: role,
      },
    });
  } catch (error) {
    console.error(`[ERROR] Assign role failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// GET /api/roles/users - Lấy danh sách users theo role (admin only)
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;

    const where = {};
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
          violations: [{ field: 'role', message: `role phải là một trong: ${VALID_ROLES.join(', ')}` }],
        });
      }
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'created_at'],
      order: [['role', 'ASC'], ['created_at', 'DESC']],
    });

    console.log(`[INFO] Admin ${req.user.email} listed users by role="${role || 'all'}" at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách người dùng thành công',
      data: users,
    });
  } catch (error) {
    console.error(`[ERROR] Get users by role failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { getRoles, assignRole, getUsersByRole };
