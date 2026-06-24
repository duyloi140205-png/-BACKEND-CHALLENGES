const Course = require('../models/course.model');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// GET /api/courses?search=...&status=...&page=...&limit=...
const getAllCourses = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;

    // Validate query params
    const violations = [];
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    if (page && (isNaN(parseInt(page)) || parseInt(page) < 1)) {
      violations.push({ field: 'page', message: 'page phải là số nguyên lớn hơn 0' });
    }
    if (limit && (isNaN(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      violations.push({ field: 'limit', message: 'limit phải là số nguyên từ 1 đến 100' });
    }
    if (status && !['active', 'inactive'].includes(status)) {
      violations.push({ field: 'status', message: 'status phải là active hoặc inactive' });
    }
    if (violations.length > 0) {
      return res.status(400).json({ status: 'error', violations });
    }

    // Build where clause
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` }; // LIKE query (case-insensitive)
    }
    if (status) {
      where.status = status;
    }

    const offset = (pageNum - 1) * limitNum;

    // Query với pagination
    const { count, rows } = await Course.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limitNum);

    console.log(`[INFO] List courses - search="${search || ''}" status="${status || ''}" page=${pageNum} limit=${limitNum} total=${count} at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
      },
    });

  } catch (error) {
    console.error(`[ERROR] Get courses failed: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Lỗi server, vui lòng thử lại' });
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
