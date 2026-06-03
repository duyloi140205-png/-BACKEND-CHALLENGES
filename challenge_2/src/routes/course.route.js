const express = require('express');
const { param, body } = require('express-validator');
const courseController = require('../controllers/course.controller');
const { handleValidationResult } = require('../middlewares/validation.middleware');
const router = express.Router();

router.get('/', courseController.getAll);

router.get('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  handleValidationResult
], courseController.getById);

router.post('/', [
  body('name').notEmpty().withMessage('Tên khóa học không được để trống'),
  body('price').isNumeric().withMessage('Giá tiền phải là số'),
  handleValidationResult
], courseController.create);

router.put('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  body('name').notEmpty().withMessage('Tên khóa học không được để trống'),
  body('price').isNumeric().withMessage('Giá tiền phải là số'),
  handleValidationResult
], courseController.update);

router.delete('/:id', [
  param('id').isUUID().withMessage('ID phải đúng định dạng UUID'),
  handleValidationResult
], courseController.delete);

module.exports = router;