const express = require('express');
const router = express.Router();
const { getCronJobStatus, triggerCronJob } = require('../controllers/cron.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// GET /api/cron/status - Xem trạng thái cron job (admin only)
router.get('/status', authMiddleware, roleMiddleware('admin'), getCronJobStatus);

// POST /api/cron/trigger - Kích hoạt cron job thủ công để test (admin only)
router.post('/trigger', authMiddleware, roleMiddleware('admin'), triggerCronJob);

module.exports = router;
