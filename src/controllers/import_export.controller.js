const Course = require('../models/course.model');
const { User } = require('../models/user.model');
const { parseCsvBuffer, toCsvString } = require('../services/csv.service');

// POST /api/courses/import - Import courses từ CSV (admin/instructor only)
// Mẫu CSV: title, description, instructor_email
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

    // Validate từng dòng
    const violations = [];
    const validRows = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let index = 0; index < records.length; index++) {
      const row = records[index];
      const rowNum = index + 2; // +2 vì dòng 1 là header
      const rowErrors = [];

      // Validate title (bắt buộc)
      if (!row.title || row.title.trim() === '') {
        rowErrors.push(`Dòng ${rowNum}: title là bắt buộc`);
      }

      // Validate instructor_email (bắt buộc + format hợp lệ)
      if (!row.instructor_email || row.instructor_email.trim() === '') {
        rowErrors.push(`Dòng ${rowNum}: instructor_email là bắt buộc`);
      } else if (!emailRegex.test(row.instructor_email.trim())) {
        rowErrors.push(`Dòng ${rowNum}: instructor_email không hợp lệ`);
      } else {
        // Kiểm tra instructor tồn tại trong DB với role instructor hoặc admin
        const instructor = await User.findOne({
          where: { email: row.instructor_email.trim() },
        });
        if (!instructor) {
          rowErrors.push(`Dòng ${rowNum}: instructor_email "${row.instructor_email}" không tồn tại trong hệ thống`);
        } else if (!['instructor', 'admin'].includes(instructor.role)) {
          rowErrors.push(`Dòng ${rowNum}: "${row.instructor_email}" không phải giảng viên`);
        } else {
          // Gắn instructor_id nếu hợp lệ
          row._instructor_id = instructor.id;
        }
      }

      if (rowErrors.length > 0) {
        violations.push(...rowErrors.map((message) => ({ row: rowNum, message })));
      } else {
        validRows.push({
          name: row.title.trim(),
          description: row.description ? row.description.trim() : null,
          price: 0,
          status: 'active',
        });
      }
    }

    // Nếu có lỗi validation trả về violations
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

// GET /api/courses/export?format=csv - Export courses ra CSV streaming (admin/instructor only)
const exportCourses = async (req, res) => {
  try {
    const { format } = req.query;

    if (format && format !== 'csv') {
      return res.status(400).json({
        violations: [{ field: 'format', message: 'format chỉ hỗ trợ csv' }],
      });
    }

    const courses = await Course.findAll({
      attributes: ['id', 'name', 'description', 'price', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true,
    });

    // Map name -> title để export đúng format mẫu CSV
    const exportData = courses.map((c) => ({
      id: c.id,
      title: c.name,
      description: c.description || '',
      price: c.price,
      status: c.status,
      createdAt: c.createdAt,
    }));

    const columns = ['id', 'title', 'description', 'price', 'status', 'createdAt'];
    const csvContent = toCsvString(exportData, columns);

    const filename = `courses_export_${new Date().toISOString().slice(0, 10)}.csv`;

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
