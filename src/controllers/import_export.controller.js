const Course = require('../models/course.model');
const { parseCsvBuffer, toCsvString } = require('../services/csv.service');

// POST /api/courses/import - Import courses từ CSV (admin/instructor only)
const importCourses = async (req, res) => {
  try {
    // Kiểm tra file tồn tại
    if (!req.file) {
      return res.status(400).json({
        violations: [{ field: 'file', message: 'Vui lòng upload file CSV' }],
      });
    }

    // Kiểm tra định dạng file
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({
        violations: [{ field: 'file', message: 'File phải có định dạng CSV' }],
      });
    }

    // Parse CSV
    let records;
    try {
      records = await parseCsvBuffer(req.file.buffer);
    } catch (parseError) {
      return res.status(400).json({
        violations: [{ field: 'file', message: 'File CSV không đúng định dạng' }],
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        violations: [{ field: 'file', message: 'File CSV không có dữ liệu' }],
      });
    }

    // Validate và import từng dòng
    const violations = [];
    const validRows = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // +2 vì dòng 1 là header
      const rowErrors = [];

      // Validate name
      if (!row.name || row.name.trim() === '') {
        rowErrors.push(`Dòng ${rowNum}: name là bắt buộc`);
      }

      // Validate price
      const price = parseFloat(row.price);
      if (row.price === undefined || row.price === '' || isNaN(price) || price < 0) {
        rowErrors.push(`Dòng ${rowNum}: price phải là số không âm`);
      }

      if (rowErrors.length > 0) {
        violations.push(...rowErrors.map((message) => ({ row: rowNum, message })));
      } else {
        validRows.push({
          name: row.name.trim(),
          description: row.description ? row.description.trim() : null,
          price: parseFloat(row.price),
          status: 'active',
        });
      }
    });

    // Nếu có lỗi validation, trả về violations
    if (violations.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Import thất bại: ${violations.length} dòng có lỗi`,
        violations,
      });
    }

    // Bulk insert
    const created = await Course.bulkCreate(validRows);

    console.log(`[INFO] User ${req.user.email} imported ${created.length} courses from CSV at ${new Date().toISOString()}`);

    return res.status(201).json({
      status: 'success',
      message: `Import thành công ${created.length} khóa học`,
      data: {
        imported: created.length,
        total_rows: records.length,
      },
    });

  } catch (error) {
    console.error(`[ERROR] Import courses failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// GET /api/courses/export?format=csv - Export courses ra CSV (admin/instructor only)
const exportCourses = async (req, res) => {
  try {
    const { format } = req.query;

    if (format && format !== 'csv') {
      return res.status(400).json({
        violations: [{ field: 'format', message: 'format chỉ hỗ trợ csv' }],
      });
    }

    // Lấy tất cả courses
    const courses = await Course.findAll({
      attributes: ['id', 'name', 'description', 'price', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    const columns = ['id', 'name', 'description', 'price', 'status', 'createdAt'];
    const csvContent = toCsvString(courses, columns);

    const filename = `courses_export_${new Date().toISOString().slice(0, 10)}.csv`;

    // Streaming response
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    console.log(`[INFO] User ${req.user.email} exported ${courses.length} courses to CSV at ${new Date().toISOString()}`);

    return res.status(200).send(csvContent);

  } catch (error) {
    console.error(`[ERROR] Export courses failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { importCourses, exportCourses };
