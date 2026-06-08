const Enrollment = require('../models/enrollment.model');
const Class = require('../models/class.model');
const { User } = require('../models/user.model');

// POST /api/enrollments - Enroll student vào class
const enroll = async (req, res) => {
  try {
    const { class_id } = req.body;
    const user_id = req.user.userId;

    // Validate class_id
    if (!class_id || !Number.isInteger(Number(class_id)) || Number(class_id) < 1) {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'class_id phải là số nguyên hợp lệ' }],
      });
    }

    // Kiểm tra class tồn tại và đang active
    const cls = await Class.findByPk(class_id);
    if (!cls) {
      return res.status(404).json({
        violations: [{ field: 'class_id', message: 'Lớp học không tồn tại' }],
      });
    }

    if (cls.status !== 'active') {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'Lớp học không còn hoạt động' }],
      });
    }

    // Kiểm tra đã enroll chưa
    const existing = await Enrollment.findOne({ where: { user_id, class_id } });
    if (existing) {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'Bạn đã đăng ký lớp học này rồi' }],
      });
    }

    // Kiểm tra số lượng học viên tối đa
    const currentCount = await Enrollment.count({ where: { class_id } });
    if (cls.max_students && currentCount >= cls.max_students) {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'Lớp học đã đầy' }],
      });
    }

    // Tạo enrollment
    const enrollment = await Enrollment.create({ user_id, class_id });

    console.log(`[INFO] User ${user_id} enrolled in class ${class_id} at ${new Date().toISOString()}`);

    return res.status(201).json({
      status: 'success',
      message: 'Đăng ký lớp học thành công',
      data: {
        id: enrollment.id,
        user_id: enrollment.user_id,
        class_id: enrollment.class_id,
        enrolled_at: enrollment.enrolled_at,
      },
    });

  } catch (error) {
    console.error(`[ERROR] Enroll failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// DELETE /api/enrollments/:class_id - Unenroll student khỏi class
const unenroll = async (req, res) => {
  try {
    const class_id = parseInt(req.params.class_id);
    const user_id = req.user.userId;

    // Validate class_id
    if (isNaN(class_id) || class_id < 1) {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'class_id phải là số nguyên hợp lệ' }],
      });
    }

    // Kiểm tra enrollment tồn tại
    const enrollment = await Enrollment.findOne({ where: { user_id, class_id } });
    if (!enrollment) {
      return res.status(404).json({
        violations: [{ field: 'class_id', message: 'Bạn chưa đăng ký lớp học này' }],
      });
    }

    await enrollment.destroy();

    console.log(`[INFO] User ${user_id} unenrolled from class ${class_id} at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: 'Hủy đăng ký lớp học thành công',
    });

  } catch (error) {
    console.error(`[ERROR] Unenroll failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// GET /api/enrollments/:class_id/students - Lấy danh sách học viên trong class
const listStudents = async (req, res) => {
  try {
    const class_id = parseInt(req.params.class_id);

    // Validate class_id
    if (isNaN(class_id) || class_id < 1) {
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'class_id phải là số nguyên hợp lệ' }],
      });
    }

    // Kiểm tra class tồn tại
    const cls = await Class.findByPk(class_id);
    if (!cls) {
      return res.status(404).json({
        violations: [{ field: 'class_id', message: 'Lớp học không tồn tại' }],
      });
    }

    // Lấy danh sách học viên
    const enrollments = await Enrollment.findAll({
      where: { class_id },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      order: [['enrolled_at', 'ASC']],
    });

    const students = enrollments.map((e) => ({
      enrollment_id: e.id,
      enrolled_at: e.enrolled_at,
      student: e.student,
    }));

    console.log(`[INFO] Listed ${students.length} students in class ${class_id} at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách học viên thành công',
      data: {
        class_id,
        class_name: cls.name,
        total_students: students.length,
        students,
      },
    });

  } catch (error) {
    console.error(`[ERROR] List students failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// GET /api/enrollments/my-classes - Lấy danh sách class đã đăng ký của user
const myClasses = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const enrollments = await Enrollment.findAll({
      where: { user_id },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'start_date', 'end_date', 'max_students', 'status'],
        },
      ],
      order: [['enrolled_at', 'DESC']],
    });

    const classes = enrollments.map((e) => ({
      enrollment_id: e.id,
      enrolled_at: e.enrolled_at,
      class: e.class,
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách lớp học đã đăng ký thành công',
      data: classes,
    });

  } catch (error) {
    console.error(`[ERROR] My classes failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { enroll, unenroll, listStudents, myClasses };
