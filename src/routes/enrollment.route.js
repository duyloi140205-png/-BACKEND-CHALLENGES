const express = require('express');
const router = express.Router();
const {
  enroll,
  unenroll,
  listStudents,
  myClasses,
} = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// GET /api/enrollments/my-classes - Xem lớp đã đăng ký (student only)
// ⚠️ Phải đặt TRƯỚC /:class_id để tránh conflict
router.get('/my-classes', authMiddleware, roleMiddleware('student'), myClasses);

// GET /api/enrollments/:class_id/students - Xem danh sách học viên (admin & instructor)
router.get('/:class_id/students', authMiddleware, roleMiddleware('admin', 'instructor'), listStudents);

// POST /api/enrollments - Đăng ký lớp học (student only)
router.post('/', authMiddleware, roleMiddleware('student'), enroll);

// DELETE /api/enrollments/:class_id - Hủy đăng ký (student only)
router.delete('/:class_id', authMiddleware, roleMiddleware('student'), unenroll);

module.exports = router;
