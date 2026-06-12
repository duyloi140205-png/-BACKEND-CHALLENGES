const { getCronStatus, sendDailyReminders } = require('../services/scheduler.service');

// GET /api/cron/status - Kiểm tra trạng thái cron job (admin only)
const getCronJobStatus = async (req, res) => {
  try {
    const status = getCronStatus();
    return res.status(200).json({
      status: 'success',
      message: 'Lấy trạng thái cron job thành công',
      data: {
        schedule: '0 0 * * * (UTC) = 7:00 AM UTC+7',
        isRunning: status.isRunning,
        lastRun: status.lastRun,
        lastResult: status.lastResult,
        totalSent: status.totalSent,
        totalFailed: status.totalFailed,
      },
    });
  } catch (error) {
    console.error(`[ERROR] Get cron status failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

// POST /api/cron/trigger - Kích hoạt cron job thủ công (admin only, để test)
const triggerCronJob = async (req, res) => {
  try {
    if (getCronStatus().isRunning) {
      return res.status(400).json({
        violations: [{ message: 'Cron job đang chạy, vui lòng chờ' }],
      });
    }

    // Chạy bất đồng bộ, không block response
    sendDailyReminders().catch((err) =>
      console.error(`[CRON] Trigger error: ${err.message}`)
    );

    console.log(`[INFO] Admin ${req.user.email} triggered cron job manually at ${new Date().toISOString()}`);

    return res.status(200).json({
      status: 'success',
      message: 'Cron job đã được kích hoạt thủ công',
    });
  } catch (error) {
    console.error(`[ERROR] Trigger cron failed: ${error.message}`);
    return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
  }
};

module.exports = { getCronJobStatus, triggerCronJob };
