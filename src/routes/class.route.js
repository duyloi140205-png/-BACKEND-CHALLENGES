const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/class.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

const classValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('course_id').isInt({ min: 1 }).withMessage('course_id must be a valid number'),
];

// Public: ai cũng xem được
router.get('/', getAllClasses);
router.get('/:id', getClassById);

// Protected: admin & instructor mới được tạo/sửa/xóa
router.post('/', authMiddleware, roleMiddleware('admin', 'instructor'), classValidation, createClass);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'instructor'), classValidation, updateClass);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), deleteClass);

module.exports = router;
