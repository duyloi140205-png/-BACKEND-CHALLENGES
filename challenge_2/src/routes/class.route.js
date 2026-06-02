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

const classValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('course_id').isInt({ min: 1 }).withMessage('course_id must be a valid number'),
];

router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.post('/', classValidation, createClass);
router.put('/:id', classValidation, updateClass);
router.delete('/:id', deleteClass);

module.exports = router;