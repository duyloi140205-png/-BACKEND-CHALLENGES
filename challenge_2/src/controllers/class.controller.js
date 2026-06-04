const Class = require('../models/class.model');
const Course = require('../models/course.model');
const { validationResult } = require('express-validator');

const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({ include: Course });
    res.json({ status: 'success', data: classes });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.id, { include: Course });
    if (!cls) return res.status(404).json({ status: 'error', message: 'Class not found' });
    res.json({ status: 'success', data: cls });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', violations: errors.array() });
    const course = await Course.findByPk(req.body.course_id);
    if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
    const cls = await Class.create(req.body);
    res.status(201).json({ status: 'success', data: cls });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', violations: errors.array() });
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ status: 'error', message: 'Class not found' });
    await cls.update(req.body);
    res.json({ status: 'success', data: cls });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findByPk(req.params.id);
    if (!cls) return res.status(404).json({ status: 'error', message: 'Class not found' });
    await cls.destroy();
    res.json({ status: 'success', message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { 
  getAll: getAllClasses, 
  getById: getClassById, 
  create: createClass, 
  update: updateClass, 
  delete: deleteClass 
};