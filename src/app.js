const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// =============================================
// Swagger UI - chỉ deploy ở development/staging
// Không deploy ở production
// =============================================
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-Learning API Docs',
  }));
  console.log('📄 Swagger UI available at /api-docs');
}

// =============================================
// Health Check - Challenge 12
// =============================================
/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Kiểm tra trạng thái server
 *     responses:
 *       200:
 *         description: Server đang hoạt động bình thường
 *       503:
 *         description: Server hoặc DB có vấn đề
 */
app.get('/health', async (req, res) => {
  try {
    const sequelize = require('./config/database');
    await sequelize.authenticate();
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Routes
const authRoutes  = require('./routes/auth.route');   // Challenge 3: Register/Login/Profile
const otpRoutes   = require('./routes/otp.route');    // Challenge 4: Send-OTP/Verify-OTP
const classRoutes      = require('./routes/class.route');      // Challenge 2: CRUD Classes
const courseRoutes     = require('./routes/course.route');     // Challenge 2: CRUD Courses
const enrollmentRoutes = require('./routes/enrollment.route'); // Challenge 6: Enrollment
const roleRoutes       = require('./routes/role.route');       // Challenge 8: Role management
const cronRoutes       = require('./routes/cron.route');       // Challenge 10: Cron job

app.use('/api/auth',        authRoutes);
app.use('/api/auth',        otpRoutes);
app.use('/api/classes',     classRoutes);
app.use('/api/courses',     courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/roles',       roleRoutes);
app.use('/api/cron',        cronRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            violations: [{ field: 'file', message: 'File quá lớn, tối đa 2MB' }]
        });
    }
    // Multer file type error
    if (err.message === 'Chỉ chấp nhận file CSV') {
        return res.status(400).json({
            violations: [{ field: 'file', message: err.message }]
        });
    }
    // Multer boundary error (không có file)
    if (err.message && err.message.includes('Boundary not found')) {
        return res.status(400).json({
            violations: [{ field: 'file', message: 'Vui lòng upload file CSV' }]
        });
    }
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 3000;
const sequelize = require('./config/database');

// Kết nối DB và chạy server
sequelize.sync()
    .then(() => {
        console.log('✅ Database synced!');

        // Khởi động cron job
        const { startCronJob } = require('./services/scheduler.service');
        startCronJob();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Unable to sync database:', err);
    });

module.exports = app;