const sequelize = require('../config/database');
const Enrollment = require('../models/enrollment.model');
const Class = require('../models/class.model');
const { User } = require('../models/user.model');

// POST /api/classes/:id/bulk-enroll
// Bulk enroll nhiều học viên vào lớp bằng danh sách email
// Dùng transaction: nếu 1 học viên lỗi → rollback toàn bộ
const bulkEnroll = async (req, res) => {
  const class_id = parseInt(req.params.id);
  const { emails } = req.body;

  // Validate class_id
  if (isNaN(class_id) || class_id < 1) {
    return res.status(400).json({
      violations: [{ field: 'class_id', message: 'class_id phải là số nguyên hợp lệ' }],
    });
  }

  // Validate emails array
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({
      violations: [{ field: 'emails', message: 'emails phải là mảng không rỗng' }],
    });
  }

  if (emails.length > 100) {
    return res.status(400).json({
      violations: [{ field: 'emails', message: 'Tối đa 100 học viên mỗi lần bulk enroll' }],
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((e) => !emailRegex.test(e));
  if (invalidEmails.length > 0) {
    return res.status(400).json({
      violations: invalidEmails.map((e) => ({
        field: 'emails',
        message: `Email không hợp lệ: ${e}`,
      })),
    });
  }

  // Bắt đầu transaction
  const transaction = await sequelize.transaction();

  try {
    // Kiểm tra class tồn tại và active
    const cls = await Class.findByPk(class_id, { transaction });
    if (!cls) {
      await transaction.rollback();
      return res.status(404).json({
        violations: [{ field: 'class_id', message: 'Lớp học không tồn tại' }],
      });
    }

    if (cls.status !== 'active') {
      await transaction.rollback();
      return res.status(400).json({
        violations: [{ field: 'class_id', message: 'Lớp học không còn hoạt động' }],
      });
    }

    // Kiểm tra sức chứa
    const currentCount = await Enrollment.count({ where: { class_id }, transaction });
    if (cls.max_students && currentCount + emails.length > cls.max_students) {
      await transaction.rollback();
      return res.status(400).json({
        violations: [{
          field: 'emails',
          message: `Lớp học chỉ còn ${cls.max_students - currentCount} chỗ trống, không đủ cho ${emails.length} học viên`,
        }],
      });
    }

    // Tìm tất cả users theo email trong 1 query
    const users = await User.findAll({
      where: { email: emails },
      transaction,
    });

    const foundEmails = users.map((u) => u.email);
    const notFoundEmails = emails.filter((e) => !foundEmails.includes(e));

    // Nếu có email không tồn tại → rollback
    if (notFoundEmails.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        violations: notFoundEmails.map((e) => ({
          field: 'emails',
          message: `Email không tồn tại trong hệ thống: ${e}`,
        })),
      });
    }

    // Kiểm tra tất cả users phải có role student
    const nonStudents = users.filter((u) => u.role !== 'student');
    if (nonStudents.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        violations: nonStudents.map((u) => ({
          field: 'emails',
          message: `${u.email} không phải student`,
        })),
      });
    }

    // Kiểm tra học viên đã enroll chưa
    const userIds = users.map((u) => u.id);
    const existingEnrollments = await Enrollment.findAll({
      where: { user_id: userIds, class_id },
      transaction,
    });

    if (existingEnrollments.length > 0) {
      const enrolledUserIds = existingEnrollments.map((e) => e.user_id);
      const enrolledEmails = users
        .filter((u) => enrolledUserIds.includes(u.id))
        .map((u) => u.email);
      await transaction.rollback();
      return res.status(400).json({
        violations: enrolledEmails.map((e) => ({
          field: 'emails',
          message: `${e} đã đăng ký lớp học này rồi`,
        })),
      });
    }

    // Tạo tất cả enrollments trong transaction
    const enrollmentData = users.map((u) => ({
      user_id: u.id,
      class_id,
    }));

    await Enrollment.bulkCreate(enrollmentData, { transaction });

    // Commit transaction
    await transaction.commit();

    console.log(`[INFO] Bulk enroll: ${emails.length} students enrolled in class ${class_id} by ${req.user.email} at ${new Date().toISOString()}`);

    return res.status(201).json({
      status: 'success',
      message: `Đăng ký thành công ${emails.length} học viên vào lớp ${cls.name}`,
      data: {
        class_id,
        class_name: cls.name,
        enrolled_count: emails.length,
        emails,
      },
    });

  } catch (error) {
    // Rollback nếu có lỗi bất ngờ
    await transaction.rollback();
    console.error(`[ERROR] Bulk enroll failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { bulkEnroll };
