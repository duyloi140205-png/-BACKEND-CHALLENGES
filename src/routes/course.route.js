const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/course.controller');
const { importCourses, exportCourses } = require('../controllers/import_export.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

const courseValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

// Challenge 9: Import/Export — phải đặt TRƯỚC /:id để tránh conflict
router.post('/import', authMiddleware, roleMiddleware('admin', 'instructor'), upload.single('file'), importCourses);
router.get('/export', authMiddleware, roleMiddleware('admin', 'instructor'), exportCourses);

// Public: ai cũng xem được
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Protected: admin & instructor mới được tạo/sửa/xóa
router.post('/', authMiddleware, roleMiddleware('admin', 'instructor'), courseValidation, createCourse);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'instructor'), courseValidation, updateCourse);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteCourse);

module.exports = router;
