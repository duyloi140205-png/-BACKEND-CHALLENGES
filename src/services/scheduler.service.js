const cron = require('node-cron');
const { sendReminderEmail } = require('./email.service');
const { getReminderEmailHtml } = require('../templates/reminder.email');
const Enrollment = require('../models/enrollment.model');
const Class = require('../models/class.model');
const { User } = require('../models/user.model');

// Trạng thái cron job
const cronStatus = {
  isRunning: false,
  lastRun: null,
  lastResult: null,
  totalSent: 0,
  totalFailed: 0,
};

/**
 * Gửi email nhắc nhở cho tất cả học viên đã enroll
 */
const sendDailyReminders = async () => {
  console.log(`[CRON] Daily reminder started at ${new Date().toISOString()}`);
  cronStatus.isRunning = true;
  cronStatus.lastRun = new Date().toISOString();

  let sent = 0;
  let failed = 0;

  try {
    // Lấy tất cả học viên đã enroll (unique users)
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name', 'email'],
          where: { role: 'student' },
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'start_date', 'end_date', 'status'],
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    // Group enrollments theo user
    const userMap = {};
    for (const enrollment of enrollments) {
      if (!enrollment.student) continue;
      const userId = enrollment.student.id;
      if (!userMap[userId]) {
        userMap[userId] = {
          student: enrollment.student,
          classes: [],
        };
      }
      if (enrollment.class) {
        userMap[userId].classes.push(enrollment.class);
      }
    }

    // Gửi email cho từng user
    for (const userId of Object.keys(userMap)) {
      const { student, classes } = userMap[userId];
      if (classes.length === 0) continue;

      try {
        const html = getReminderEmailHtml({
          studentName: student.name || student.email,
          classes,
        });

        await sendReminderEmail(student.email, 'Nhắc nhở lớp học hôm nay 📚', html);
        sent++;
        console.log(`[CRON] Reminder sent to ${student.email}`);
      } catch (emailError) {
        failed++;
        console.error(`[CRON] Failed to send reminder to ${student.email}: ${emailError.message}`);
      }
    }

    cronStatus.lastResult = { sent, failed };
    cronStatus.totalSent += sent;
    cronStatus.totalFailed += failed;

    console.log(`[CRON] Daily reminder completed: sent=${sent}, failed=${failed} at ${new Date().toISOString()}`);

  } catch (error) {
    console.error(`[CRON] Daily reminder error: ${error.message}`);
    cronStatus.lastResult = { error: error.message };
  } finally {
    cronStatus.isRunning = false;
  }
};

/**
 * Khởi động cron job - chạy lúc 7:00 AM UTC+7 (= 0:00 UTC)
 * Cron expression: '0 0 * * *' (UTC) = 7:00 AM UTC+7
 */
const startCronJob = () => {
  // '0 0 * * *' = 00:00 UTC = 07:00 UTC+7
  const task = cron.schedule('0 0 * * *', sendDailyReminders, {
    timezone: 'UTC',
  });

  console.log('[CRON] Daily reminder scheduler started (runs at 7:00 AM UTC+7)');
  return task;
};

const getCronStatus = () => cronStatus;

module.exports = { startCronJob, sendDailyReminders, getCronStatus };
