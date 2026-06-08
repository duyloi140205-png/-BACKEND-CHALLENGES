const Course = require('../models/course.model');
const { validationResult } = require('express-validator');

// GET all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json({ status: 'success', data: courses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET course by id
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
    res.json({ status: 'success', data: course });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// POST create course
const createCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', violations: errors.array() });
    const course = await Course.create(req.body);
    res.status(201).json({ status: 'success', data: course });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// PUT update course
const updateCourse = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ status: 'error', violations: errors.array() });
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
    await course.update(req.body);
    res.json({ status: 'success', data: course });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// DELETE course
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ status: 'error', message: 'Course not found' });
    await course.destroy();
    res.json({ status: 'success', message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse };
