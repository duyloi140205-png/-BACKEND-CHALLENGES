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

const courseValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', courseValidation, createCourse);
router.put('/:id', courseValidation, updateCourse);
router.delete('/:id', deleteCourse);

module.exports = router;