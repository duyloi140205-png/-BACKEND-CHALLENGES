const express = require('express');
const { param, body } = require('express-validator');
const classController = require('../controllers/class.controller');
const { handleValidationResult } = require('../middlewares/validation.middleware');
const router = express.Router();

router.get('/', classController.getAll);

router.get('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  handleValidationResult
], classController.getById);

router.post('/', [
  body('name').notEmpty().withMessage('Tên lớp học không được để trống'),
  body('course_id').isUUID().withMessage('course_id phải đúng định dạng UUID'),
  handleValidationResult
], classController.create);

router.put('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  body('name').notEmpty().withMessage('Tên lớp học không được để trống'),
  body('course_id').isUUID().withMessage('course_id phải đúng định dạng UUID'),
  handleValidationResult
], classController.update);

router.delete('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  handleValidationResult
], classController.delete);

module.exports = router;